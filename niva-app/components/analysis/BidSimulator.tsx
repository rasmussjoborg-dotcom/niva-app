import React, { useState, useMemo } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { Colors, formatSEK, formatCompact } from "../../lib/theme";
import { NivaCard } from "../ui/NivaCard";
import type { AnalysisData } from "../../lib/api";

// ─── KALP Calculation (simplified inline) ──────────────────────
interface KalpResult {
  margin: number;
  grade: "green" | "yellow" | "red";
  gradeColor: string;
  loanAmount: number;
  ltv: number;
  amortizationRate: number;
  items: { label: string; amount: number; type: "income" | "expense" | "deduction" }[];
}

function calculateKalp(p: {
  monthlyIncome: number;
  bidPrice: number;
  ownFinancing: number;
  interestRate: number;
  brfFee: number;
  existingDebts: number;
}): KalpResult {
  const loanAmount = Math.max(0, p.bidPrice - p.ownFinancing);
  const ltv = p.bidPrice > 0 ? loanAmount / p.bidPrice : 0;
  const amortizationRate = ltv > 0.7 ? 2 : ltv > 0.5 ? 1 : 0;
  const monthlyInterest = (loanAmount * p.interestRate) / 12;
  const monthlyAmortization = (loanAmount * (amortizationRate / 100)) / 12;
  const monthlyDebt = (p.existingDebts * 0.01) / 12;
  const totalExpense = p.brfFee + monthlyInterest + monthlyAmortization + monthlyDebt;
  const margin = p.monthlyIncome - totalExpense;

  const grade = margin >= 5000 ? "green" as const : margin >= 0 ? "yellow" as const : "red" as const;
  const gradeColor = grade === "green" ? Colors.gradeGreen : grade === "yellow" ? Colors.gradeYellow : Colors.gradeRed;

  return {
    margin: Math.round(margin),
    grade,
    gradeColor,
    loanAmount,
    ltv,
    amortizationRate,
    items: [
      { label: "Nettoinkomst", amount: Math.round(p.monthlyIncome), type: "income" },
      { label: "Månadsavgift (BRF)", amount: -p.brfFee, type: "expense" },
      { label: "Ränta", amount: -Math.round(monthlyInterest), type: "expense" },
      { label: "Amortering", amount: -Math.round(monthlyAmortization), type: "expense" },
      ...(p.existingDebts > 0 ? [{ label: "Övriga lån", amount: -Math.round(monthlyDebt), type: "expense" as const }] : []),
      { label: "Ränteavdrag (30%)", amount: Math.round(monthlyInterest * 0.3), type: "deduction" },
    ],
  };
}

// ─── Types ──────────────────────────────────────────────────────
interface BidRecord {
  id: number;
  amount: number;
  kalp_margin?: number | null;
  kalp_grade?: string | null;
  created_at: string;
}

interface Props {
  analysis: AnalysisData;
  monthlyIncome: number;
  existingDebts: number;
  userSavings: number;
  loanPromise: number;
  simulations: BidRecord[];
  onSaveSimulation: (bid: number, margin: number, grade: string) => Promise<void>;
}

const TRAFFIC_COLORS: Record<string, string> = {
  green: Colors.gradeGreen,
  yellow: Colors.gradeYellow,
  red: Colors.gradeRed,
};

const TRAFFIC_LABELS: Record<string, string> = {
  green: "Inom budget",
  yellow: "Nära gräns",
  red: "Överbudget",
};

