/**
 * Nivå Design Tokens & Utilities
 * For use outside NativeWind (e.g., Reanimated, chart colors, inline styles).
 */

// ─── Colors ─────────────────────────────────────────────────────

export const Colors = {
  // Brand
  linen: "#F5F0EB",
  midnight: "#1A1A2E",
  gold: "#C1A368",
  goldLight: "#D4B87A",
  stone: "#EDE8E3",
  border: "#E8E3DD",
  white: "#FFFFFF",

  // Text
  textPrimary: "#1A1A2E",
  textSecondary: "#6B6560",
  textMuted: "#9E9A95",

  // Grades
  gradeGreen: "#3D7A3A",
  gradeYellow: "#C49520",
  gradeRed: "#A93226",
} as const;

// ─── Grade Helpers ──────────────────────────────────────────────

export function getGradeColor(gradeColor: string): string {
  switch (gradeColor) {
    case "green":
      return Colors.gradeGreen;
    case "yellow":
      return Colors.gradeYellow;
    case "red":
      return Colors.gradeRed;
    default:
      return Colors.textMuted;
  }
}

export function getGradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    A: "Utmärkt",
    B: "Bra",
    C: "Godkänt",
    D: "Svag",
    E: "Mycket svag",
    F: "Underkänt",
  };
  return labels[grade] ?? grade;
}

// ─── Number Formatting (sv-SE) ──────────────────────────────────

const SEK_FORMATTER = new Intl.NumberFormat("sv-SE");

export function formatSEK(amount: number): string {
  return SEK_FORMATTER.format(amount) + " kr";
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + " mkr";
  if (amount >= 1_000) return Math.round(amount / 1_000) + " tkr";
  return String(amount);
}

export function formatPercent(value: number): string {
  return value.toFixed(1).replace(".", ",") + " %";
}

export function formatSqm(value: number): string {
  return `${value} m²`;
}

// ─── Spacing ────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

// ─── Typography ─────────────────────────────────────────────────

export const Fonts = {
  serif: "InstrumentSerif_400Regular_Italic",
  sans: "DMSans_400Regular",
  sansMedium: "DMSans_500Medium",
  sansBold: "DMSans_700Bold",
} as const;
