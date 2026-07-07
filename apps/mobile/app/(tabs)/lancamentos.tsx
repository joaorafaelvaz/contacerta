import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { DirectionIcon, Empty, Loading } from "../../components/ui";
import { addMonthsYM, formatBRL, formatDateBR, formatMonthPT, monthOfISO, todayISO } from "../../lib/format";
import { trpc } from "../../lib/trpc";
import { useTheme } from "../../lib/ui";


const STATUS_FILTERS = [
  { key: undefined, label: "Todos" },
  { key: "paid" as const, label: "Pagos" },
  { key: "pending" as const, label: "Pendentes" },
];

export default function TransactionsScreen() {
  const { colors, s } = useTheme();
  const router = useRouter();
  const [month, setMonth] = useState(() => monthOfISO(todayISO()));
  const [status, setStatus] = useState<"paid" | "pending" | undefined>(undefined);

  const list = trpc.transactions.list.useQuery({ month, status });
  const utils = trpc.useUtils();
  const markPaid = trpc.transactions.markPaid.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.overview.get.invalidate();
    },
  });

  return (
    <View style={s.screen}>
      <View style={{ padding: 12, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <TouchableOpacity
            style={s.chip}
            onPress={() => setMonth((m) => addMonthsYM(m, -1))}
            accessibilityLabel="Mês anterior"
          >
            <Ionicons name="chevron-back" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontWeight: "700", color: colors.text, textTransform: "capitalize", minWidth: 140, textAlign: "center" }}>
            {formatMonthPT(month)}
          </Text>
          <TouchableOpacity
            style={s.chip}
            onPress={() => setMonth((m) => addMonthsYM(m, 1))}
            accessibilityLabel="Próximo mês"
          >
            <Ionicons name="chevron-forward" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
          {STATUS_FILTERS.map((f) => {
            const active = status === f.key;
            return (
              <TouchableOpacity
                key={f.label}
                style={[s.chip, active && s.chipActive]}
                onPress={() => setStatus(f.key)}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={list.data ?? []}
        keyExtractor={(item) => item.txn.id}
        contentContainerStyle={{ padding: 12, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={list.isRefetching} onRefresh={() => list.refetch()} />
        }
        ListEmptyComponent={
          list.isLoading ? <Loading /> : <Empty message="Nenhum lançamento no período." />
        }
        renderItem={({ item }) => {
          const { txn } = item;
          const negative = txn.type === "expense" || txn.type === "transfer_out";
          const origin = item.accountName ?? item.cardName ?? "";
          return (
            <TouchableOpacity
              style={[s.card, { marginBottom: 8 }]}
              disabled={!!txn.transferGroupId}
              onPress={() => router.push(`/lancamento/${txn.id}`)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <DirectionIcon type={txn.type} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "500" }} numberOfLines={1}>
                    {txn.description}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {formatDateBR(txn.date)} · {origin}
                    {item.categoryName ? ` · ${item.categoryName}` : ""}
                  </Text>
                  {txn.status === "pending" && (
                    <Text style={{ color: colors.warn, fontSize: 11, fontWeight: "600" }}>
                      pendente{txn.dueDate ? ` · vence ${formatDateBR(txn.dueDate)}` : ""}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text
                    style={[s.money, { color: negative ? colors.danger : colors.primaryDark }]}
                  >
                    {formatBRL(negative ? -txn.amountCents : txn.amountCents)}
                  </Text>
                  {txn.status === "pending" && txn.accountId && (
                    <TouchableOpacity
                      style={s.listAction}
                      onPress={() => markPaid.mutate({ id: txn.id })}
                      disabled={markPaid.isPending}
                      accessibilityLabel={`Marcar ${txn.description} como paga`}
                    >
                      <Text style={s.listActionText}>Pagar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}


