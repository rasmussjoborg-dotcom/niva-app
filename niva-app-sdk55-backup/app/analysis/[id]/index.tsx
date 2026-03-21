import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getAnalysis,
  type AnalysisData,
} from "../../../lib/api";
import {
  Colors,
  Fonts,
  formatSEK,
  formatSqm,
  getGradeColor,
  getGradeLabel,
} from "../../../lib/theme";
import { NivaCard } from "../../../components/ui/NivaCard";
import { NivaButton } from "../../../components/ui/NivaButton";

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAnalysis(Number(id))
      .then(setAnalysis)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-linen items-center justify-center">
        <ActivityIndicator color={Colors.midnight} size="large" />
        <Text className="text-text-muted text-sm mt-1.5">
          Hämtar analys...
        </Text>
      </View>
    );
  }

  if (error || !analysis) {
    return (
      <View className="flex-1 bg-linen items-center justify-center px-2">
        <Text className="text-midnight text-lg font-semibold mb-1">
          Kunde inte hämta analysen
        </Text>
        <Text className="text-text-muted text-sm text-center mb-3">
          {error || "Analysen kunde inte hittas"}
        </Text>
        <NivaButton label="Tillbaka" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const gradeColor = getGradeColor(analysis.grade_color);
  const gradeLabel = getGradeLabel(analysis.grade);

  return (
    <View className="flex-1 bg-linen">
      {/* Header */}
      <View className="flex-row items-center px-2 pt-6 pb-1.5 border-b border-border">
        <Pressable
          onPress={() => router.back()}
          className="mr-1.5"
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text className="text-midnight text-base">← Tillbaka</Text>
        </Pressable>
        <Text
          className="text-midnight text-sm font-semibold flex-1"
          numberOfLines={1}
        >
          {analysis.address || "Analys"}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Property image */}
        {analysis.image_url ? (
          <Image
            source={{ uri: analysis.image_url }}
            className="w-full"
            style={{ height: 200 }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-full bg-stone items-center justify-center"
            style={{ height: 160 }}
          >
            <Text className="text-text-muted text-sm">Ingen bild</Text>
          </View>
        )}

        {/* Property info */}
        <View className="px-2 pt-2">
          <NivaCard className="p-2 mb-2">
            <Text className="text-midnight text-xl font-semibold">
              {analysis.address || "Okänd adress"}
            </Text>
            <View className="flex-row flex-wrap items-center mt-0.5 gap-0.5">
              {analysis.brf_name && (
                <Text className="text-text-secondary text-sm">
                  {analysis.brf_name}
                </Text>
              )}
              {analysis.sqm && (
                <Text className="text-text-muted text-sm">
                  {analysis.brf_name ? " · " : ""}{formatSqm(analysis.sqm)}
                </Text>
              )}
              {analysis.rooms && (
                <Text className="text-text-muted text-sm">
                  {" · "}{analysis.rooms} rok
                </Text>
              )}
              {analysis.broker_firm && (
                <Text className="text-text-muted text-sm">
                  {" · "}{analysis.broker_firm}
                </Text>
              )}
            </View>
          </NivaCard>

          {/* Grade circle */}
          <NivaCard className="p-3 mb-2 items-center">
            <View
              className="rounded-full items-center justify-center mb-1.5"
              style={{
                width: 80,
                height: 80,
                backgroundColor: gradeColor,
              }}
            >
              <Text className="text-white text-3xl font-bold">
                {analysis.grade}
              </Text>
            </View>
            <Text className="text-midnight text-base font-semibold">
              {gradeLabel}
            </Text>
            <Text className="text-text-muted text-sm text-center mt-0.5">
              {analysis.risk_level === "low"
                ? "Låg ekonomisk risk"
                : analysis.risk_level === "medium"
                  ? "Medel ekonomisk risk"
                  : analysis.risk_level === "high"
                    ? "Hög ekonomisk risk"
                    : "Riskbedömning ej tillgänglig"}
            </Text>
          </NivaCard>

          {/* Key metrics */}
          <View className="flex-row gap-1.5 mb-2">
            <NivaCard className="flex-1 p-2">
              <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-0.5">
                Pris
              </Text>
              <Text
                className="text-midnight text-base font-bold"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {analysis.price ? formatSEK(analysis.price) : "—"}
              </Text>
            </NivaCard>

            <NivaCard className="flex-1 p-2">
              <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-0.5">
                Månadsavgift
              </Text>
              <Text
                className="text-midnight text-base font-bold"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {analysis.monthly_fee
                  ? formatSEK(analysis.monthly_fee)
                  : "—"}
              </Text>
            </NivaCard>
          </View>

          <View className="flex-row gap-1.5 mb-2">
            <NivaCard className="flex-1 p-2">
              <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-0.5">
                Boyta
              </Text>
              <Text className="text-midnight text-base font-bold">
                {analysis.sqm ? `${analysis.sqm} m²` : "—"}
              </Text>
            </NivaCard>

            <NivaCard className="flex-1 p-2">
              <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-0.5">
                Månadskostnad
              </Text>
              <Text
                className="text-midnight text-base font-bold"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {analysis.monthly_cost
                  ? formatSEK(analysis.monthly_cost)
                  : "—"}
              </Text>
            </NivaCard>
          </View>

          {/* Actions */}
          <Text className="text-midnight text-base font-semibold mb-1">
            Verktyg
          </Text>
          <View className="gap-1">
            {[
              { label: "KALP-kalkylator", desc: "Beräkna din amortering och ränta" },
              { label: "Budgivning", desc: "Simulera bud och se marginal" },
              { label: "AI-chatt", desc: "Ställ frågor om bostaden" },
            ].map((action) => (
              <Pressable key={action.label}>
                <NivaCard className="p-2 flex-row items-center active:opacity-80">
                  <View className="flex-1">
                    <Text className="text-midnight text-sm font-semibold">
                      {action.label}
                    </Text>
                    <Text className="text-text-muted text-xs">
                      {action.desc}
                    </Text>
                  </View>
                  <Text className="text-text-muted">→</Text>
                </NivaCard>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
