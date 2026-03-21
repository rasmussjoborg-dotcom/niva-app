import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "../../lib/theme";
import { NivaCard } from "../ui/NivaCard";

interface Props {
  grade: string;
  gradeColor: string;
  isPremium: boolean;
  paidAt?: string | null;
  onUnlock: () => void;
}

function generateVerdict(grade: string): string {
  if (grade === "green") return "Föreningen visar starka nyckeltal och du har god marginal.";
  if (grade === "yellow") return "Bostaden ligger nära din budget — värt att räkna noga.";
  if (grade === "red") return "Bostaden kan bli en ekonomisk utmaning. Granska noggrant.";
  const l = grade?.charAt(0).toUpperCase();
  if (l === "A") return "Föreningen visar starka nyckeltal. Lås upp för full genomgång.";
  if (l === "B") return "Övervägande positiva signaler. Se hela bilden i analysen.";
  if (l === "C") return "Blandade signaler — värt att titta närmare.";
  if (l === "D") return "Några flaggor att vara uppmärksam på.";
  return "Föreningen kräver extra granskning.";
}

function getGradeBg(grade: string): string {
  if (["green", "a", "b"].some((g) => grade.toLowerCase().startsWith(g)))
    return "rgba(61,122,58,0.1)";
  if (["yellow", "c"].some((g) => grade.toLowerCase().startsWith(g)))
    return "rgba(196,149,32,0.1)";
  return "rgba(169,50,38,0.1)";
}

function getGradeTextColor(grade: string): string {
  if (["green", "a", "b"].some((g) => grade.toLowerCase().startsWith(g)))
    return Colors.gradeGreen;
  if (["yellow", "c"].some((g) => grade.toLowerCase().startsWith(g)))
    return Colors.gradeYellow;
  return Colors.gradeRed;
}

function gradeContextLabel(grade: string): string {
  if (grade === "green") return "Inom budget";
  if (grade === "yellow") return "Nära gräns";
  if (grade === "red") return "Över budget";
  const l = grade?.charAt(0).toLowerCase();
  if (l === "a" || l === "b") return "Över genomsnittet";
  if (l === "c") return "Genomsnittlig";
  return "Under genomsnittet";
}

export function BrfScoreCard({ grade, gradeColor, isPremium, paidAt, onUnlock }: Props) {
  const isTrafficLight = ["green", "yellow", "red"].includes(grade);

  return (
    <NivaCard style={s.card}>
      {/* Grade circle */}
      {isTrafficLight ? (
        <View style={[s.gradeOuter, { backgroundColor: getGradeBg(grade) }]}>
          <View style={[s.gradeDot, { backgroundColor: getGradeTextColor(grade) }]} />
        </View>
      ) : (
        <View style={[s.gradeOuter, { backgroundColor: getGradeBg(grade) }]}>
          <Text style={[s.gradeLetter, { color: getGradeTextColor(grade) }]}>{grade}</Text>
        </View>
      )}

      {/* Verdict */}
      <View style={{ flex: 1 }}>
        <Text style={s.label}>
          Föreningsbetyg · {gradeContextLabel(grade)}
        </Text>
        <Text style={s.verdict}>{generateVerdict(grade)}</Text>

        {!isPremium ? (
          <Pressable onPress={onUnlock}>
            <Text style={s.unlockCta}>Lås upp fullständig analys</Text>
          </Pressable>
        ) : (
          <View style={s.unlockedRow}>
            <Text style={s.unlockedText}>
              ✓ Upplåst{paidAt ? ` · ${new Date(paidAt).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}` : ""}
            </Text>
          </View>
        )}
      </View>
    </NivaCard>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    padding: 20,
    marginBottom: 20,
  },
  gradeOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeDot: { width: 14, height: 14, borderRadius: 7 },
  gradeLetter: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  label: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  verdict: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  unlockCta: {
    fontSize: 12,
    color: Colors.gold,
    fontFamily: "DMSans_500Medium",
    marginTop: 8,
  },
  unlockedRow: { marginTop: 8 },
  unlockedText: {
    fontSize: 12,
    color: Colors.gradeGreen,
    fontFamily: "DMSans_500Medium",
  },
});
