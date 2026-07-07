import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { authClient } from "../lib/auth-client";
import { useTheme } from "../lib/ui";


export default function LoginScreen() {
  const { colors, s } = useTheme();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isPending) {
    return (
      <View style={[s.screen, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (session) return <Redirect href="/(tabs)" />;

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha inválidos");
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      style={[s.screen, { justifyContent: "center", padding: 24 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[s.card, { gap: 12 }]}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.primaryDark, textAlign: "center" }}>
          MeuSaldo
        </Text>
        <Text style={{ color: colors.muted, textAlign: "center", marginBottom: 8 }}>
          Entre com a mesma conta do dashboard
        </Text>
        <View>
          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View>
          <Text style={s.label}>Senha</Text>
          <TextInput
            style={s.input}
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />
        </View>
        {error && <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}
        <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
          <Text style={s.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
          Crie sua conta e a família pelo dashboard web.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}


