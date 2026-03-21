import { View, StyleSheet, type ViewProps, type ViewStyle } from "react-native";
import { Colors } from "../../lib/theme";

interface NivaCardProps extends ViewProps {
  accent?: string;
  noPadding?: boolean;
  dashed?: boolean;
}

export function NivaCard({
  accent,
  noPadding,
  dashed,
  style,
  children,
  ...props
}: NivaCardProps) {
  return (
    <View
      style={[
        s.card,
        !noPadding && s.padding,
        accent ? { borderLeftWidth: 3, borderLeftColor: accent } : undefined,
        dashed ? { borderStyle: "dashed" } : undefined,
        style as ViewStyle,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  padding: {
    padding: 16,
  },
});
