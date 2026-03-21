import { View, Text, TextInput, StyleSheet, type TextInputProps, type ViewStyle } from "react-native";
import { Colors, Fonts } from "../../lib/theme";

interface NivaInputProps extends TextInputProps {
  label: string;
  helper?: string;
  error?: string;
  formatNumber?: boolean;
  suffix?: string;
  containerStyle?: ViewStyle;
}

function formatWithSpaces(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function NivaInput({
  label,
  helper,
  error,
  formatNumber,
  suffix,
  value,
  onChangeText,
  containerStyle,
  ...props
}: NivaInputProps) {
  function handleChange(text: string) {
    if (formatNumber) {
      onChangeText?.(formatWithSpaces(text));
    } else {
      onChangeText?.(text);
    }
  }

  return (
    <View style={containerStyle}>
      <Text style={s.label}>
        {label}
        {suffix && <Text style={s.suffix}> {suffix}</Text>}
      </Text>
      {helper && <Text style={s.helper}>{helper}</Text>}
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholderTextColor={Colors.textMuted}
        style={[s.input, { fontVariant: ["tabular-nums"] }]}
        {...(formatNumber ? { keyboardType: "number-pad" } : {})}
        {...props}
      />
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  suffix: {
    fontFamily: "DMSans_400Regular",
    textTransform: "none",
    letterSpacing: 0,
  },
  helper: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.midnight,
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
  },
  error: {
    color: Colors.gradeRed,
    fontSize: 12,
    marginTop: 4,
  },
});
