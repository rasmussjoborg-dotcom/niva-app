import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  getAnalysis,
  createBid,
  getBids,
  createBidSession,
  type AnalysisData,
  type BidData,
} from "../../../lib/api";
import { Colors, formatSEK, formatCompact } from "../../../lib/theme";
import { NivaCard } from "../../../components/ui/NivaCard";

const BID_INCREMENTS = [10_000, 25_000, 50_000, 100_000];

export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<BidData[]>([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [selectedIncrement, setSelectedIncrement] = useState(50_000);
  const [placing, setPlacing] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const a = await getAnalysis(parseInt(id!));
      setAnalysis(a);
      setCurrentBid(a.price ?? 3_000_000);
      const existingBids = await getBids(a.id).catch(() => []);
      setBids(existingBids);
      if (existingBids.length > 0) {
        setCurrentBid(existingBids[0].amount);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function startSession() {
    if (!analysis) return;
    try {
      const { id: sid } = await createBidSession(analysis.id);
      setSessionId(sid);
      setSessionActive(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Failed to start session:", e);
    }
  }

  async function placeBid() {
    if (!analysis || placing) return;
    setPlacing(true);
    try {
      const newBid = currentBid + selectedIncrement;
      const bid = await createBid(analysis.id, newBid);
      setBids((prev) => [bid, ...prev]);
      setCurrentBid(newBid);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      console.error("Failed to place bid:", e);
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <Stack.Screen
        options={{
          title: "Nivå Live",
          headerStyle: { backgroundColor: Colors.midnight },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontFamily: "DMSans_700Bold", fontSize: 16 },
        }}
      />

      {/* Current bid hero */}
      <View style={s.hero}>
        <Text style={s.heroLabel}>
          {sessionActive ? "LIVE BUDGIVNING" : "SENASTE BUD"}
        </Text>
        {sessionActive && <View style={s.liveIndicator} />}
        <Text style={s.heroAmount}>{formatSEK(currentBid)}</Text>
        {analysis?.address && (
          <Text style={s.heroAddress}>{analysis.address}</Text>
        )}
      </View>

      {/* Increment selector */}
      {sessionActive && (
        <View style={s.incrementSection}>
          <Text style={s.incrementLabel}>Höjning</Text>
          <View style={s.incrementRow}>
            {BID_INCREMENTS.map((inc) => (
              <Pressable
                key={inc}
                onPress={() => {
                  setSelectedIncrement(inc);
                  Haptics.selectionAsync();
                }}
                style={[
                  s.incrementBtn,
                  selectedIncrement === inc && s.incrementActive,
                ]}
              >
                <Text
                  style={[
                    s.incrementText,
                    selectedIncrement === inc && s.incrementActiveText,
                  ]}
                >
                  +{formatCompact(inc)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Place bid */}
          <Pressable
            onPress={placeBid}
            disabled={placing}
            style={[s.bidBtn, placing && { opacity: 0.6 }]}
          >
            <Text style={s.bidBtnText}>
              {placing
                ? "Lägger bud..."
                : `Lägg bud: ${formatSEK(currentBid + selectedIncrement)}`}
            </Text>
          </Pressable>
        </View>
      )}

      {!sessionActive && (
        <Pressable onPress={startSession} style={s.startBtn}>
          <Text style={s.startBtnText}>Starta budgivning</Text>
        </Pressable>
      )}

      {/* Bid history */}
      <View style={s.historySection}>
        <Text style={s.historyLabel}>
          Budhistorik ({bids.length} bud)
        </Text>
        <FlatList
          data={bids}
          keyExtractor={(b) => b.id.toString()}
          renderItem={({ item, index }) => (
            <View style={[s.historyRow, index === 0 && s.historyRowFirst]}>
              <View style={s.timelineDot}>
                <View
                  style={[
                    s.dot,
                    index === 0 && { backgroundColor: Colors.gold },
                  ]}
                />
                {index < bids.length - 1 && <View style={s.timelineLine} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.bidAmount, index === 0 && { color: Colors.gold }]}>
                  {formatSEK(item.amount)}
                </Text>
                <Text style={s.bidTime}>
                  {new Date(item.created_at).toLocaleTimeString("sv-SE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Text>
              </View>
              {item.kalp_grade && (
                <View
                  style={[
                    s.gradeTag,
                    {
                      backgroundColor:
                        item.kalp_grade === "green"
                          ? "rgba(61,122,58,0.1)"
                          : item.kalp_grade === "yellow"
                            ? "rgba(196,149,32,0.1)"
                            : "rgba(169,50,38,0.1)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.gradeText,
                      {
                        color:
                          item.kalp_grade === "green"
                            ? Colors.gradeGreen
                            : item.kalp_grade === "yellow"
                              ? Colors.gradeYellow
                              : Colors.gradeRed,
                      },
                    ]}
                  >
                    {item.kalp_grade === "green"
                      ? "Inom budget"
                      : item.kalp_grade === "yellow"
                        ? "Nära gräns"
                        : "Över budget"}
                  </Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={s.emptyText}>Inga bud ännu</Text>
          }
        />
      </View>

      {/* End session */}
      {sessionActive && (
        <View style={s.endRow}>
          <Pressable
            onPress={() => router.push(`/analysis/${id}/result` as any)}
            style={s.endBtn}
          >
            <Text style={s.endBtnText}>Avsluta budgivning</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.midnight },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.midnight,
  },

  // Hero
  hero: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: Colors.gold,
    marginBottom: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E74C3C",
    position: "absolute",
    top: 34,
    right: "35%",
  },
  heroAmount: {
    fontSize: 36,
    fontFamily: "DMSans_700Bold",
    color: Colors.white,
    fontVariant: ["tabular-nums"],
    marginBottom: 4,
  },
  heroAddress: { fontSize: 14, color: "rgba(255,255,255,0.5)" },

  // Increments
  incrementSection: { paddingHorizontal: 20, marginBottom: 20 },
  incrementLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 8,
  },
  incrementRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  incrementBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  incrementActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  incrementText: {
    fontSize: 13,
    fontFamily: "DMSans_700Bold",
    color: "rgba(255,255,255,0.6)",
  },
  incrementActiveText: { color: Colors.midnight },

  bidBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
  },
  bidBtnText: {
    color: Colors.midnight,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },

  startBtn: {
    marginHorizontal: 20,
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 24,
  },
  startBtnText: {
    color: Colors.midnight,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },

  // History
  historySection: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  historyLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 16,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingBottom: 20,
  },
  historyRowFirst: {},
  timelineDot: { alignItems: "center", width: 16, paddingTop: 6 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 4,
  },
  bidAmount: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    color: Colors.white,
    fontVariant: ["tabular-nums"],
  },
  bidTime: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  gradeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  gradeText: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  emptyText: { fontSize: 14, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 20 },

  // End
  endRow: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.midnight,
  },
  endBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  endBtnText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
});
