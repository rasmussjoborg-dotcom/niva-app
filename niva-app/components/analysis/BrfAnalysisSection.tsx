import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../lib/theme";
import { NivaCard } from "../ui/NivaCard";

interface BrfField {
  value: number | string;
  page: number;
  context: string;
}

export interface BrfData {
  brf_loan_per_sqm: BrfField;
  brf_savings_per_sqm: BrfField;
  rate_sensitivity: BrfField;
  summary: string;
  analyzed_at: string;
  brf_name?: string;
}

interface Props {
  data: BrfData;
  analysisId: number;
}

function getHealth(label: string, val: number): "good" | "ok" | "warn" {
  if (label === "Skuldsättning") return val <= 5000 ? "good" : val <= 10000 ? "ok" : "warn";
  if (label === "Sparande") return val >= 1500 ? "good" : val >= 800 ? "ok" : "warn";
  // Rate sensitivity
  return val <= 200 ? "good" : val <= 500 ? "ok" : "warn";
}

const HEALTH_COLORS = { good: Colors.gradeGreen, ok: Colors.gradeYellow, warn: Colors.gradeRed };

export function BrfAnalysisSection({ data, analysisId }: Props) {
  const router = useRouter();

  const loanVal = typeof data.brf_loan_per_sqm.value === "number" ? data.brf_loan_per_sqm.value : 0;
  const saveVal = typeof data.brf_savings_per_sqm.value === "number" ? data.brf_savings_per_sqm.value : 0;
  const rateVal = parseInt(String(data.rate_sensitivity?.value || "0").replace(/[^0-9]/g, "")) || 0;

  const metrics = [
    { label: "Skuldsättning", value: loanVal ? new Intl.NumberFormat("sv-SE").format(loanVal) : String(data.brf_loan_per_sqm.value), unit: "kr/kvm", health: getHealth("Skuldsättning", loanVal) },
    { label: "Sparande", value: saveVal ? new Intl.NumberFormat("sv-SE").format(saveVal) : String(data.brf_savings_per_sqm.value), unit: "kr/kvm/år", health: getHealth("Sparande", saveVal) },
    { label: "Räntekänslighet", value: String(rateVal), unit: "kr/kvm vid +1%", health: getHealth("Ränte", rateVal) },
  ];

  return (
    <NivaCard style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.sectionLabel}>
          {(data.brf_name || "Föreningens ekonomi").toUpperCase()}
        </Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>✦ AI-analys</Text>
        </View>
      </View>

      {/* Metrics */}
      {metrics.map((m) => (
        <View key={m.label} style={s.metricRow}>
          <View style={s.metricLeft}>
            <View style={[s.dot, { backgroundColor: HEALTH_COLORS[m.health] }]} />
            <Text style={s.metricLabel}>{m.label}</Text>
          </View>
          <View style={s.metricRight}>
            <Text style={s.metricValue}>{m.value}</Text>
            <Text style={s.metricUnit}>{m.unit}</Text>
          </View>
        </View>
      ))}

      {/* AI Summary */}
      {data.summary ? (
        <View style={s.summaryBox}>
          <Text style={s.summaryText}>{data.summary}</Text>
        </View>
      ) : null}

      {/* AI Expert CTA */}
      <Pressable
        onPress={() => router.push(`/analysis/${analysisId}/chat` as any)}
        style={s.aiCta}
      >
        <Text style={s.aiCtaText}>✦ Fråga AI-experten</Text>
      </Pressable>
    </NivaCard>
  );
}

const s = StyleSheet.create({
  card: { padding: 20, marginBottom: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
  },
  badge: {
    backgroundColor: "rgba(193,163,104,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    color: Colors.gold,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metricLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, opacity: 0.85 },
  metricLabel: { fontSize: 14, color: Colors.textSecondary },
  metricRight: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  metricValue: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
    fontVariant: ["tabular-nums"],
  },
  metricUnit: { fontSize: 12, color: Colors.textMuted },
  summaryBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(193,163,104,0.06)",
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  aiCta: {
    marginTop: 16,
    backgroundColor: "rgba(193,163,104,0.12)",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  aiCtaText: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.gold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
