import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, View } from "react-native";
import { colors, s } from "../lib/ui";

type IconName = keyof typeof Ionicons.glyphMap;

/** Título de seção com ícone — substitui títulos soltos e emojis. */
export function SectionTitle({ icon, children }: { icon: IconName; children: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>{children}</Text>
    </View>
  );
}

/** Estado vazio com ícone e mensagem. */
export function Empty({ icon = "file-tray-outline", message }: { icon?: IconName; message: string }) {
  return (
    <View style={s.emptyBox}>
      <Ionicons name={icon} size={28} color={colors.mutedSoft} />
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>{message}</Text>
    </View>
  );
}

/** Indicador de carregamento centralizado. */
export function Loading() {
  return (
    <View style={{ paddingVertical: 32, alignItems: "center" }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

/** Círculo de direção do lançamento (entrada/saída/transferência). */
export function DirectionIcon({ type }: { type: string }) {
  const cfg =
    type === "income"
      ? { name: "arrow-up" as const, bg: colors.primarySoft, color: colors.primaryDark }
      : type === "expense"
        ? { name: "arrow-down" as const, bg: colors.dangerSoft, color: colors.danger }
        : { name: "swap-horizontal" as const, bg: "#f1f5f9", color: colors.muted };
  return (
    <View style={[s.iconCircle, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.name} size={16} color={cfg.color} />
    </View>
  );
}
