import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { NivaButton } from "../../components/ui/NivaButton";
import { NivaInput } from "../../components/ui/NivaInput";
import { NivaChip } from "../../components/ui/NivaChip";
import { NivaCard } from "../../components/ui/NivaCard";
import { Colors, Fonts } from "../../lib/theme";
import { createUser } from "../../lib/api";
import { useAuthStore } from "../../lib/store";

type HouseholdType = "solo" | "together";

export default function OnboardingScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = useState(1);
  const [householdType, setHouseholdType] = useState<HouseholdType>("solo");
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [loanPromise, setLoanPromise] = useState("");
  const [debts, setDebts] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parseNumber(value: string): number {
    return parseInt(value.replace(/\s/g, "")) || 0;
  }

  function canProceed(): boolean {
    if (step === 1) return true;
    if (step === 2) return parseNumber(income) > 0;
    if (step === 3) return parseNumber(loanPromise) > 0;
    return false;
  }

  async function handleSubmit() {
    if (!canProceed()) {
      setError("Fyll i obligatoriska fält.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await createUser({
        name: name || "Användare",
        income: parseNumber(income),
        savings: parseNumber(savings),
        loan_promise: parseNumber(loanPromise),
        other_debts: parseNumber(debts),
        household_type: householdType,
      });
      await login(user.id);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Något gick fel");
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    setError(null);
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    setError(null);
    if (step > 1) setStep(step - 1);
    else router.back();
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingTop: 48, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={s.title}>
            {step === 1
              ? "Välkommen till Nivå"
              : step === 2
                ? "Din ekonomi"
                : "Ditt lånelöfte"}
          </Text>
          <Text style={s.subtitle}>
            {step === 1
              ? "Berätta om dig så anpassar vi analysen"
              : step === 2
                ? "Inkomst och sparande behövs för KALP-kalkylen"
                : "Sista steget — hur mycket kan du låna?"}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressRow}>
          {[1, 2, 3].map((st) => (
            <View
              key={st}
              style={[
                s.progressBar,
                { backgroundColor: st <= step ? Colors.midnight : Colors.border },
              ]}
            />
          ))}
        </View>

        {/* Step 1 */}
        {step === 1 && (
          <View style={{ gap: 16 }}>
            <NivaCard>
              <Text style={s.sectionLabel}>Hur köper du?</Text>
              <View style={s.chipRow}>
                <View style={{ flex: 1 }}>
                  <NivaChip
                    label="Själv"
                    selected={householdType === "solo"}
                    onPress={() => setHouseholdType("solo")}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <NivaChip
                    label="Ihop"
                    selected={householdType === "together"}
                    onPress={() => setHouseholdType("together")}
                  />
                </View>
              </View>
            </NivaCard>

            <NivaCard>
              <NivaInput
                label="Namn"
                placeholder="Ditt förnamn"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </NivaCard>
          </View>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <View style={{ gap: 16 }}>
            <NivaCard>
              <NivaInput
                label="Nettoinkomst"
                suffix="kr/mån"
                placeholder="35 000"
                value={income}
                onChangeText={setIncome}
                formatNumber
              />
            </NivaCard>
            <NivaCard>
              <NivaInput
                label="Sparkapital"
                placeholder="500 000"
                value={savings}
                onChangeText={setSavings}
                formatNumber
              />
            </NivaCard>
          </View>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <View style={{ gap: 16 }}>
            <NivaCard>
              <NivaInput
                label="Lånelöfte"
                placeholder="3 000 000"
                value={loanPromise}
                onChangeText={setLoanPromise}
                formatNumber
              />
            </NivaCard>
            <NivaCard>
              <NivaInput
                label="Skulder per månad"
                suffix="(valfritt)"
                helper="CSN, billån, övriga lån"
                placeholder="0"
                value={debts}
                onChangeText={setDebts}
                formatNumber
              />
            </NivaCard>

            {householdType === "together" && (
              <NivaCard>
                <View style={s.partnerHint}>
                  <Text style={s.partnerTitle}>Partners ekonomi</Text>
                  <Text style={s.partnerDesc}>
                    Bjud in din partner i nästa steg
                  </Text>
                </View>
              </NivaCard>
            )}
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={s.ctaContainer}>
        <NivaButton
          label={step === 3 ? "Börja analysera" : "Fortsätt"}
          onPress={handleNext}
          loading={isSubmitting}
          disabled={!canProceed()}
        />
        <NivaButton
          label="Tillbaka"
          variant="ghost"
          onPress={handleBack}
          style={{ marginTop: 8 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.linen,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    color: Colors.midnight,
    fontSize: 24,
    fontFamily: "InstrumentSerif_400Regular_Italic",
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 999,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  partnerHint: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: "rgba(193, 163, 104, 0.06)",
  },
  partnerTitle: {
    color: Colors.midnight,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
  partnerDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  errorBox: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: "rgba(169, 50, 38, 0.06)",
  },
  errorText: {
    color: Colors.gradeRed,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  ctaContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
