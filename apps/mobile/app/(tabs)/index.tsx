import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Empty, Loading, SectionTitle } from "../../components/ui";
import { authClient } from "../../lib/auth-client";
import { formatBRL, formatDateBR, formatMonthPT } from "../../lib/format";
import { trpc } from "../../lib/trpc";
import { useTheme } from "../../lib/ui";


function Money({ cents, signed = false }: { cents: number; signed?: boolean }) {
  const { colors, s } = useTheme();
  const color = signed ? (cents < 0 ? colors.danger : colors.primaryDark) : colors.text;
  return <Text style={[s.money, { color }]}>{formatBRL(cents)}</Text>;
}

export default function HomeScreen() {
  const { colors, s } = useTheme();
  const router = useRouter();
  const overview = trpc.overview.get.useQuery();
  const utils = trpc.useUtils();
  const markPaid = trpc.transactions.markPaid.useMutation({
    onSuccess: () => utils.overview.get.invalidate(),
  });

  const d = overview.data;
  const totalBalance = d?.accounts.reduce((acc, a) => acc + a.balanceCents, 0) ?? 0;
  const totalDue =
    d?.upcoming.filter((t) => t.type !== "income").reduce((acc, t) => acc + t.amountCents, 0) ?? 0;
  const overdueCount = d?.upcoming.filter((t) => t.dueDate! < d.today).length ?? 0;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.container, { paddingBottom: 32 }]}
      refreshControl={
        <RefreshControl refreshing={overview.isRefetching} onRefresh={() => overview.refetch()} />
      }
    >
      {overview.isLoading && <Loading />}
      {overview.error && (
        <Empty icon="cloud-offline-outline" message={`Erro ao carregar: ${overview.error.message}`} />
      )}

      {d && (
        <>
          {/* hero: o número mais importante em destaque */}
          <View
            style={[
              s.card,
              {
                backgroundColor: totalBalance < 0 ? colors.heroDangerBg : colors.heroBg,
                paddingVertical: 20,
              },
            ]}
          >
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "600" }}>
              Saldo em contas · {formatMonthPT(d.month)}
            </Text>
            <Text
              style={[
                s.money,
                { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 },
              ]}
            >
              {formatBRL(totalBalance)}
            </Text>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.75)" />
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
                  a pagar: {formatBRL(totalDue)}
                </Text>
              </View>
              {overdueCount > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="alert-circle" size={13} color="#fecaca" />
                  <Text style={{ color: "#fecaca", fontSize: 12, fontWeight: "700" }}>
                    {overdueCount} atrasada{overdueCount > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={s.card}>
            <SectionTitle icon="wallet-outline">Contas</SectionTitle>
            {d.accounts.length === 0 && (
              <Empty icon="wallet-outline" message="Cadastre contas pelo dashboard web." />
            )}
            {d.accounts.map((acc) => (
              <View key={acc.id} style={s.row}>
                <Text style={{ color: colors.text }}>{acc.name}</Text>
                <Money cents={acc.balanceCents} signed />
              </View>
            ))}
          </View>

          <View style={s.card}>
            <SectionTitle icon="card-outline">Faturas dos cartões</SectionTitle>
            {d.invoices.length === 0 && (
              <Empty icon="card-outline" message="Nenhum cartão cadastrado." />
            )}
            {d.invoices.map((inv) => (
              <TouchableOpacity
                key={inv.cardId}
                style={s.row}
                onPress={() => router.push(`/cartao/${inv.cardId}`)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <View style={[s.iconCircle, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="card" size={16} color={colors.primaryDark} />
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontWeight: "500" }}>{inv.cardName}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      vence {formatDateBR(inv.dueDate)}
                    </Text>
                  </View>
                </View>
                <Money cents={inv.totalCents} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.card}>
            <SectionTitle icon="time-outline">Próximos vencimentos (30 dias)</SectionTitle>
            {d.upcoming.length === 0 && (
              <Empty icon="checkmark-circle-outline" message="Nenhuma conta a pagar no período." />
            )}
            {d.upcoming.map((txn) => {
              const overdue = txn.dueDate! < d.today;
              return (
                <View key={txn.id} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text }} numberOfLines={1}>
                      {txn.description}
                    </Text>
                    <Text
                      style={{
                        color: overdue ? colors.danger : colors.muted,
                        fontSize: 12,
                        fontWeight: overdue ? "700" : "400",
                      }}
                    >
                      {overdue ? "venceu" : "vence"} {formatDateBR(txn.dueDate!)}
                    </Text>
                  </View>
                  <Money cents={txn.type === "income" ? txn.amountCents : -txn.amountCents} signed />
                  {txn.accountId && (
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
              );
            })}
          </View>

          <View style={s.card}>
            <SectionTitle icon="pie-chart-outline">
              {`Orçamento de ${formatMonthPT(d.month)}`}
            </SectionTitle>
            {d.budgets.length === 0 && (
              <Empty icon="pie-chart-outline" message="Defina metas pelo dashboard web." />
            )}
            {d.budgets.map((b) => {
              const pct = Math.min(1, b.spentCents / b.budgetCents);
              const over = b.spentCents > b.budgetCents;
              return (
                <View key={b.budgetId} style={{ paddingVertical: 6 }}>
                  <View
                    style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}
                  >
                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: "500" }}>
                      {b.categoryName}
                    </Text>
                    <Text style={{ fontSize: 12, color: over ? colors.danger : colors.muted }}>
                      {formatBRL(b.spentCents)} / {formatBRL(b.budgetCents)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.border,
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
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

          <TouchableOpacity
            onPress={() => authClient.signOut()}
            style={{ alignItems: "center", padding: 12, minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: colors.muted, fontSize: 13 }}>Sair da conta</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}


