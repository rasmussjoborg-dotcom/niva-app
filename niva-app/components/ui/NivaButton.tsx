import { Pressable, Text, ActivityIndicator, StyleSheet, type PressableProps, type ViewStyle } from "react-native";
import { Colors, Fonts } from "../../lib/theme";

interface NivaButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export function NivaButton({
  label,
  variant = "primary",
  loading = false,
  size = "lg",
  disabled,
  style,
  ...props
}: NivaButtonProps) {
  const isDisabled = disabled || loading;

  const bgStyle: ViewStyle =
    variant === "primary"
      ? { backgroundColor: Colors.midnight }
      : variant === "secondary"
        ? { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border }
        : variant === "danger"
          ? { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gradeRed }
          : { backgroundColor: "transparent" };

  const textColor =
    variant === "primary"
      ? Colors.white
      : variant === "danger"
        ? Colors.gradeRed
        : Colors.midnight;

  const paddingVertical = size === "sm" ? 8 : size === "md" ? 12 : 16;

  return (
    <Pressable
      style={[
        s.button,
        bgStyle,
        { paddingVertical, opacity: isDisabled ? 0.5 : 1 },
        style as ViewStyle,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? Colors.white : Colors.midnight}
          size="small"
        />
      ) : (
        <Text style={[s.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    textAlign: "center",
  },
});
