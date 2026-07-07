import { StyleSheet, useColorScheme } from "react-native";

export interface Palette {
  primary: string;
  primaryDark: string; // acento de texto/ícone verde
  primarySoft: string; // fundo de chip/círculo verde
  heroBg: string; // fundo do cartão-herói (saldo positivo)
  heroDangerBg: string; // fundo do cartão-herói (saldo negativo)
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  muted: string;
  mutedSoft: string;
  border: string;
  danger: string;
  dangerSoft: string;
  warn: string;
  warnBg: string;
}

export const lightColors: Palette = {
  primary: "#059669",
  primaryDark: "#047857",
  primarySoft: "#ecfdf5",
  heroBg: "#047857",
  heroDangerBg: "#7f1d1d",
  bg: "#f1f5f9",
  card: "#ffffff",
  cardBorder: "rgba(15,23,42,0.04)",
  text: "#1e293b",
  // slate-500: contraste 4.76:1 sobre branco
  muted: "#64748b",
  mutedSoft: "#94a3b8",
  border: "#e2e8f0",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  warn: "#b45309",
  warnBg: "#fef3c7",
};

export const darkColors: Palette = {
  primary: "#10b981",
  primaryDark: "#34d399", // verde claro para texto sobre superfícies escuras
  primarySoft: "#064e3b",
  heroBg: "#065f46",
  heroDangerBg: "#7f1d1d",
  bg: "#0f172a",
  card: "#1e293b",
  cardBorder: "#334155",
  text: "#f1f5f9",
  muted: "#94a3b8", // 4.6:1 sobre card escuro
  mutedSoft: "#64748b",
  border: "#334155",
  danger: "#f87171",
  dangerSoft: "rgba(248,113,113,0.12)",
  warn: "#fbbf24",
  warnBg: "rgba(251,191,36,0.15)",
};

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    container: { padding: 16, gap: 12 },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.cardBorder,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    cardTitle: { fontSize: 13, fontWeight: "600", color: c.muted, marginBottom: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      gap: 8,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    h1: { fontSize: 20, fontWeight: "700", color: c.text },
    label: { fontSize: 12, fontWeight: "600", color: c.muted, marginBottom: 4 },
    input: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: c.text,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: 12,
      minHeight: 48, // alvo de toque mínimo (Apple HIG: 44pt)
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      minHeight: 36,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontSize: 13, color: c.text },
    chipTextActive: { color: "#fff", fontWeight: "600" },
    /** ação pequena de lista (Pagar) com área de toque adequada */
    listAction: {
      minHeight: 36,
      minWidth: 56,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    listActionText: { color: c.primaryDark, fontWeight: "700", fontSize: 13 },
    /** círculo de ícone para direção do lançamento */
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    money: { fontVariant: ["tabular-nums"], fontWeight: "600" },
    emptyText: { textAlign: "center", color: c.muted, paddingVertical: 20, fontSize: 13 },
    emptyBox: { alignItems: "center", gap: 6, paddingVertical: 20 },
  });
}

const lightStyles = makeStyles(lightColors);
const darkStyles = makeStyles(darkColors);

export type ThemeStyles = typeof lightStyles;

/** Tema atual seguindo o sistema (iOS/Android). */
export function useTheme(): { colors: Palette; s: ThemeStyles; isDark: boolean } {
  const isDark = useColorScheme() === "dark";
  return {
    colors: isDark ? darkColors : lightColors,
    s: isDark ? darkStyles : lightStyles,
    isDark,
  };
}
