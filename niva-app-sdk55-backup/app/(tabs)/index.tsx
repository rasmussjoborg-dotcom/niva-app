import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useAuthStore } from "../../lib/store";
import {
  getAnalyses,
  resolveProperty,
  type AnalysisData,
} from "../../lib/api";
import {
  Colors,
  Fonts,
  formatSEK,
  formatCompact,
  getGradeColor,
} from "../../lib/theme";
import { NivaCard } from "../../components/ui/NivaCard";
import { ScreenHeader } from "../../components/ui/ScreenHeader";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 10) return "God morgon";
  if (hour < 17) return "Hej";
  return "God kväll";
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [searchValue, setSearchValue] = useState("");
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [clipboardHint, setClipboardHint] = useState<string | null>(null);

  // Fetch analyses
  const fetchAnalyses = useCallback(async () => {
    try {
      const data = await getAnalyses();
      setAnalyses(data);
    } catch (err) {
      console.warn("Failed to fetch analyses:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Check clipboard for URLs on mount
  useEffect(() => {
    (async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (text && /^https?:\/\//i.test(text)) {
          setClipboardHint(text.trim());
        }
      } catch {}
    })();
  }, []);

  async function handleAnalyze() {
    if (!searchValue.trim() || scraping) return;
    setScraping(true);
    setSearchError(null);
    try {
      const result = await resolveProperty(searchValue.trim());
      setSearchValue("");
      fetchAnalyses();
      router.push(`/analysis/${result.id}`);
    } catch (err: any) {
      setSearchError(err.message || "Kunde inte analysera länken");
    } finally {
      setScraping(false);
    }
  }

  function applyClipboard() {
    if (clipboardHint) {
      setSearchValue(clipboardHint);
      setClipboardHint(null);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Date string in Swedish
  const dateStr = new Date().toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Header component for FlashList
  const ListHeader = (
    <View>
      {/* Greeting */}
      <ScreenHeader
        title={`${getGreeting()}, ${user?.name || "du"}`}
        subtitle={dateStr}
        rightElement={
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            className="items-center justify-center"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <View
              className="rounded-full bg-stone items-center justify-center border border-border"
              style={{ width: 34, height: 34 }}
            >
              <Text className="text-text-secondary text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          </Pressable>
        }
      />

      {/* URL Search Card */}
      <NivaCard className="mx-2 mb-2 p-2">
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <View>
            <Text className="text-midnight text-sm font-semibold">
              Analysera bostad
            </Text>
            <Text className="text-text-muted text-xs">Klistra in en länk</Text>
          </View>
        </View>

        <View className="flex-row items-center bg-linen border border-border rounded-md px-2 py-1">
          <TextInput
            value={searchValue}
            onChangeText={(text) => {
              setSearchValue(text);
              setClipboardHint(null);
            }}
            placeholder="Klistra in mäklarens länk..."
            placeholderTextColor={Colors.textMuted}
            className="flex-1 text-midnight text-sm"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {searchValue.length > 0 && (
            <Pressable
              onPress={handleAnalyze}
              disabled={scraping}
              className="bg-midnight rounded-full items-center justify-center ml-1"
              style={{ width: 32, height: 32, opacity: scraping ? 0.5 : 1 }}
            >
              {scraping ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-base">→</Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Clipboard hint */}
        {clipboardHint && !searchValue && (
          <Pressable
            onPress={applyClipboard}
            className="mt-1 px-1.5 py-1 rounded-md"
            style={{ backgroundColor: "rgba(193, 163, 104, 0.08)" }}
          >
            <Text className="text-gold text-xs font-medium">
              📋 Klistra in från urklipp
            </Text>
          </Pressable>
        )}

        {/* Error */}
        {searchError && (
          <View
            className="mt-1 px-1.5 py-1 rounded-md"
            style={{ backgroundColor: "rgba(169, 50, 38, 0.06)" }}
          >
            <Text className="text-grade-red text-xs">{searchError}</Text>
          </View>
        )}
      </NivaCard>

      {/* Quick Stats */}
      <View className="flex-row gap-1.5 px-2 mb-3">
        <Pressable
          className="flex-1"
          onPress={() => {
            if (!user?.loan_promise) router.push("/(tabs)/profile");
          }}
        >
          <NivaCard className="p-2">
            <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-0.5">
              Lånelöfte
            </Text>
            {user && user.loan_promise > 0 ? (
              <Text
                className="text-midnight text-xl font-bold"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCompact(user.loan_promise)}
              </Text>
            ) : (
              <Text className="text-text-muted text-xs">
                Fyll i din profil →
              </Text>
            )}
          </NivaCard>
        </Pressable>

        <Pressable
          className="flex-1"
          onPress={() => {
            if (!user?.savings) router.push("/(tabs)/profile");
          }}
        >
          <NivaCard className="p-2">
            <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-0.5">
              Sparkapital
            </Text>
            {user && user.savings > 0 ? (
              <Text
                className="text-midnight text-xl font-bold"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCompact(user.savings)}
              </Text>
            ) : (
              <Text className="text-text-muted text-xs">
                Fyll i din profil →
              </Text>
            )}
          </NivaCard>
        </Pressable>
      </View>

      {/* Section header */}
      <View className="flex-row justify-between items-center px-2 mb-1.5">
        <Text className="text-midnight text-lg font-semibold">
          Dina bostäder
        </Text>
        {analyses.length > 0 && (
          <View className="bg-stone px-1.5 py-0.5 rounded-full">
            <Text className="text-text-muted text-xs font-medium">
              {analyses.length} objekt
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Empty state
  const EmptyState = (
    <NivaCard dashed className="mx-2 py-5 items-center">
      <Text style={{ fontSize: 28, opacity: 0.5, marginBottom: 12 }}>🏡</Text>
      <Text className="text-midnight text-base font-semibold mb-0.5">
        Lägg till din första bostad
      </Text>
      <Text className="text-text-muted text-sm text-center">
        Klistra in en mäklarlänk ovan och vi sköter resten
      </Text>
    </NivaCard>
  );

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-linen pt-6">
        {ListHeader}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.midnight} size="large" />
          <Text className="text-text-muted text-sm mt-1.5">
            Hämtar bostadsdata...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-linen pt-6">
      <FlashList
        data={analyses}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/analysis/${item.id}`)}
            className="mx-2 mb-1.5"
          >
            <NivaCard noPadding>
              {/* Property image */}
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  className="w-full rounded-t-lg"
                  style={{ height: 160 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="w-full rounded-t-lg bg-stone items-center justify-center"
                  style={{ height: 120 }}
                >
                  <Text className="text-text-muted text-sm">Ingen bild</Text>
                </View>
              )}

              {/* Card body */}
              <View className="p-2">
                <Text className="text-midnight text-base font-semibold">
                  {item.address || "Okänd adress"}
                </Text>
                <View className="flex-row items-center gap-0.5 mt-0.5">
                  {item.brf_name && (
                    <Text className="text-text-muted text-xs">
                      {item.brf_name}
                    </Text>
                  )}
                  {item.sqm && (
                    <Text className="text-text-muted text-xs">
                      {item.brf_name ? " · " : ""}
                      {item.sqm} m²
                    </Text>
                  )}
                  {item.monthly_fee && (
                    <Text className="text-text-muted text-xs">
                      {" · "}
                      {formatSEK(item.monthly_fee)}/mån
                    </Text>
                  )}
                </View>

                {/* Price + grade row */}
                <View className="flex-row justify-between items-center mt-1.5 pt-1.5 border-t border-border">
                  <View>
                    {item.price && item.price > 0 ? (
                      <View className="flex-row items-baseline">
                        <Text
                          className="text-midnight text-base font-bold"
                          style={{ fontVariant: ["tabular-nums"] }}
                        >
                          {new Intl.NumberFormat("sv-SE").format(item.price)}
                        </Text>
                        <Text className="text-text-muted text-xs ml-0.5">
                          kr
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-text-muted text-sm italic">
                        Pris ej satt
                      </Text>
                    )}
                  </View>

                  {/* Grade badge */}
                  {item.grade && (
                    <View
                      className="rounded-full items-center justify-center"
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: getGradeColor(item.grade_color),
                      }}
                    >
                      <Text className="text-white text-sm font-bold">
                        {item.grade}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </NivaCard>
          </Pressable>
        )}
      />
    </View>
  );
}
