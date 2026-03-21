import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { NivaButton } from "../../components/ui/NivaButton";
import { Colors, Fonts, Spacing } from "../../lib/theme";

const FEATURES = [
  { title: "Marknadsvärde", desc: "Jämför pris mot verifierad data" },
  { title: "Föreningens hälsa", desc: "Vi läser årsredovisningen åt dig" },
  { title: "Din budget", desc: "Se om kalkylen håller" },
  { title: "Nivå-betyg", desc: "Sammanvägt betyg på varje bostad" },
  { title: "Mäklarlänk", desc: "Klistra in en länk, få full analys" },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={{ flex: 1.2 }} />

      {/* Brand */}
      <View style={{ marginBottom: 24 }}>
        <Text style={s.brandTitle}>Nivå</Text>
        <Text style={s.brandSubtitle}>
          Förstå vad ditt nästa hem verkligen kostar
        </Text>
      </View>

      <View style={{ flex: 0.6 }} />

      {/* Feature pills */}
      <View style={{ gap: 8 }}>
        {FEATURES.map((item) => (
          <View key={item.title} style={s.featurePill}>
            <View style={{ flex: 1 }}>
              <Text style={s.featureTitle}>{item.title}</Text>
              <Text style={s.featureDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={{ flex: 0.4 }} />
      <View style={{ paddingBottom: 32 }}>
        <NivaButton
          label="Analysera din första bostad"
          onPress={() => router.push("/(auth)/onboarding")}
        />
        <Pressable
          onPress={() => router.push("/(auth)/onboarding")}
          style={{ marginTop: 12, alignItems: "center" }}
        >
          <Text style={s.loginLink}>Redan användare? Logga in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.linen,
    paddingHorizontal: 16,
  },
  brandTitle: {
    fontFamily: Fonts.serif,
    fontSize: 72,
    lineHeight: 72,
    letterSpacing: -2,
    color: Colors.midnight,
    marginBottom: 12,
  },
  brandSubtitle: {
    color: Colors.textSecondary,
    fontSize: 18,
    maxWidth: 280,
    lineHeight: 24,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  featureTitle: {
    color: Colors.midnight,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
  featureDesc: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  loginLink: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
