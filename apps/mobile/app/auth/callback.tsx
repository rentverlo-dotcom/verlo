import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function AuthCallback() {
  useEffect(() => {
    // El intercambio de sesión lo hacemos en /login,
    // esto es solo un fallback visual por si cae acá.
    const t = setTimeout(() => router.replace("/"), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});