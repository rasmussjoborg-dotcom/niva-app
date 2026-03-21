import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { getAnalysis, calculateKALP, type AnalysisData, type KALPResult } from "../../../lib/api";
import { useAuthStore } from "../../../lib/store";
import { Colors, formatSEK, formatCompact } from "../../../lib/theme";
import { NivaCard } from "../../../components/ui/NivaCard";

export default function CalculatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState(3_000_000);
  const [ownFinancing, setOwnFinancing] = useState(500_000);
  const [interestRate, setInterestRate] = useState(4.0);
  const [result, setResult] = useState<KALPResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAnalysis(parseInt(id))
      .then((a) => {
        setAnalysis(a);
        setBid(a.price ?? 3_000_000);
        setOwnFinancing(Math.min(user?.savings ?? 500_000, a.price ?? 3_000_000));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function runCalc() {
    if (!analysis) return;
    setCalculating(true);
    try {
      const res = await calculateKALP({
        price: bid,
        monthly_fee: analysis.monthly_fee ?? 4500,
        income: user?.income ?? 35_000,
        savings: ownFinancing,
        other_debts: user?.other_debts ?? 0,
        interest_rate: interestRate,
      });
      setResult(res);
    } catch (e) {
      console.error("KALP calc failed:", e);
    } finally {
      setCalculating(false);
    }
  }

  // Auto-calculate on first load
  useEffect(() => {
    if (analysis && !result) runCalc();
  }, [analysis]);

  if (loading) {
    return (
      <View style={s.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  const resultColor = result
    ? result.grade === "green"
      ? Colors.gradeGreen
      : result.grade === "yellow"
        ? Colors.gradeYellow
        : Colors.gradeRed
    : Colors.textMuted;

  return (
    <View style={s.screen}>
      <Stack.Screen
        options={{
          title: "KALP-kalkylator",
          headerStyle: { backgroundColor: Colors.linen },
          headerTintColor: Colors.midnight,
          headerTitleStyle: { fontFamily: "DMSans_700Bold", fontSize: 16 },
        }}
      />
      <ScrollView contentContainerStyle={s.content}>
        {/* Result hero */}
        {result && (
          <NivaCard style={s.heroCard}>
            <Text style={s.heroLabel}>Marginal per månad</Text>
            <View style={s.heroRow}>
              <View style={[s.heroDot, { backgroundColor: resultColor }]} />
              <Text style={[s.heroValue, { color: resultColor }]}>
                {result.margin >= 0 ? "+" : ""}
                {formatSEK(result.margin)}
              </Text>
            </View>
            <Text style={s.heroSub}>
              {result.can_afford ? "Du har råd med denna bostad" : "Beloppet överstiger din budget"}
            </Text>
          </NivaCard>
        )}

        {/* Inputs */}
        <NivaCard style={s.inputCard}>
          <Text style={s.sectionLabel}>Inställningar</Text>

          <StepperInput
            label="Budpris"
            value={bid}
            step={50_000}
            format={formatCompact}
            onChange={setBid}
          />

          <StepperInput
            label="Egen insats"
            value={ownFinancing}
            step={25_000}
            format={formatCompact}
            onChange={setOwnFinancing}
          />

          <StepperInput
            label="Ränta"
            value={interestRate}
            step={0.25}
            format={(v) => v.toFixed(2) + " %"}
            onChange={setInterestRate}
          />
        </NivaCard>

        {/* Calculate button */}
        <Pressable
          onPress={runCalc}
          disabled={calculating}
          style={[s.calcBtn, calculating && { opacity: 0.6 }]}
        >
          <Text style={s.calcBtnText}>
            {calculating ? "Beräknar..." : "Beräkna"}
          </Text>
        </Pressable>

        {/* Breakdown */}
        {result && (
          <NivaCard style={s.breakdownCard}>
            <Text style={s.sectionLabel}>Månadsöversikt</Text>
            {[
              { label: "Nettoinkomst", value: formatSEK(result.net_income), positive: true },
              { label: "Boendekostnad", value: formatSEK(-result.monthly_cost) },
              { label: "Räntekostnad", value: formatSEK(-result.interest_cost) },
              { label: "Amortering", value: formatSEK(-result.amortization) },
              { label: "Ränteavdrag", value: formatSEK(result.tax_deduction), positive: true },
            ].map((row) => (
              <View key={row.label} style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>{row.label}</Text>
                <Text
                  style={[
                    s.breakdownValue,
                    row.positive && { color: Colors.gradeGreen },
                  ]}
                >
                  {row.value}
                </Text>
              </View>
            ))}

            <View style={s.loanSection}>
              <Text style={s.sectionLabel}>Lånedetaljer</Text>
              {[
                { label: "Lånebelopp", value: formatSEK(result.loan_amount) },
                {
                  label: "Belåningsgrad",
                  value: bid > 0 ? Math.round((result.loan_amount / bid) * 100) + " %" : "–",
                },
              ].map((row) => (
                <View key={row.label} style={s.breakdownRow}>
                  <Text style={s.breakdownLabel}>{row.label}</Text>
                  <Text style={s.breakdownValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </NivaCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Stepper Input ──────────────────────────────────────────
function StepperInput({
  label,
  value,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={s.stepperContainer}>
      <View style={s.stepperHeader}>
        <Text style={s.stepperLabel}>{label}</Text>
        <Text style={s.stepperValue}>{format(value)}</Text>
      </View>
      <View style={s.stepperRow}>
        <Pressable onPress={() => onChange(value - step)} style={s.stepperBtn}>
          <Text style={s.stepperBtnText}>−</Text>
        </Pressable>
        <View style={s.stepperTrack}>
          <View style={s.stepperFill} />
        </View>
        <Pressable onPress={() => onChange(value + step)} style={s.stepperBtn}>
          <Text style={s.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.linen },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.linen },
  content: { padding: 20 },

  heroCard: { alignItems: "center", padding: 24, marginBottom: 20 },
  heroLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroDot: { width: 12, height: 12, borderRadius: 6 },
  heroValue: { fontSize: 32, fontFamily: "DMSans_700Bold", fontVariant: ["tabular-nums"] },
  heroSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },

  inputCard: { padding: 20, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
    marginBottom: 16,
  },

  calcBtn: {
    backgroundColor: Colors.midnight,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  calcBtnText: { color: Colors.white, fontSize: 16, fontFamily: "DMSans_700Bold" },

  breakdownCard: { padding: 20 },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breakdownLabel: { fontSize: 14, color: Colors.textSecondary },
  breakdownValue: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    fontVariant: ["tabular-nums"],
    color: Colors.midnight,
  },
  loanSection: { marginTop: 20 },

  // Stepper
  stepperContainer: { marginBottom: 20 },
  stepperHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  stepperLabel: { fontSize: 14, color: Colors.textSecondary },
  stepperValue: { fontSize: 14, fontFamily: "DMSans_700Bold", color: Colors.midnight, fontVariant: ["tabular-nums"] },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: { fontSize: 20, fontFamily: "DMSans_700Bold", color: Colors.midnight },
  stepperTrack: { flex: 1, height: 4, backgroundColor: Colors.stone, borderRadius: 2 },
  stepperFill: { width: "50%", height: 4, backgroundColor: Colors.midnight, borderRadius: 2 },
});