// ═══════════════════════════════════════════════════════════════
export function BidSimulator({
  analysis,
  monthlyIncome,
  existingDebts,
  userSavings,
  loanPromise,
  simulations,
  onSaveSimulation,
}: Props) {
  const askingPrice = analysis.price ?? 3_000_000;
  const fee = analysis.monthly_fee ?? 4500;

  const [bid, setBid] = useState(askingPrice);
  const [ownFinancing, setOwnFinancing] = useState(
    Math.min(userSavings || 500_000, askingPrice)
  );
  const [interestRate, setInterestRate] = useState(4.0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const result = useMemo(
    () =>
      calculateKalp({
        monthlyIncome,
        bidPrice: bid,
        ownFinancing,
        interestRate: interestRate / 100,
        brfFee: fee,
        existingDebts,
      }),
    [bid, ownFinancing, interestRate, monthlyIncome, fee, existingDebts]
  );

  const baseResult = useMemo(
    () =>
      calculateKalp({
        monthlyIncome,
        bidPrice: askingPrice,
        ownFinancing,
        interestRate: interestRate / 100,
        brfFee: fee,
        existingDebts,
      }),
    [askingPrice, ownFinancing, interestRate, monthlyIncome, fee, existingDebts]
  );

  const delta = result.margin - baseResult.margin;

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await onSaveSimulation(bid, result.margin, result.grade);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (e) {
      console.error("Failed to save simulation:", e);
    } finally {
      setSaving(false);
    }
  }

  const presets = [
    { label: "+5 %", amount: Math.round(askingPrice * 1.05) },
    { label: "+10 %", amount: Math.round(askingPrice * 1.1) },
    { label: "+15 %", amount: Math.round(askingPrice * 1.15) },
  ];

  return (
    <NivaCard style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.sectionLabel}>Bud-Simulator</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>✦ Interaktiv</Text>
        </View>
      </View>

      {/* Hero — Kvar i plånboken */}
      <View style={s.heroBox}>
        <Text style={s.heroLabel}>Kvar i plånboken</Text>
        <View style={s.heroValueRow}>
          <View style={[s.heroDot, { backgroundColor: result.gradeColor }]} />
          <Text style={[s.heroValue, { color: result.gradeColor }]}>
            {result.margin >= 0 ? "+" : ""}
            {formatSEK(result.margin)}
          </Text>
        </View>
        {bid !== askingPrice && (
          <Text style={s.heroDelta}>
            {delta >= 0 ? "▲" : "▼"} {delta >= 0 ? "+" : ""}
            {new Intl.NumberFormat("sv-SE").format(delta)} kr vs utgångspris
            <Text style={{ color: result.gradeColor, fontFamily: "DMSans_700Bold" }}>
              {" "}
              {TRAFFIC_LABELS[result.grade] || ""}
            </Text>
          </Text>
        )}
      </View>

      {/* Preset buttons */}
      <View style={s.presetRow}>
        <Pressable
          onPress={() => setBid(askingPrice)}
          style={[s.presetBtn, bid === askingPrice && s.presetActive]}
        >
          <Text style={[s.presetText, bid === askingPrice && s.presetActiveText]}>
            ↺
          </Text>
        </Pressable>
        {presets.map(({ label, amount }) => (
          <Pressable
            key={label}
            onPress={() => setBid(amount)}
            style={[s.presetBtn, s.presetFlex, bid === amount && s.presetActive]}
          >
            <Text style={[s.presetText, bid === amount && s.presetActiveText]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bid input */}
      <NumberInput
        label="Ditt bud"
        value={bid}
        format={formatCompact}
        onChangeValue={setBid}
        step={50_000}
      />

      {/* Advanced: rate & financing */}
      <Pressable
        onPress={() => setShowAdvanced(!showAdvanced)}
        style={s.expandButton}
      >
        <Text style={s.expandLabel}>Justera ränta & finansiering</Text>
        <Text style={[s.expandArrow, showAdvanced && { transform: [{ rotate: "180deg" }] }]}>
          ▼
        </Text>
      </Pressable>
      {showAdvanced && (
        <View style={s.expandContent}>
          <NumberInput
            label="Egen finansiering"
            value={ownFinancing}
            format={formatCompact}
            onChangeValue={setOwnFinancing}
            step={25_000}
          />
          <View style={{ height: 16 }} />
          <NumberInput
            label="Förväntad ränta"
            value={interestRate}
            format={(v: number) => v.toFixed(1) + " %"}
            onChangeValue={setInterestRate}
            step={0.25}
          />
        </View>
      )}

      {/* Monthly breakdown */}
      <Pressable
        onPress={() => setShowBreakdown(!showBreakdown)}
        style={[s.expandButton, { marginTop: 12 }]}
      >
        <Text style={s.expandLabel}>Månadsöversikt</Text>
        <Text style={[s.expandArrow, showBreakdown && { transform: [{ rotate: "180deg" }] }]}>
          ▼
        </Text>
      </Pressable>
      {showBreakdown && (
        <View style={s.expandContent}>
          {result.items.map((item, i) => (
            <View key={i} style={s.breakdownRow}>
              <Text
                style={[
                  s.breakdownLabel,
                  item.type === "income" && { fontFamily: "DMSans_700Bold" },
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  s.breakdownValue,
                  item.type === "deduction" && { color: Colors.gradeGreen },
                ]}
              >
                {item.amount >= 0 ? "+" : ""}
                {formatSEK(item.amount)}
              </Text>
            </View>
          ))}
          <View style={s.loanInfo}>
            {[
              { label: "Lånebelopp", value: formatSEK(result.loanAmount) },
              { label: "Belåningsgrad", value: Math.round(result.ltv * 100) + " %" },
              { label: "Amorteringskrav", value: result.amortizationRate + " %" },
            ].map((row) => (
              <View key={row.label} style={s.loanRow}>
                <Text style={s.loanLabel}>{row.label}</Text>
                <Text style={s.loanValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Save button */}
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[s.saveBtn, saving && { opacity: 0.6 }]}
      >
        <Text style={s.saveBtnText}>
          {savedToast ? "✓ Sparad!" : saving ? "Sparar..." : "Spara till mina scenarier"}
        </Text>
      </Pressable>

      {/* History */}
      {simulations.length > 0 && (
        <View style={s.historySection}>
          <View style={s.historyHeader}>
            <Text style={s.historyLabel}>Simuleringshistorik</Text>
            <Text style={s.historyCount}>{simulations.length} scenarier</Text>
          </View>
          {simulations.map((sim, i) => (
            <View
              key={sim.id}
              style={[s.historyRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}
            >
              <View
                style={[
                  s.historyDot,
                  { backgroundColor: sim.kalp_grade ? TRAFFIC_COLORS[sim.kalp_grade] || Colors.border : Colors.border },
                ]}
              />
              <Text style={s.historyAmount}>{formatSEK(sim.amount)}</Text>
              <View style={{ flex: 1 }} />
              {sim.kalp_margin != null && (
                <Text
                  style={[
                    s.historyMargin,
                    { color: sim.kalp_grade ? TRAFFIC_COLORS[sim.kalp_grade] || Colors.textMuted : Colors.textMuted },
                  ]}
                >
                  {sim.kalp_margin > 0 ? "+" : ""}
                  {formatSEK(sim.kalp_margin)}/mån
                </Text>
              )}
              <Text style={s.historyTime}>
                {new Date(sim.created_at).toLocaleTimeString("sv-SE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </NivaCard>
  );
}

// ─── Number Input with +/- Stepper ──────────────────────────────
function NumberInput({
  label,
  value,
  format,
  onChangeValue,
  step,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  onChangeValue: (v: number) => void;
  step: number;
}) {
  return (
    <View>
      <View style={s.inputHeader}>
        <Text style={s.inputLabel}>{label}</Text>
        <Text style={s.inputValue}>{format(value)}</Text>
      </View>
      <View style={s.stepperRow}>
        <Pressable
          onPress={() => onChangeValue(value - step)}
          style={s.stepperBtn}
        >
          <Text style={s.stepperText}>−</Text>
        </Pressable>
        <View style={s.stepperTrack}>
          <View style={s.stepperFill} />
        </View>
        <Pressable
          onPress={() => onChangeValue(value + step)}
          style={s.stepperBtn}
        >
          <Text style={s.stepperText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
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

  // Hero
  heroBox: {
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  heroValueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroDot: { width: 10, height: 10, borderRadius: 5 },
  heroValue: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
    fontVariant: ["tabular-nums"],
  },
  heroDelta: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },

  // Presets
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  presetBtn: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.linen,
  },
  presetFlex: { flex: 1 },
  presetActive: {
    backgroundColor: Colors.midnight,
    borderColor: Colors.midnight,
  },
  presetText: {
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
    color: Colors.textSecondary,
  },
  presetActiveText: { color: Colors.white },

  // Expand sections
  expandButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  expandLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
  },
  expandArrow: { fontSize: 10, color: Colors.textMuted },
  expandContent: { paddingHorizontal: 4, paddingVertical: 16 },

  // Number Input
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  inputLabel: { fontSize: 14, color: Colors.textSecondary },
  inputValue: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
    fontVariant: ["tabular-nums"],
  },
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
  stepperText: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
  },
  stepperTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.stone,
    borderRadius: 2,
  },
  stepperFill: {
    width: "50%",
    height: 4,
    backgroundColor: Colors.midnight,
    borderRadius: 2,
  },

  // Breakdown
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breakdownLabel: { fontSize: 14, color: Colors.textSecondary },
  breakdownValue: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    fontVariant: ["tabular-nums"],
    color: Colors.textSecondary,
  },
  loanInfo: { marginTop: 12, gap: 8 },
  loanRow: { flexDirection: "row", justifyContent: "space-between" },
  loanLabel: { fontSize: 14, color: Colors.textSecondary },
  loanValue: { fontSize: 14, fontVariant: ["tabular-nums"], color: Colors.textSecondary },

  // Save
  saveBtn: {
    backgroundColor: Colors.midnight,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },

  // History
  historySection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
  },
  historyCount: { fontSize: 12, color: Colors.textMuted },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyAmount: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    fontVariant: ["tabular-nums"],
    color: Colors.midnight,
  },
  historyMargin: {
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
    fontVariant: ["tabular-nums"],
    marginRight: 8,
  },
  historyTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
});
