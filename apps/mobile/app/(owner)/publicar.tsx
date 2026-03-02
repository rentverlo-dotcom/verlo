import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Publicar() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace({
          pathname: "/(auth)/login",
          params: { redirect: "/(owner)/publicar" },
        });
        return;
      }
      setLoading(false);
    };
    run();
  }, []);

  if (loading) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publicar propiedad</Text>
      <Text style={styles.sub}>Acá va el mismo form que tenés en web (lo copiamos pantalla por pantalla).</Text>

      <TouchableOpacity style={styles.btn} onPress={() => router.replace("/")}>
        <Text style={styles.btnText}>Volver al swipe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#ffffff" },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  sub: { marginTop: 10, color: "#64748b", lineHeight: 20 },
  btn: { marginTop: 20, backgroundColor: "#0f172a", padding: 12, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
});