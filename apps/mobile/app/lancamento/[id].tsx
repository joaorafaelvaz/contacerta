import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { parseAmountToCents } from "../../lib/format";
import { trpc } from "../../lib/trpc";
import { colors, s } from "../../lib/ui";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const txn = trpc.transactions.byId.useQuery({ id });
  const accounts = trpc.meta.accounts.useQuery();
  const cards = trpc.cards.list.useQuery();
  const categories = trpc.meta.categories.useQuery();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [sourceKey, setSourceKey] = useState<string | null>(null); // "account:id" | "card:id"
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = txn.data;
    if (!t) return;
    setDescription(t.description);
    setAmount((t.amountCents / 100).toFixed(2).replace(".", ","));
    setType(t.type === "income" ? "income" : "expense");
    setSourceKey(t.accountId ? `account:${t.accountId}` : t.creditCardId ? `card:${t.creditCardId}` : null);
    setCategoryId(t.categoryId);
    setPending(t.status === "pending");
  }, [txn.data]);

  const invalidateAll = () => {
    utils.transactions.invalidate();
    utils.overview.get.invalidate();
    utils.cards.invalidate();
  };

  const update = trpc.transactions.update.useMutation({
    onSuccess: () => {
      invalidateAll();
      router.back();
    },
    onError: (err) => Alert.alert("Erro", err.message),
  });
  const remove = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      invalidateAll();
      router.back();
    },
    onError: (err) => Alert.alert("Erro", err.message),
  });

  const sources = useMemo(
    () => [
      ...(accounts.data ?? []).map((a) => ({ key: `account:${a.id}`, name: a.name, kind: "account" as const })),
      ...(cards.data ?? []).map((c) => ({ key: `card:${c.id}`, name: c.name, kind: "card" as const })),
    ],
    [accounts.data, cards.data],
  );

  if (txn.isLoading || !txn.data) {
    return (
      <View style={[s.screen, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  function handleSave() {
    if (!sourceKey) return;
    const [kind, sourceId] = sourceKey.split(":") as ["account" | "card", string];
    let amountCents: number;
    try {
      amountCents = parseAmountToCents(amount);
    } catch {
      Alert.alert("Valor inválido", "Informe um valor como 25,90.");
      return;
    }
    update.mutate({
      id,
      description: description.trim(),
      amountCents,
      type,
      date: txn.data!.date,
      source: { kind, id: sourceId },
      categoryId,
      pending,
      dueDate: txn.data!.dueDate,
    });
  }

  function handleDelete() {
    Alert.alert("Excluir lançamento", `Excluir "${txn.data!.description}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => remove.mutate({ id }) },
    ]);
  }

  const relevantCategories = (categories.data ?? []).filter((c) => c.type === type);
  const isInstallment = !!txn.data.installmentPurchaseId;

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {isInstallment && (
          <View style={[s.card, { backgroundColor: colors.warnBg }]}>
            <Text style={{ color: colors.warn, fontSize: 12 }}>
              Parcela {txn.data.installmentNumber} de uma compra parcelada — a edição afeta só esta
              parcela.
            </Text>
          </View>
        )}

        <View>
          <Text style={s.label}>Descrição</Text>
          <TextInput style={s.input} value={description} onChangeText={setDescription} />
        </View>

        <View>
          <Text style={s.label}>Valor (R$)</Text>
          <TextInput style={s.input} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {(
            [
              { key: "expense", label: "Despesa" },
              { key: "income", label: "Receita" },
            ] as const
          ).map((t) => {
            const active = type === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[s.chip, { flex: 1, alignItems: "center" }, active && s.chipActive]}
                onPress={() => setType(t.key)}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View>
          <Text style={s.label}>Conta / cartão</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {sources.map((src) => {
              const active = sourceKey === src.key;
              return (
                <TouchableOpacity
                  key={src.key}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setSourceKey(src.key)}
                >
                  <Ionicons
                    name={src.kind === "card" ? "card-outline" : "wallet-outline"}
                    size={14}
                    color={active ? "#fff" : colors.muted}
                  />
                  <Text style={[s.chipText, active && s.chipTextActive]}>{src.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={s.label}>Categoria</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {relevantCategories.map((cat) => {
              const active = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setCategoryId(active ? null : cat.id)}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {sourceKey?.startsWith("account:") && (
          <TouchableOpacity
            style={[s.chip, pending && s.chipActive, { alignSelf: "flex-start" }]}
            onPress={() => setPending((p) => !p)}
          >
            <Text style={[s.chipText, pending && s.chipTextActive]}>
              {pending ? "Pendente (conta a pagar)" : "Pago — tocar para marcar pendente"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={s.button} onPress={handleSave} disabled={update.isPending}>
          <Text style={s.buttonText}>{update.isPending ? "Salvando..." : "Salvar"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDelete} style={{ alignItems: "center", padding: 8 }}>
          <Text style={{ color: colors.danger, fontWeight: "600", fontSize: 14 }}>
            Excluir lançamento
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
