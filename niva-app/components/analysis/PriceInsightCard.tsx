import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts, formatSEK } from "../../lib/theme";
import { NivaCard } from "../ui/NivaCard";

interface Props {
  askingPrice: number;
  fairValue: number;
}

export function PriceInsightCard({ askingPrice, fairValue }: Props) {
  const lowerBound = fairValue * 0.95;
  const upperBound = fairValue * 1.05;
  const hasPrice = askingPrice > 0;

  // No asking price → show estimate card
  if (!hasPrice) {
    const formatted =
      fairValue >= 1_000_000
        ? (fairValue / 1_000_000).toFixed(2).replace(".00", "") + " mkr"
        : formatSEK(fairValue);
    return (
      <NivaCard style={s.card}>
        <View style={s.headerRow}>
          <View style={s.labelRow}>
            <View style={[s.dot, { backgroundColor: Colors.textMuted }]} />
            <Text style={s.label}>Marknadsvärdering</Text>
          </View>
          <Text style={[s.tag, { color: Colors.textSecondary }]}>ESTIMAT</Text>
        </View>
        <Text style={s.body}>
          Estimerat marknadsvärde: <Text style={{ fontFamily: "DMSans_700Bold" }}>{formatted}</Text>
        </Text>
        <Text style={s.sub}>
          Intervall: {formatSEK(Math.round(lowerBound))} – {formatSEK(Math.round(upperBound))}
        </Text>
      </NivaCard>
    );
  }

  // Has asking price → compare to range
  const isUnder = askingPrice < lowerBound;
  const isOver = askingPrice > upperBound;

  const tier = isUnder ? "good" : isOver ? "warn" : "neutral";
  const palette = {
    good: { bg: "rgba(61,122,58,0.05)", border: "rgba(61,122,58,0.12)", text: Colors.gradeGreen, dot: Colors.gradeGreen },
    warn: { bg: "rgba(169,50,38,0.05)", border: "rgba(169,50,38,0.12)", text: Colors.gradeRed, dot: Colors.gradeRed },
    neutral: { bg: "rgba(0,0,0,0.02)", border: Colors.border, text: Colors.textSecondary, dot: Colors.textMuted },
  }[tier];

  const heading = isOver
    ? "Begärt pris ligger över estimerat intervall"
    : isUnder
      ? "Begärt pris ligger under estimerat intervall"
      : "Begärt pris ligger inom estimerat intervall";

  const diff = isOver
    ? `+${new Intl.NumberFormat("sv-SE").format(Math.round(askingPrice - upperBound))} kr över övre gränsen`
    : isUnder
      ? `-${new Intl.NumberFormat("sv-SE").format(Math.round(lowerBound - askingPrice))} kr under undre gränsen`
      : "I linje med marknadssnittet";

  return (
    <View style={[s.card, { backgroundColor: palette.bg, borderColor: palette.border, borderWidth: 1 }]}>
      <View style={s.headerRow}>
        <View style={s.labelRow}>
          <View style={[s.dot, { backgroundColor: palette.dot }]} />
          <Text style={s.label}>Prisanalys</Text>
        </View>
        <Text style={[s.tag, { color: palette.text }]}>
          {isOver ? "HÖGT" : isUnder ? "LÅGT" : "INOM SPANN"}
        </Text>
      </View>
      <Text style={s.body}>{heading}</Text>
      <Text style={s.sub}>{diff}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
  },
  tag: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    color: Colors.midnight,
    fontFamily: "DMSans_500Medium",
    lineHeight: 21,
    marginBottom: 8,
  },
  sub: { fontSize: 12, color: Colors.textMuted },
});
