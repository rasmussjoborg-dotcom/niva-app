import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useAuthStore } from "../../lib/store";
import {
  updateUser,
  generateInviteCode,
  acceptInvite,
  getHousehold,
  type HouseholdInfo,
} from "../../lib/api";
import { Colors, Fonts, formatSEK } from "../../lib/theme";
import { NivaCard } from "../../components/ui/NivaCard";
import { NivaButton } from "../../components/ui/NivaButton";
import { ScreenHeader } from "../../components/ui/ScreenHeader";

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();

  const [household, setHousehold] = useState<HouseholdInfo | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saveToast, setSaveToast] = useState(false);

  // Fetch household info
  useEffect(() => {
    if (!user?.household_id) return;
    getHousehold(user.household_id)
      .then(setHousehold)
      .catch(() => {});
  }, [user?.household_id]);

  if (!user) return null;

  const hasPartner = household && household.members.length > 1;

  // Financial data rows
  const financialRows = [
    { label: "Nettoinkomst", field: "income", value: user.income, suffix: "/mån" },
    { label: "Sparkapital", field: "savings", value: user.savings, suffix: "" },
    { label: "Lånelöfte", field: "loan_promise", value: user.loan_promise, suffix: "" },
    { label: "Skulder", field: "other_debts", value: user.other_debts || 0, suffix: "" },
  ];

  function startEditing(field: string, currentValue: number) {
    setEditingField(field);
    setEditValue(String(currentValue));
  }

  async function saveField(field: string) {
    const numValue = parseInt(editValue.replace(/\D/g, "")) || 0;

    if ((field === "income" || field === "loan_promise") && numValue <= 0) {
      setError(field === "income" ? "Inkomst måste vara större än 0" : "Lånelöfte måste vara större än 0");
      setEditingField(null);
      return;
    }

    setEditingField(null);
    try {
      const updated = await updateUser(user!.id, { [field]: numValue });
      setUser(updated);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleGenerateCode() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateInviteCode();
      setInviteCode(result.code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptCode() {
    if (!inputCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const info = await acceptInvite(inputCode.trim().toUpperCase());
      setHousehold(info);
      setShowCodeInput(false);
      setInputCode("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert("Logga ut", "Vill du logga ut?", [
      { text: "Avbryt", style: "cancel" },
      { text: "Logga ut", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <View className="flex-1 bg-linen pt-6">
      <ScrollView
        className="flex-1 px-2"
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Header */}
        <ScreenHeader title="Din profil" />

        {/* Avatar + name card */}
        <NivaCard className="flex-row items-center gap-2 p-2 mb-1.5">
          <View
            className="rounded-full bg-stone items-center justify-center border border-border"
            style={{ width: 52, height: 52 }}
          >
            <Text className="text-text-secondary text-xl font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-midnight text-lg font-semibold">
              {user.name}
            </Text>
            <View className="bg-stone px-1.5 py-0.5 rounded-full self-start mt-0.5">
              <Text className="text-text-secondary text-xs font-medium">
                {user.household_type === "solo" ? "Köper själv" : "Köper ihop"}
              </Text>
            </View>
          </View>
        </NivaCard>

        {/* Financial data */}
        <NivaCard className="p-2 mb-1.5">
          <Text className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-1.5">
            Ekonomi
          </Text>
          {financialRows.map((row) => (
            <Pressable
              key={row.field}
              onPress={() =>
                editingField !== row.field &&
                startEditing(row.field, row.value)
              }
              className="flex-row justify-between items-center py-1 border-b border-border"
            >
              <Text className="text-text-secondary text-sm">
                {row.label}
              </Text>
              {editingField === row.field ? (
                <TextInput
                  autoFocus
                  keyboardType="number-pad"
                  value={editValue}
                  onChangeText={setEditValue}
                  onBlur={() => saveField(row.field)}
                  onSubmitEditing={() => saveField(row.field)}
                  className="text-midnight text-sm font-semibold text-right bg-linen border border-gold rounded-sm px-1"
                  style={{
                    fontVariant: ["tabular-nums"],
                    width: 120,
                    paddingVertical: 2,
                  }}
                />
              ) : (
                <View className="flex-row items-center gap-0.5">
                  <Text
                    className="text-midnight text-sm font-semibold"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatSEK(row.value)}
                    {row.suffix}
                  </Text>
                  <Text className="text-text-muted text-xs">✏️</Text>
                </View>
              )}
            </Pressable>
          ))}
        </NivaCard>

        {/* Household / Partner section */}
        <NivaCard className="p-2 mb-1.5">
          <Text className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-1.5">
            Hushållsläge
          </Text>

          {hasPartner ? (
            <View>
              {/* Connected partner */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "rgba(61, 122, 58, 0.1)",
                  }}
                >
                  <Text style={{ color: Colors.gradeGreen, fontWeight: "600", fontSize: 14 }}>
                    {household!.members[1]?.name?.charAt(0).toUpperCase() || "P"}
                  </Text>
                </View>
                <View>
                  <Text className="text-midnight text-sm font-semibold">
                    {household!.members[1]?.name || "Partner"}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.gradeGreen }}>
                    Kopplad
                  </Text>
                </View>
              </View>

              {/* Combined financials */}
              <View className="bg-linen rounded-md p-1.5">
                <Text className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-1">
                  Hushållskalkyl
                </Text>
                {[
                  { label: "Gemensam inkomst", value: formatSEK(household!.combined_income) + "/mån" },
                  { label: "Gemensamt sparande", value: formatSEK(household!.combined_savings) },
                  { label: "Gemensamt lånelöfte", value: formatSEK(household!.combined_loan_promise) },
                  { label: "Gemensamma skulder", value: formatSEK(household!.combined_debts) + "/mån" },
                ].map((row) => (
                  <View
                    key={row.label}
                    className="flex-row justify-between py-0.5"
                  >
                    <Text className="text-text-muted text-xs">
                      {row.label}
                    </Text>
                    <Text
                      className="text-midnight text-sm font-semibold"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View>
              {inviteCode ? (
                <View>
                  <Text className="text-text-muted text-xs mb-1">
                    Dela denna kod med din partner:
                  </Text>
                  <View className="bg-linen rounded-md p-2 items-center mb-1.5">
                    <Text
                      className="text-midnight text-xl font-bold"
                      style={{
                        letterSpacing: 6,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {inviteCode}
                    </Text>
                  </View>
                </View>
              ) : showCodeInput ? (
                <View>
                  <Text className="text-text-muted text-xs mb-1">
                    Ange partnerns inbjudningskod:
                  </Text>
                  <View className="flex-row gap-1 mb-1.5">
                    <TextInput
                      maxLength={6}
                      placeholder="ABCDEF"
                      placeholderTextColor={Colors.textMuted}
                      value={inputCode}
                      onChangeText={(t) => setInputCode(t.toUpperCase())}
                      className="flex-1 bg-white border border-border rounded-md px-2 py-1.5 text-midnight text-sm text-center uppercase"
                      style={{ letterSpacing: 4 }}
                      autoCapitalize="characters"
                    />
                    <NivaButton
                      label="Koppla"
                      size="md"
                      onPress={handleAcceptCode}
                      disabled={loading || inputCode.length < 6}
                      loading={loading}
                      className="px-2"
                    />
                  </View>
                </View>
              ) : (
                <View className="gap-1">
                  <NivaButton
                    label="Bjud in partner"
                    onPress={handleGenerateCode}
                    loading={loading}
                  />
                  <NivaButton
                    label="Ange inbjudningskod"
                    variant="secondary"
                    onPress={() => setShowCodeInput(true)}
                  />
                </View>
              )}

              {error && (
                <View
                  className="mt-1 px-1.5 py-1 rounded-md"
                  style={{ backgroundColor: "rgba(169, 50, 38, 0.06)" }}
                >
                  <Text className="text-grade-red text-xs">{error}</Text>
                </View>
              )}
            </View>
          )}
        </NivaCard>

        {/* Notifications */}
        <NivaCard className="p-2 mb-1.5">
          <Text className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-1.5">
            Aviseringar
          </Text>
          {[
            { label: "Prisförändringar", enabled: true },
            { label: "Nya resultat", enabled: true },
          ].map((item) => (
            <View
              key={item.label}
              className="flex-row justify-between items-center py-1"
            >
              <Text className="text-text-secondary text-sm">
                {item.label}
              </Text>
              <View
                className="rounded-full"
                style={{
                  width: 40,
                  height: 22,
                  backgroundColor: item.enabled
                    ? Colors.midnight
                    : Colors.border,
                }}
              >
                <View
                  className="rounded-full bg-white"
                  style={{
                    width: 16,
                    height: 16,
                    position: "absolute",
                    top: 3,
                    left: item.enabled ? 21 : 3,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  }}
                />
              </View>
            </View>
          ))}
        </NivaCard>

        {/* Logout */}
        <NivaButton
          label="Logga ut"
          variant="danger"
          onPress={handleLogout}
          className="mt-2"
        />
      </ScrollView>

      {/* Save toast */}
      {saveToast && (
        <View
          className="bg-midnight rounded-full px-2 py-1"
          style={{
            position: "absolute",
            bottom: 40,
            alignSelf: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
          }}
        >
          <Text className="text-white text-xs font-semibold">Sparat ✓</Text>
        </View>
      )}
    </View>
  );
}
