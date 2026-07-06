import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { addMonthsYM, formatBRL, formatDateBR, formatMonthPT } from "../../lib/format";
import { trpc } from "../../lib/trpc";
import { colors, s } from "../../lib/ui";

export default function CardInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cycle, setCycle] = useState<string | undefined>(undefined);
  const [payAccountId, setPayAccountId] = useState<string | null>(null);

  const query = trpc.cards.invoice.useQuery({ cardId: id, cycle });
  const accounts = trpc.meta.accounts.useQuery();
  const utils = trpc.useUtils();
  const pay = trpc.cards.payInvoice.useMutation({
    onSuccess: ({ amountCents }) => {
      utils.invalidate();
      Alert.alert("✅ Fatura paga", `Pagamento de ${formatBRL(amountCents)} registrado.`);
    },
    onError: (err) => Alert.alert("Erro", err.message),
  });

  const d = query.data;
  const shownCycle = cycle ?? d?.invoice.cycle;

  function confirmPay() {
    if (!d || !shownCycle) return;
    const account =
      payAccountId ?? d.card.paymentAccountId ?? (accounts.data?.length === 1 ? accounts.data[0]!.id : null);
    if (!account) {
      Alert.alert("Escolha a conta", "Selecione de qual conta sai o pagamento.");
      return;
    }
    Alert.alert(
      "Pagar fatura",
      `Pagar ${formatBRL(d.invoice.pendingTotalCents)} da fatura ${shownCycle}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Pagar",
          onPress: () => pay.mutate({ cardId: id, cycle: shownCycle, accountId: account }),
        },
      ],
    );
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.container}
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
      }
    >
      {query.isLoading && <Text style={s.emptyText}>Carregando...</Text>}
      {d && shownCycle && (
        <>
          <View style={s.card}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, textAlign: "center" }}>
              💳 {d.card.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 8 }}>
              <TouchableOpacity style={s.chip} onPress={() => setCycle(addMonthsYM(shownCycle, -1))}>
                <Text style={s.chipText}>←</Text>
              </TouchableOpacity>
              <View style={{ minWidth: 140, alignItems: "center" }}>
                <Text style={{ fontWeight: "700", color: colors.text, textTransform: "capitalize" }}>
                  {formatMonthPT(shownCycle)}
                </Text>
                {shownCycle === d.currentCycle && (
                  <Text style={{ color: colors.primary, fontSize: 11 }}>(atual)</Text>
                )}
              </View>
              <TouchableOpacity style={s.chip} onPress={() => setCycle(addMonthsYM(shownCycle, 1))}>
                <Text style={s.chipText}>→</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 8 }}>
              {formatDateBR(d.invoice.start)} – {formatDateBR(d.invoice.end)} · vence{" "}
              {formatDateBR(d.invoice.dueDate)}
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center", marginTop: 6 }}>
              {formatBRL(d.invoice.totalCents)}
            </Text>
            {d.invoice.pendingTotalCents !== d.invoice.totalCents && (
              <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
                pendente: {formatBRL(d.invoice.pendingTotalCents)}
              </Text>
            )}
          </View>

          {d.invoice.pendingTotalCents > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Pagar fatura</Text>
              <Text style={s.label}>Debitar da conta</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {(accounts.data ?? []).map((acc) => {
                  const active = (payAccountId ?? d.card.paymentAccountId) === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[s.chip, active && s.chipActive]}
                      onPress={() => setPayAccountId(acc.id)}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{acc.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={s.button} onPress={confirmPay} disabled={pay.isPending}>
                <Text style={s.buttonText}>
                  {pay.isPending ? "Pagando..." : `Pagar ${formatBRL(d.invoice.pendingTotalCents)}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.card}>
            <Text style={s.cardTitle}>Lançamentos da fatura</Text>
            {d.invoice.transactions.length === 0 && (
              <Text style={s.emptyText}>Nenhum lançamento neste ciclo.</Text>
            )}
            {d.invoice.transactions.map((txn) => (
              <View key={txn.id} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text }} numberOfLines={1}>
                    {txn.description}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {formatDateBR(txn.date)}
                    {txn.status === "paid" ? " · pago" : ""}
                  </Text>
                </View>
                <Text style={s.money}>
                  {formatBRL(txn.type === "income" ? -txn.amountCents : txn.amountCents)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
