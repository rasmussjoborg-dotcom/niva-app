import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { NivaButton } from "../../components/ui/NivaButton";
import { Fonts } from "../../lib/theme";

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
    <View className="flex-1 bg-linen px-2">
      {/* Top spacer */}
      <View style={{ flex: 1.2 }} />

      {/* Brand */}
      <View className="mb-3">
        <Text
          className="text-midnight mb-1.5"
          style={{
            fontFamily: Fonts.serif,
            fontSize: 72,
            lineHeight: 72,
            letterSpacing: -2,
          }}
        >
          Nivå
        </Text>
        <Text className="text-text-secondary text-lg" style={{ maxWidth: 280, lineHeight: 24 }}>
          Förstå vad ditt nästa hem verkligen kostar
        </Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 0.6 }} />

      {/* Feature pills */}
      <View className="gap-1">
        {FEATURES.map((item) => (
          <View
            key={item.title}
            className="flex-row items-center bg-white rounded-lg px-2 py-1.5"
          >
            <View className="flex-1">
              <Text className="text-midnight text-sm font-semibold">
                {item.title}
              </Text>
              <Text className="text-text-muted text-xs">{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={{ flex: 0.4 }} />
      <View className="pb-4">
        <NivaButton
          label="Analysera din första bostad"
          onPress={() => router.push("/(auth)/onboarding")}
        />
        <Pressable
          onPress={() => router.push("/(auth)/onboarding")}
          className="mt-1.5 items-center"
        >
          <Text className="text-text-muted text-sm">
            Redan användare? Logga in
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
