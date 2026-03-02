import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const signInWithGoogle = async () => {
    // Expo Go => proxy para deep link
    const redirectTo = AuthSession.makeRedirectUri({ useProxy: true });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.log("OAuth error:", error.message);
      return;
    }

    if (!data?.url) return;

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (res.type === "success" && res.url) {
      // Supabase detectSessionInUrl está false, así que intercambiamos código manualmente
      const parsed = new URL(res.url);
      const code = parsed.searchParams.get("code");

      if (code) {
        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchErr) {
          router.replace(typeof redirect === "string" ? redirect : "/");
        } else {
          console.log("exchangeCodeForSession error:", exchErr.message);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrá para continuar</Text>
      <Text style={styles.sub}>Google · 1 toque · sin salir de la app</Text>

      <TouchableOpacity style={styles.btn} onPress={signInWithGoogle}>
        <Text style={styles.btnText}>Continuar con Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.back}
        onPress={() => router.replace(typeof redirect === "string" ? redirect : "/")}
      >
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#ffffff" },
  title: { fontSize: 28, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  sub: { marginTop: 10, fontSize: 14, color: "#64748b", textAlign: "center" },
  btn: {
    marginTop: 22,
    backgroundColor: "#ec4899",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  back: { marginTop: 14, alignItems: "center" },
  backText: { color: "#64748b", fontWeight: "600" },
});