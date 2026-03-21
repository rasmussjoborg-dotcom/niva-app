import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  getAnalysis,
  getBids,
  updateBidSession,
  type AnalysisData,
  type BidData,
} from "../../../lib/api";
import { Colors, formatSEK } from "../../../lib/theme";
import { NivaCard } from "../../../components/ui/NivaCard";

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [bids, setBids] = useState<BidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const a = await getAnalysis(parseInt(id!));
      setAnalysis(a);
      const existingBids = await getBids(a.id).catch(() => []);
      setBids(existingBids);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleOutcome(result: "won" | "lost") {
    setOutcome(result);
    if (result === "won") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  const highestBid = bids.length > 0 ? bids[0] : null;
  const totalBids = bids.length;
  const totalIncrease = bids.length >= 2
    ? bids[0].amount - bids[bids.length - 1].amount
    : 0;

  return (
    <View style={s.screen}>
      <Stack.Screen
        options={{
          title: "Resultat",
          headerStyle: { backgroundColor: Colors.linen },
          headerTintColor: Colors.midnight,
          headerTitleStyle: { fontFamily: "DMSans_700Bold", fontSize: 16 },
        }}
      />
      <ScrollView contentContainerStyle={s.content}>
        {/* Outcome selection */}
        {!outcome ? (
          <NivaCard style={s.outcomeCard}>
            <Text style={s.outcomeTitle}>Hur gick budgivningen?</Text>
            <Text style={s.outcomeSubtext}>
              Registrera utfallet för att spara i din historik
            </Text>
            <View style={s.outcomeRow}>
              <Pressable
                onPress={() => handleOutcome("won")}
                style={[s.outcomeBtn, s.wonBtn]}
              >
                <Text style={s.wonEmoji}>🏠</Text>
                <Text style={s.wonText}>Vann!</Text>
              </Pressable>
              <Pressable
                onPress={() => handleOutcome("lost")}
                style={[s.outcomeBtn, s.lostBtn]}
              >
                <Text style={s.lostEmoji}>✗</Text>
                <Text style={s.lostText}>Förlorade</Text>
              </Pressable>
            </View>
          </NivaCard>
        ) : (
          <NivaCard
            style={[
              s.resultCard,
              outcome === "won" ? s.wonResultCard : s.lostResultCard,
            ]}
          >
            <Text style={s.resultEmoji}>
              {outcome === "won" ? "🏠" : ""}
            </Text>
            <Text style={s.resultTitle}>
              {outcome === "won"
                ? "Grattis! Du vann budgivningen!"
                : "Tyvärr gick bostaden till någon annan"}
            </Text>
            <Text style={s.resultSub}>
              {outcome === "won"
                ? "Dags att kontakta banken och sätta igång."
                : "Ge inte upp — rätt bostad kommer."}
            </Text>
          </NivaCard>
        )}

        {/* Summary stats */}
        <NivaCard style={s.statsCard}>
          <Text style={s.sectionLabel}>Sammanfattning</Text>
          <View style={s.statsGrid}>
            <View style={s.statCell}>
              <Text style={s.statValue}>{totalBids}</Text>
              <Text style={s.statLabel}>Bud lagda</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statValue}>
                {highestBid ? formatSEK(highestBid.amount) : "–"}
              </Text>
              <Text style={s.statLabel}>Högsta bud</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statValue}>
                {totalIncrease > 0 ? "+" + formatSEK(totalIncrease) : "–"}
              </Text>
              <Text style={s.statLabel}>Total höjning</Text>
            </View>
          </View>
        </NivaCard>

        {/* Bid timeline */}
        {bids.length > 0 && (
          <NivaCard style={s.timelineCard}>
            <Text style={s.sectionLabel}>
              Budhistorik
            </Text>
            {bids.map((bid, i) => (
              <View
                key={bid.id}
                style={[
                  s.timelineRow,
                  i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border },
                ]}
              >
                <Text style={s.timelineTime}>
                  {new Date(bid.created_at).toLocaleTimeString("sv-SE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text style={s.timelineAmount}>{formatSEK(bid.amount)}</Text>
                {i > 0 && (
                  <Text style={s.timelineDelta}>
                    +{formatSEK(bid.amount - bids[i + 1 < bids.length ? i + 1 : i].amount)}
                  </Text>
                )}
              </View>
            ))}
          </NivaCard>
        )}

        {/* Back to analysis */}
        <Pressable
          onPress={() => router.push(`/analysis/${id}` as any)}
          style={s.backBtn}
        >
          <Text style={s.backBtnText}>← Tillbaka till analys</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.linen },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.linen,
  },
  content: { padding: 20 },

  // Outcome
  outcomeCard: { alignItems: "center", padding: 32, marginBottom: 20 },
  outcomeTitle: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
    marginBottom: 8,
  },
  outcomeSubtext: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  outcomeRow: { flexDirection: "row", gap: 16, width: "100%" },
  outcomeBtn: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  wonBtn: { backgroundColor: "rgba(61,122,58,0.08)", borderWidth: 1, borderColor: "rgba(61,122,58,0.2)" },
  lostBtn: { backgroundColor: "rgba(169,50,38,0.06)", borderWidth: 1, borderColor: "rgba(169,50,38,0.15)" },
  wonEmoji: { fontSize: 28, marginBottom: 8 },
  wonText: { fontSize: 16, fontFamily: "DMSans_700Bold", color: Colors.gradeGreen },
  lostEmoji: { fontSize: 28, marginBottom: 8, color: Colors.gradeRed },
  lostText: { fontSize: 16, fontFamily: "DMSans_700Bold", color: Colors.gradeRed },

  // Result
  resultCard: { alignItems: "center", padding: 32, marginBottom: 20 },
  wonResultCard: { borderWidth: 2, borderColor: Colors.gradeGreen },
  lostResultCard: { borderWidth: 1, borderColor: Colors.border },
  resultEmoji: { fontSize: 48, marginBottom: 16 },
  resultTitle: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
    textAlign: "center",
    marginBottom: 8,
  },
  resultSub: { fontSize: 14, color: Colors.textSecondary, textAlign: "center" },

  // Stats
  statsCard: { padding: 20, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCell: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
    fontVariant: ["tabular-nums"],
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: "center" },

  // Timeline
  timelineCard: { padding: 20, marginBottom: 20 },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
  },
  timelineTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontVariant: ["tabular-nums"],
    width: 50,
  },
  timelineAmount: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
    fontVariant: ["tabular-nums"],
    flex: 1,
  },
  timelineDelta: {
    fontSize: 12,
    color: Colors.gradeGreen,
    fontVariant: ["tabular-nums"],
  },

  // Back
  backBtn: { padding: 12, alignItems: "center" },
  backBtnText: { fontSize: 14, color: Colors.gold, fontFamily: "DMSans_700Bold" },
});
