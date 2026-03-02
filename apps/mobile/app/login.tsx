import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      // Deep link de vuelta a la app: verlo://auth/callback
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: "verlo",
        path: "auth/callback",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No se generó la URL de OAuth");

      const result = await AuthSession.startAsync({
        authUrl: data.url,
        returnUrl: redirectTo,
      });

      if (result.type !== "success") {
        setLoading(false);
        return;
      }

      const params = (result as any).params ?? {};
      const code = params.code;

      if (!code) throw new Error("No llegó 'code' desde Google");

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        code
      );
      if (exchangeError) throw exchangeError;

      // Volver a donde estaba (por ejemplo: / )
      router.replace(typeof next === "string" ? next : "/");
    } catch (e: any) {
      Alert.alert("Login", e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Entrá para continuar</Text>
        <Text style={styles.desc}>
          Solo te pedimos login cuando querés dar like o completar tu perfil.
        </Text>

        <TouchableOpacity
          onPress={signInWithGoogle}
          disabled={loading}
          style={[styles.googleBtn, loading && { opacity: 0.6 }]}
          activeOpacity={0.9}
        >
          <Text style={styles.googleText}>
            {loading ? "Conectando..." : "Continuar con Google"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 18 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  desc: { marginTop: 8, color: "#64748b", lineHeight: 20 },
  googleBtn: {
    marginTop: 16,
    backgroundColor: "#ec4899",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  googleText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backBtn: { marginTop: 12, alignItems: "center", paddingVertical: 10 },
  backText: { color: "#64748b", fontWeight: "600" },
});