import { useRouter } from "expo-router";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { trpc } from "../../lib/trpc";
import { colors, s } from "../../lib/ui";

export default function CardsScreen() {
  const router = useRouter();
  const cards = trpc.cards.list.useQuery();

  return (
    <View style={s.screen}>
      <FlatList
        data={cards.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={s.container}
        refreshControl={
          <RefreshControl refreshing={cards.isRefetching} onRefresh={() => cards.refetch()} />
        }
        ListEmptyComponent={
          <Text style={s.emptyText}>
            {cards.isLoading ? "Carregando..." : "Nenhum cartão. Cadastre pelo dashboard web."}
          </Text>
        }
        renderItem={({ item: card }) => (
          <TouchableOpacity
            style={[s.card, { marginBottom: 8 }]}
            onPress={() => router.push(`/cartao/${card.id}`)}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
              💳 {card.name}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
              Fecha dia {card.closingDay} · vence dia {card.dueDay}
            </Text>
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13, marginTop: 8 }}>
              Ver fatura →
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
