import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors, Fonts } from "../../lib/theme";

interface Props {
  onUnlock: () => void;
}

const FEATURES = [
  { label: "Föreningens ekonomi", desc: "AI-analyserad årsredovisning" },
  { label: "Frågor till mäklaren", desc: "Riskbaserade kontrollfrågor" },
  { label: "Bud-Simulator", desc: "Konsekvensanalys i realtid" },
];

export function PremiumShowcase({ onUnlock }: Props) {
  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Lås upp djupanalys</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>Premium</Text>
        </View>
      </View>
      <Text style={s.subtitle}>
        Tre AI-drivna verktyg som ger dig ett strategiskt övertag i bostadsaffären.
      </Text>

      {/* Feature list */}
      <View style={s.featureList}>
        {FEATURES.map((f) => (
          <View key={f.label} style={s.featureRow}>
            <View style={s.featureCheck}>
              <Text style={{ color: Colors.gold, fontSize: 10 }}>✦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.featureLabel}>{f.label}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Pressable onPress={onUnlock} style={s.cta}>
        <Text style={s.ctaText}>Lås upp — 99 kr</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
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
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  featureList: { gap: 12, marginBottom: 20 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(193,163,104,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
  },
  featureDesc: { fontSize: 12, color: Colors.textMuted },
  cta: {
    backgroundColor: Colors.midnight,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
