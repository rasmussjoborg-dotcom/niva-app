import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  getAnalysis,
  refreshAnalysis,
  unlockPremium,
  analyzePdf,
  getBids,
  createBid,
  type AnalysisData,
  type BidData,
} from "../../../lib/api";
import { useAuthStore } from "../../../lib/store";
import { Colors, formatSEK, Fonts } from "../../../lib/theme";

// Analysis sub-components
import { PriceInsightCard } from "../../../components/analysis/PriceInsightCard";
import { BrfScoreCard } from "../../../components/analysis/BrfScoreCard";
import { PremiumShowcase } from "../../../components/analysis/PremiumShowcase";
import { BrfAnalysisSection, type BrfData } from "../../../components/analysis/BrfAnalysisSection";
import { BidSimulator } from "../../../components/analysis/BidSimulator";
import { PaywallSheet } from "../../../components/PaywallSheet";

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [brfData, setBrfData] = useState<BrfData | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [simulations, setSimulations] = useState<BidData[]>([]);

  // ─── Data loading ────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    loadAnalysis();
  }, [id]);

  async function loadAnalysis() {
    try {
      const data = await getAnalysis(parseInt(id!));
      setAnalysis(data);
      setIsPremium(data.payment_status === "paid" || data.is_premium);

      // Load simulations
      const bids = await getBids(data.id).catch(() => []);
      setSimulations(bids);
    } catch (err) {
      console.error("Failed to load analysis:", err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    if (!analysis) return;
    setRefreshing(true);
    try {
      const updated = await refreshAnalysis(analysis.id);
      setAnalysis(updated);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [analysis]);

  // ─── Payment / unlock ─────────────────────────────────────
  async function handlePaymentComplete() {
    if (!analysis) return;
    setAnalyzing(true);
    try {
      await unlockPremium(analysis.id);
      const updated = await getAnalysis(analysis.id);
      setAnalysis(updated);
      setIsPremium(true);

      // Try BRF analysis
      try {
        const result = await analyzePdf(analysis.property_id);
        // Parse if needed
      } catch (pdfErr) {
        console.warn("BRF analysis skipped:", pdfErr);
      }
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setTimeout(() => setAnalyzing(false), 1500);
    }
  }

  async function handleSaveSimulation(bid: number, margin: number, grade: string) {
    if (!analysis) return;
    const sim = await createBid(analysis.id, bid);
    setSimulations((prev) => [sim, ...prev]);
  }

  // ─── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={Colors.gold} size="large" />
        <Text style={s.loadingText}>Hämtar bostadsdata...</Text>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={s.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={s.errorText}>Analysen hittades inte.</Text>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Tillbaka</Text>
        </Pressable>
      </View>
    );
  }

  const askingPrice = analysis.price ?? 0;

  // ─── Render ───────────────────────────────────────────────
  return (
    <View style={s.screen}>
      <Stack.Screen
        options={{
          title: analysis.address || "Analys",
          headerStyle: { backgroundColor: Colors.linen },
          headerTintColor: Colors.midnight,
          headerTitleStyle: { fontFamily: "DMSans_700Bold", fontSize: 16 },
        }}
      />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        {/* Hero image */}
        {analysis.image_url && (
          <Image
            source={{ uri: analysis.image_url }}
            style={s.heroImage}
            resizeMode="cover"
          />
        )}

        {/* Header: address + price */}
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.address}>{analysis.address}</Text>
            {analysis.brf_name && (
              <Text style={s.area}>{analysis.brf_name}</Text>
            )}
          </View>
          <View style={s.priceCol}>
            <Text style={s.priceLabel}>Begärt pris</Text>
            <Text
              style={[
                s.priceValue,
                askingPrice === 0 && { color: Colors.textMuted },
              ]}
            >
              {askingPrice > 0
                ? askingPrice >= 1_000_000
                  ? (askingPrice / 1_000_000).toFixed(2).replace(".00", "") + " milj"
                  : formatSEK(askingPrice)
                : "Ej satt"}
            </Text>
          </View>
        </View>

        {/* Price Insight Card */}
        {(analysis as any).fair_value ? (
          <PriceInsightCard
            askingPrice={askingPrice}
            fairValue={(analysis as any).fair_value}
          />
        ) : null}

        {/* BRF Score Card */}
        {analysis.grade && (
          <BrfScoreCard
            grade={analysis.grade}
            gradeColor={analysis.grade_color}
            isPremium={isPremium}
            paidAt={(analysis as any).paid_at}
            onUnlock={() => setShowPaywall(true)}
          />
        )}

        {/* Property details — Om bostaden */}
        <View style={s.detailCard}>
          <Text style={s.sectionLabel}>Om bostaden</Text>
          {[
            analysis.sqm ? { label: "Storlek", value: `${analysis.sqm}`, unit: "kvm" } : null,
            analysis.rooms ? { label: "Rum", value: `${analysis.rooms}`, unit: "rum" } : null,
            analysis.monthly_fee ? { label: "Månadsavgift", value: new Intl.NumberFormat("sv-SE").format(analysis.monthly_fee), unit: "kr/mån" } : null,
            (analysis.sqm && askingPrice > 0) ? { label: "Pris per kvm", value: new Intl.NumberFormat("sv-SE").format(Math.round(askingPrice / analysis.sqm)), unit: "kr/kvm" } : null,
          ]
            .filter(Boolean)
            .map((row) => (
              <View key={row!.label} style={s.detailRow}>
                <Text style={s.detailLabel}>{row!.label}</Text>
                <View style={s.detailRight}>
                  <Text style={s.detailValue}>{row!.value}</Text>
                  {row!.unit && <Text style={s.detailUnit}>{row!.unit}</Text>}
                </View>
              </View>
            ))}
        </View>

        {/* Premium gate */}
        {analyzing ? (
          <View style={s.analyzingBox}>
            <ActivityIndicator color={Colors.gold} size="large" />
            <Text style={s.analyzingText}>
              Analyserar {analysis.address}...
            </Text>
          </View>
        ) : !isPremium ? (
          <PremiumShowcase onUnlock={() => setShowPaywall(true)} />
        ) : (
          <>
            {/* BRF Analysis */}
            {brfData && (
              <BrfAnalysisSection data={brfData} analysisId={analysis.id} />
            )}

            {/* Bid Simulator */}
            <BidSimulator
              analysis={analysis}
              monthlyIncome={user?.income ?? 35_000}
              existingDebts={user?.other_debts ?? 0}
              userSavings={user?.savings ?? 500_000}
              loanPromise={user?.loan_promise ?? 8_000_000}
              simulations={simulations}
              onSaveSimulation={handleSaveSimulation}
            />
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Paywall */}
      <PaywallSheet
        isOpen={showPaywall}
        address={analysis.address || ""}
        onClose={() => setShowPaywall(false)}
        onPaymentComplete={handlePaymentComplete}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.linen },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.linen,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorText: { fontSize: 16, color: Colors.textSecondary, marginBottom: 16 },
  backBtn: { padding: 12 },
  backBtnText: { fontSize: 14, color: Colors.gold, fontFamily: "DMSans_700Bold" },

  // Hero
  heroImage: { width: "100%", height: 220, marginHorizontal: -20, marginBottom: 20 },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  address: {
    fontFamily: "InstrumentSerif_400Regular_Italic",
    fontSize: 24,
    lineHeight: 28,
    color: Colors.midnight,
  },
  area: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  priceCol: { alignItems: "flex-end", paddingLeft: 16 },
  priceLabel: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
    fontVariant: ["tabular-nums"],
  },

  // Detail card
  detailCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailRight: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  detailValue: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
    fontVariant: ["tabular-nums"],
  },
  detailUnit: { fontSize: 12, color: Colors.textMuted },

  // Analyzing
  analyzingBox: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  analyzingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
