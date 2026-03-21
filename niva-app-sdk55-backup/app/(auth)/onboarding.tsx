import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { NivaButton } from "../../components/ui/NivaButton";
import { NivaInput } from "../../components/ui/NivaInput";
import { NivaChip } from "../../components/ui/NivaChip";
import { NivaCard } from "../../components/ui/NivaCard";
import { Fonts } from "../../lib/theme";
import { createUser } from "../../lib/api";
import { useAuthStore } from "../../lib/store";

type HouseholdType = "solo" | "together";

export default function OnboardingScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  // Step state (1, 2, or 3)
  const [step, setStep] = useState(1);

  // Form data
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

  // Validation per step
  function canProceed(): boolean {
    if (step === 1) return true; // name is optional, household has default
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
      className="flex-1 bg-linen"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1 px-2"
        contentContainerStyle={{ paddingTop: 48, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-3">
          <Text
            className="text-midnight text-2xl mb-1"
            style={{ fontFamily: Fonts.serif }}
          >
            {step === 1
              ? "Välkommen till Nivå"
              : step === 2
                ? "Din ekonomi"
                : "Ditt lånelöfte"}
          </Text>
          <Text className="text-text-secondary text-base">
            {step === 1
              ? "Berätta om dig så anpassar vi analysen"
              : step === 2
                ? "Inkomst och sparande behövs för KALP-kalkylen"
                : "Sista steget — hur mycket kan du låna?"}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="flex-row gap-0.5 mb-3">
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              className={`flex-1 h-[3px] rounded-full ${
                s <= step ? "bg-midnight" : "bg-border"
              }`}
            />
          ))}
        </View>

        {/* Step 1: Household + Name */}
        {step === 1 && (
          <View className="gap-2">
            <NivaCard>
              <Text className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-1">
                Hur köper du?
              </Text>
              <View className="flex-row gap-1">
                <View className="flex-1">
                  <NivaChip
                    label="Själv"
                    selected={householdType === "solo"}
                    onPress={() => setHouseholdType("solo")}
                  />
                </View>
                <View className="flex-1">
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

        {/* Step 2: Income + Savings */}
        {step === 2 && (
          <View className="gap-2">
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

        {/* Step 3: Loan + Debts */}
        {step === 3 && (
          <View className="gap-2">
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
                <View
                  className="rounded-md p-1.5"
                  style={{ backgroundColor: "rgba(193, 163, 104, 0.06)" }}
                >
                  <Text className="text-midnight text-sm font-semibold">
                    Partners ekonomi
                  </Text>
                  <Text className="text-text-muted text-xs mt-0.5">
                    Bjud in din partner i nästa steg
                  </Text>
                </View>
              </NivaCard>
            )}
          </View>
        )}

        {/* Error */}
        {error && (
          <View
            className="rounded-md px-2 py-1.5 mt-2"
            style={{ backgroundColor: "rgba(169, 50, 38, 0.06)" }}
          >
            <Text className="text-grade-red text-sm font-medium">{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View className="px-2 pb-4">
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
          className="mt-1"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
