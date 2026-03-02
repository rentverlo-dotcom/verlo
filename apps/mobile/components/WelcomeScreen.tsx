import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { height } = Dimensions.get("window");

export default function WelcomeScreen({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={["#ffffff", "#f8fafc"]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          { opacity, transform: [{ scale }] },
        ]}
      >
        <Text style={styles.logo}>Verlo</Text>

        <View style={styles.features}>
          <Text style={styles.feature}>✔ Identidad verificada</Text>
          <Text style={styles.feature}>✔ Contrato legal</Text>
          <Text style={styles.feature}>✔ Chat seguro</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  logo: {
    fontSize: 52,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -1,
  },
  features: {
    marginTop: 30,
    gap: 8,
  },
  feature: {
    fontSize: 14,
    color: "#64748b",
  },
});