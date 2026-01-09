
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContextSupabase";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "auth",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 Vous êtes hors ligne",
        "Vous pouvez continuer à utiliser l'application ! Vos modifications seront sauvegardées localement et synchronisées lorsque vous serez de nouveau en ligne."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "#007BFF",
      background: "#F5F5F5",
      card: "#FFFFFF",
      text: "#333333",
      border: "#E0E0E0",
      notification: "#DC3545",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "#007BFF",
      background: "#1A1A1A",
      card: "#2A2A2A",
      text: "#FFFFFF",
      border: "#3A3A3A",
      notification: "#DC3545",
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="auth" />
              <Stack.Screen name="(client)" />
              <Stack.Screen name="(provider)" />
              <Stack.Screen name="(admin)" />
            </Stack>
            <SystemBars style={"auto"} />
          </GestureHandlerRootView>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
