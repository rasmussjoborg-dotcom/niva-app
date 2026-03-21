import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
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

  useEffect(() => {
    if (!user?.household_id) return;
    getHousehold(user.household_id)
      .then(setHousehold)
      .catch(() => {});
  }, [user?.household_id]);

  if (!user) return null;

  const hasPartner = household && household.members.length > 1;

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
    <View style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <ScreenHeader title="Din profil" />

        {/* Avatar + name */}
        <NivaCard style={s.avatarCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarLetter}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={s.userName}>{user.name}</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>
                {user.household_type === "solo" ? "Köper själv" : "Köper ihop"}
              </Text>
            </View>
          </View>
        </NivaCard>

        {/* Financial data */}
        <NivaCard style={s.sectionCard}>
          <Text style={s.sectionLabel}>Ekonomi</Text>
          {financialRows.map((row) => (
            <Pressable
              key={row.field}
              onPress={() =>
                editingField !== row.field &&
                startEditing(row.field, row.value)
              }
              style={s.finRow}
            >
              <Text style={s.finLabel}>{row.label}</Text>
              {editingField === row.field ? (
                <TextInput
                  autoFocus
                  keyboardType="number-pad"
                  value={editValue}
                  onChangeText={setEditValue}
                  onBlur={() => saveField(row.field)}
                  onSubmitEditing={() => saveField(row.field)}
                  style={s.finInput}
                />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={s.finValue}>
                    {formatSEK(row.value)}{row.suffix}
                  </Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 12 }}>✏️</Text>
                </View>
              )}
            </Pressable>
          ))}
        </NivaCard>

        {/* Household */}
        <NivaCard style={s.sectionCard}>
          <Text style={s.sectionLabel}>Hushållsläge</Text>

          {hasPartner ? (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <View style={s.partnerAvatar}>
                  <Text style={{ color: Colors.gradeGreen, fontWeight: "600", fontSize: 14 }}>
                    {household!.members[1]?.name?.charAt(0).toUpperCase() || "P"}
                  </Text>
                </View>
                <View>
                  <Text style={s.partnerName}>{household!.members[1]?.name || "Partner"}</Text>
                  <Text style={{ fontSize: 12, color: Colors.gradeGreen }}>Kopplad</Text>
                </View>
              </View>

              <View style={s.combinedBox}>
                <Text style={s.sectionLabel}>Hushållskalkyl</Text>
                {[
                  { label: "Gemensam inkomst", value: formatSEK(household!.combined_income) + "/mån" },
                  { label: "Gemensamt sparande", value: formatSEK(household!.combined_savings) },
                  { label: "Gemensamt lånelöfte", value: formatSEK(household!.combined_loan_promise) },
                  { label: "Gemensamma skulder", value: formatSEK(household!.combined_debts) + "/mån" },
                ].map((row) => (
                  <View key={row.label} style={s.combinedRow}>
                    <Text style={{ color: Colors.textMuted, fontSize: 12 }}>{row.label}</Text>
                    <Text style={s.finValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View>
              {inviteCode ? (
                <View>
                  <Text style={{ color: Colors.textMuted, fontSize: 12, marginBottom: 8 }}>
                    Dela denna kod med din partner:
                  </Text>
                  <View style={s.codeBox}>
                    <Text style={s.codeText}>{inviteCode}</Text>
                  </View>
                </View>
              ) : showCodeInput ? (
                <View>
                  <Text style={{ color: Colors.textMuted, fontSize: 12, marginBottom: 8 }}>
                    Ange partnerns inbjudningskod:
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                    <TextInput
                      maxLength={6}
                      placeholder="ABCDEF"
                      placeholderTextColor={Colors.textMuted}
                      value={inputCode}
                      onChangeText={(t) => setInputCode(t.toUpperCase())}
                      style={s.codeInput}
                      autoCapitalize="characters"
                    />
                    <NivaButton
                      label="Koppla"
                      size="md"
                      onPress={handleAcceptCode}
                      disabled={loading || inputCode.length < 6}
                      loading={loading}
                      style={{ paddingHorizontal: 16 }}
                    />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <NivaButton label="Bjud in partner" onPress={handleGenerateCode} loading={loading} />
                  <NivaButton label="Ange inbjudningskod" variant="secondary" onPress={() => setShowCodeInput(true)} />
                </View>
              )}

              {error && (
                <View style={s.errorBox}>
                  <Text style={{ color: Colors.gradeRed, fontSize: 12 }}>{error}</Text>
                </View>
              )}
            </View>
          )}
        </NivaCard>

        {/* Notifications */}
        <NivaCard style={s.sectionCard}>
          <Text style={s.sectionLabel}>Aviseringar</Text>
          {[
            { label: "Prisförändringar", enabled: true },
            { label: "Nya resultat", enabled: true },
          ].map((item) => (
            <View key={item.label} style={s.notifRow}>
              <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>{item.label}</Text>
              <View
                style={[s.toggle, { backgroundColor: item.enabled ? Colors.midnight : Colors.border }]}
              >
                <View
                  style={[
                    s.toggleKnob,
                    { left: item.enabled ? 21 : 3 },
                  ]}
                />
              </View>
            </View>
          ))}
        </NivaCard>

        <NivaButton
          label="Logga ut"
          variant="danger"
          onPress={handleLogout}
          style={{ marginTop: 16 }}
        />
      </ScrollView>

      {saveToast && (
        <View style={s.toast}>
          <Text style={s.toastText}>Sparat ✓</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.linen,
    paddingTop: 48,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    marginBottom: 12,
  },
  avatarCircle: {
    borderRadius: 999,
    backgroundColor: Colors.stone,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    width: 52,
    height: 52,
  },
  avatarLetter: {
    color: Colors.textSecondary,
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
  },
  userName: {
    color: Colors.midnight,
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  badge: {
    backgroundColor: Colors.stone,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
  },
  sectionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
  },
  finRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  finLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  finValue: {
    color: Colors.midnight,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    fontVariant: ["tabular-nums"],
  },
  finInput: {
    color: Colors.midnight,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    textAlign: "right",
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: 120,
    fontVariant: ["tabular-nums"],
  },
  partnerAvatar: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    backgroundColor: "rgba(61, 122, 58, 0.1)",
  },
  partnerName: {
    color: Colors.midnight,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
  combinedBox: {
    backgroundColor: Colors.linen,
    borderRadius: 8,
    padding: 12,
  },
  combinedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  codeBox: {
    backgroundColor: Colors.linen,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  codeText: {
    color: Colors.midnight,
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 6,
    fontVariant: ["tabular-nums"],
  },
  codeInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.midnight,
    fontSize: 14,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 4,
  },
  errorBox: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(169, 50, 38, 0.06)",
  },
  notifRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  toggle: {
    borderRadius: 999,
    width: 40,
    height: 22,
  },
  toggleKnob: {
    borderRadius: 999,
    backgroundColor: Colors.white,
    width: 16,
    height: 16,
    position: "absolute",
    top: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toast: {
    backgroundColor: Colors.midnight,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  toastText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
  },
});
