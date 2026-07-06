import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { authClient } from "../../lib/auth-client";
import { formatBRL, formatDateBR, formatMonthPT } from "../../lib/format";
import { trpc } from "../../lib/trpc";
import { colors, s } from "../../lib/ui";

function Money({ cents, signed = false }: { cents: number; signed?: boolean }) {
  const color = signed ? (cents < 0 ? colors.danger : colors.primaryDark) : colors.text;
  return <Text style={[s.money, { color }]}>{formatBRL(cents)}</Text>;
}

export default function HomeScreen() {
  const router = useRouter();
  const overview = trpc.overview.get.useQuery();
  const utils = trpc.useUtils();
  const markPaid = trpc.transactions.markPaid.useMutation({
    onSuccess: () => utils.overview.get.invalidate(),
  });

  const d = overview.data;
  const totalBalance = d?.accounts.reduce((acc, a) => acc + a.balanceCents, 0) ?? 0;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.container}
      refreshControl={
        <RefreshControl refreshing={overview.isRefetching} onRefresh={() => overview.refetch()} />
      }
    >
      {overview.isLoading && <Text style={s.emptyText}>Carregando...</Text>}
      {overview.error && (
        <Text style={[s.emptyText, { color: colors.danger }]}>
          Erro ao carregar: {overview.error.message}
        </Text>
      )}

      {d && (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>Saldo das contas</Text>
            {d.accounts.length === 0 && (
              <Text style={s.emptyText}>Cadastre contas pelo dashboard web.</Text>
            )}
            {d.accounts.map((acc) => (
              <View key={acc.id} style={s.row}>
                <Text style={{ color: colors.text }}>{acc.name}</Text>
                <Money cents={acc.balanceCents} signed />
              </View>
            ))}
            {d.accounts.length > 0 && (
              <>
                <View style={s.divider} />
                <View style={s.row}>
                  <Text style={{ fontWeight: "700", color: colors.text }}>Total</Text>
                  <Text style={[s.money, { fontWeight: "800", color: totalBalance < 0 ? colors.danger : colors.primaryDark }]}>
                    {formatBRL(totalBalance)}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Faturas dos cartões</Text>
            {d.invoices.length === 0 && <Text style={s.emptyText}>Nenhum cartão cadastrado.</Text>}
            {d.invoices.map((inv) => (
              <TouchableOpacity
                key={inv.cardId}
                style={s.row}
                onPress={() => router.push(`/cartao/${inv.cardId}`)}
              >
                <View>
                  <Text style={{ color: colors.text, fontWeight: "500" }}>{inv.cardName}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    vence {formatDateBR(inv.dueDate)}
                  </Text>
                </View>
                <Money cents={inv.totalCents} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Próximos vencimentos (30 dias)</Text>
            {d.upcoming.length === 0 && (
              <Text style={s.emptyText}>Nenhuma conta a pagar no período. 🎉</Text>
            )}
            {d.upcoming.map((txn) => {
              const overdue = txn.dueDate! < d.today;
              return (
                <View key={txn.id} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text }} numberOfLines={1}>
                      {txn.description}
                    </Text>
                    <Text style={{ color: overdue ? colors.danger : colors.muted, fontSize: 12, fontWeight: overdue ? "700" : "400" }}>
                      {overdue ? "venceu" : "vence"} {formatDateBR(txn.dueDate!)}
                    </Text>
                  </View>
                  <Money cents={txn.type === "income" ? txn.amountCents : -txn.amountCents} signed />
                  {txn.accountId && (
                    <TouchableOpacity
                      onPress={() => markPaid.mutate({ id: txn.id })}
                      disabled={markPaid.isPending}
                    >
                      <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                        Pagar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Orçamento de {formatMonthPT(d.month)}</Text>
            {d.budgets.length === 0 && (
              <Text style={s.emptyText}>Defina metas pelo dashboard web.</Text>
            )}
            {d.budgets.map((b) => {
              const pct = Math.min(1, b.spentCents / b.budgetCents);
              const over = b.spentCents > b.budgetCents;
              return (
                <View key={b.budgetId} style={{ paddingVertical: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: "500" }}>
                      {b.categoryName}
                    </Text>
                    <Text style={{ fontSize: 12, color: over ? colors.danger : colors.muted }}>
                      {formatBRL(b.spentCents)} / {formatBRL(b.budgetCents)}
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 999, overflow: "hidden" }}>
                    <View
                      style={{
                        height: "100%",
                        width: `${pct * 100}%`,
                        backgroundColor: over ? colors.danger : colors.primary,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity onPress={() => authClient.signOut()} style={{ alignItems: "center", padding: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Sair da conta</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
