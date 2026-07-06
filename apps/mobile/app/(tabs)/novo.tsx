import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { formatBRL, parseAmountToCents } from "../../lib/format";
import { trpc } from "../../lib/trpc";
import { colors, s } from "../../lib/ui";

type Source = { kind: "account" | "card"; id: string; name: string };

export default function NewTransactionScreen() {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<Source | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [installments, setInstallments] = useState("1");

  const accounts = trpc.meta.accounts.useQuery();
  const cards = trpc.cards.list.useQuery();
  const categories = trpc.meta.categories.useQuery();
  const utils = trpc.useUtils();

  const create = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.overview.get.invalidate();
      utils.transactions.list.invalidate();
      setAmount("");
      setDescription("");
      setCategoryId(null);
      setInstallments("1");
      Alert.alert("✅ Lançado!", "Registro criado com sucesso.");
    },
    onError: (err) => Alert.alert("Erro", err.message),
  });

  const sources: Source[] = useMemo(
    () => [
      ...(accounts.data ?? []).map((a) => ({ kind: "account" as const, id: a.id, name: a.name })),
      ...(cards.data ?? []).map((c) => ({ kind: "card" as const, id: c.id, name: `💳 ${c.name}` })),
    ],
    [accounts.data, cards.data],
  );

  const relevantCategories = (categories.data ?? []).filter((c) => c.type === type);
  const isCard = source?.kind === "card";
  const nInstallments = Math.max(1, parseInt(installments, 10) || 1);

  const previewCents = useMemo(() => {
    try {
      return parseAmountToCents(amount);
    } catch {
      return null;
    }
  }, [amount]);

  function handleSubmit() {
    if (!source) {
      Alert.alert("Falta a origem", "Escolha a conta ou o cartão.");
      return;
    }
    let amountCents: number;
    try {
      amountCents = parseAmountToCents(amount);
    } catch {
      Alert.alert("Valor inválido", "Informe um valor como 25,90.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Falta a descrição", "Dê um nome ao lançamento.");
      return;
    }
    create.mutate({
      description: description.trim(),
      amountCents,
      type,
      source: { kind: source.kind, id: source.id },
      categoryId,
      pending: false,
      installments: isCard && type === "expense" ? nInstallments : 1,
    });
  }

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
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
                onPress={() => {
                  setType(t.key);
                  setCategoryId(null);
                }}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View>
          <Text style={s.label}>Valor (R$)</Text>
          <TextInput
            style={[s.input, { fontSize: 22, fontWeight: "700" }]}
            keyboardType="decimal-pad"
            placeholder="0,00"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View>
          <Text style={s.label}>Descrição</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Mercado, Uber"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View>
          <Text style={s.label}>Conta / cartão</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {sources.map((src) => {
              const active = source?.id === src.id;
              return (
                <TouchableOpacity
                  key={src.id}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setSource(src)}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{src.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={s.label}>Categoria (opcional)</Text>
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

        {isCard && type === "expense" && (
          <View>
            <Text style={s.label}>Parcelas (1 = à vista)</Text>
            <TextInput
              style={s.input}
              keyboardType="number-pad"
              value={installments}
              onChangeText={setInstallments}
            />
            {previewCents !== null && nInstallments > 1 && (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                {nInstallments}x de ~{formatBRL(Math.ceil(previewCents / nInstallments))}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity style={s.button} onPress={handleSubmit} disabled={create.isPending}>
          <Text style={s.buttonText}>{create.isPending ? "Lançando..." : "Lançar"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
