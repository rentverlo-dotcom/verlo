import React, { useState } from "react";
import { Stack } from "expo-router";
import WelcomeScreen from "../components/WelcomeScreen";
import SwipeScreen from "../components/SwipeScreen";

export default function Index() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <>
      {/* 🔥 ELIMINA EL HEADER "index" */}
      <Stack.Screen options={{ headerShown: false }} />

      {showWelcome ? (
        <WelcomeScreen onFinish={() => setShowWelcome(false)} />
      ) : (
        <SwipeScreen />
      )}
    </>
  );
}