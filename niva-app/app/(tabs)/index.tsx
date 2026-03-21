import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
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
      router.push(`/analysis/${result.analysis_id}`);
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

  const dateStr = new Date().toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const ListHeader = (
    <View>
      <ScreenHeader
        title={`${getGreeting()}, ${user?.name || "du"}`}
        subtitle={dateStr}
        rightElement={
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}
          >
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          </Pressable>
        }
      />

      {/* URL Search Card */}
      <NivaCard style={s.searchCard}>
        <View style={{ marginBottom: 12 }}>
          <Text style={s.searchTitle}>Analysera bostad</Text>
          <Text style={s.searchSubtitle}>Klistra in en länk</Text>
        </View>

        <View style={s.searchInputRow}>
          <TextInput
            value={searchValue}
            onChangeText={(text) => {
              setSearchValue(text);
              setClipboardHint(null);
            }}
            placeholder="Klistra in mäklarens länk..."
            placeholderTextColor={Colors.textMuted}
            style={s.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {searchValue.length > 0 && (
            <Pressable
              onPress={handleAnalyze}
              disabled={scraping}
              style={[s.searchButton, { opacity: scraping ? 0.5 : 1 }]}
            >
              {scraping ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={{ color: Colors.white, fontSize: 16 }}>→</Text>
              )}
            </Pressable>
          )}
        </View>

        {clipboardHint && !searchValue && (
          <Pressable onPress={applyClipboard} style={s.clipboardHint}>
            <Text style={{ color: Colors.gold, fontSize: 12, fontFamily: "DMSans_500Medium" }}>
              📋 Klistra in från urklipp
            </Text>
          </Pressable>
        )}

        {searchError && (
          <View style={s.searchError}>
            <Text style={{ color: Colors.gradeRed, fontSize: 12 }}>{searchError}</Text>
          </View>
        )}
      </NivaCard>

      {/* Quick Stats */}
      <View style={s.statsRow}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            if (!user?.loan_promise) router.push("/(tabs)/profile");
          }}
        >
          <NivaCard style={{ padding: 16 }}>
            <Text style={s.statLabel}>Lånelöfte</Text>
            {user && user.loan_promise > 0 ? (
              <Text style={s.statValue}>{formatCompact(user.loan_promise)}</Text>
            ) : (
              <Text style={s.statEmpty}>Fyll i din profil →</Text>
            )}
          </NivaCard>
        </Pressable>

        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            if (!user?.savings) router.push("/(tabs)/profile");
          }}
        >
          <NivaCard style={{ padding: 16 }}>
            <Text style={s.statLabel}>Sparkapital</Text>
            {user && user.savings > 0 ? (
              <Text style={s.statValue}>{formatCompact(user.savings)}</Text>
            ) : (
              <Text style={s.statEmpty}>Fyll i din profil →</Text>
            )}
          </NivaCard>
        </Pressable>
      </View>

      {/* Section header */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Dina bostäder</Text>
        {analyses.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{analyses.length} objekt</Text>
          </View>
        )}
      </View>
    </View>
  );

  const EmptyState = (
    <NivaCard dashed style={{ marginHorizontal: 16, paddingVertical: 40, alignItems: "center" }}>
      <Text style={{ fontSize: 28, opacity: 0.5, marginBottom: 12 }}>🏡</Text>
      <Text style={s.emptyTitle}>Lägg till din första bostad</Text>
      <Text style={s.emptyDesc}>Klistra in en mäklarlänk ovan och vi sköter resten</Text>
    </NivaCard>
  );

  if (loading) {
    return (
      <View style={s.screen}>
        {ListHeader}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Colors.midnight} size="large" />
          <Text style={{ color: Colors.textMuted, fontSize: 14, marginTop: 12 }}>
            Hämtar bostadsdata...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
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
            style={{ marginHorizontal: 16, marginBottom: 12 }}
          >
            <NivaCard noPadding>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={s.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={s.cardImagePlaceholder}>
                  <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Ingen bild</Text>
                </View>
              )}

              <View style={{ padding: 16 }}>
                <Text style={s.cardAddress}>{item.address || "Okänd adress"}</Text>
                <View style={s.cardMeta}>
                  {item.brf_name && (
                    <Text style={s.cardMetaText}>{item.brf_name}</Text>
                  )}
                  {item.sqm && (
                    <Text style={s.cardMetaText}>
                      {item.brf_name ? " · " : ""}{item.sqm} m²
                    </Text>
                  )}
                  {item.monthly_fee && (
                    <Text style={s.cardMetaText}>
                      {" · "}{formatSEK(item.monthly_fee)}/mån
                    </Text>
                  )}
                </View>

                <View style={s.cardBottom}>
                  <View>
                    {item.price && item.price > 0 ? (
                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={s.cardPrice}>
                          {new Intl.NumberFormat("sv-SE").format(item.price)}
                        </Text>
                        <Text style={[s.cardMetaText, { marginLeft: 4 }]}>kr</Text>
                      </View>
                    ) : (
                      <Text style={[s.cardMetaText, { fontStyle: "italic" }]}>
                        Pris ej satt
                      </Text>
                    )}
                  </View>

                  {item.grade && (
                    <View
                      style={[
                        s.gradeBadge,
                        { backgroundColor: getGradeColor(item.grade_color) },
                      ]}
                    >
                      <Text style={s.gradeText}>{item.grade}</Text>
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

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.linen,
    paddingTop: 48,
  },
  avatar: {
    borderRadius: 999,
    backgroundColor: Colors.stone,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    width: 34,
    height: 34,
  },
  avatarText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
  searchCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  searchTitle: {
    color: Colors.midnight,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
  searchSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.midnight,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },
  searchButton: {
    backgroundColor: Colors.midnight,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    width: 32,
    height: 32,
  },
  clipboardHint: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(193, 163, 104, 0.08)",
  },
  searchError: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(169, 50, 38, 0.06)",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValue: {
    color: Colors.midnight,
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    fontVariant: ["tabular-nums"],
  },
  statEmpty: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.midnight,
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  countBadge: {
    backgroundColor: Colors.stone,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
  },
  emptyTitle: {
    color: Colors.midnight,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    marginBottom: 4,
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  cardImage: {
    width: "100%",
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: Colors.stone,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAddress: {
    color: Colors.midnight,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 2,
  },
  cardMetaText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardPrice: {
    color: Colors.midnight,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    fontVariant: ["tabular-nums"],
  },
  gradeBadge: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
  },
  gradeText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
});
