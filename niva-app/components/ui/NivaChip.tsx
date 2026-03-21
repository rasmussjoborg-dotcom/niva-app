import { Pressable, Text, StyleSheet, type PressableProps, type ViewStyle } from "react-native";
import { Colors } from "../../lib/theme";

interface NivaChipProps extends Omit<PressableProps, "children"> {
  label: string;
  selected?: boolean;
}

export function NivaChip({
  label,
  selected = false,
  style,
  ...props
}: NivaChipProps) {
  return (
    <Pressable
      style={[
        s.chip,
        selected ? s.chipSelected : s.chipDefault,
        style as ViewStyle,
      ]}
      {...props}
    >
      <Text style={[s.label, { color: selected ? Colors.white : Colors.midnight }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: Colors.midnight,
    borderColor: Colors.midnight,
  },
  chipDefault: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    textAlign: "center",
  },
});
