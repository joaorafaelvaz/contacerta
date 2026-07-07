import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { Empty, Loading } from "../../components/ui";
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
          cards.isLoading ? (
            <Loading />
          ) : (
            <Empty icon="card-outline" message="Nenhum cartão. Cadastre pelo dashboard web." />
          )
        }
        renderItem={({ item: card }) => (
          <TouchableOpacity
            style={[s.card, { marginBottom: 8 }]}
            onPress={() => router.push(`/cartao/${card.id}`)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[s.iconCircle, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="card" size={17} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                  {card.name}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>
                  Fecha dia {card.closingDay} · vence dia {card.dueDay}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedSoft} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
