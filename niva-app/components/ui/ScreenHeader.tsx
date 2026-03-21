import { View, Text, StyleSheet, type ViewProps, type ViewStyle } from "react-native";
import { Colors, Fonts } from "../../lib/theme";

interface ScreenHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  rightElement,
  style,
  ...props
}: ScreenHeaderProps) {
  return (
    <View style={[s.container, style as ViewStyle]} {...props}>
      <View style={s.textContainer}>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        <Text style={s.title}>{title}</Text>
      </View>
      {rightElement}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    color: Colors.midnight,
    fontFamily: Fonts.serif,
  },
});
