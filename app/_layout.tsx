
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
  Theme as NavigationTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContextSupabase";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { useTheme } from "@/theme/hooks";
import { preloadAllImages } from "@/utils/imagePreloader";
import { brandLogos } from "@/utils/brandLogoMapper";

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
      // Précharger les images en arrière-plan
      preloadAllImages(brandLogos).catch(() => {});
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

  return (
    <>
      <StatusBar style="light" animated />
      <ThemeProvider initialMode="light">
        <NavigationThemeWrapper>
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
        </NavigationThemeWrapper>
      </ThemeProvider>
    </>
  );
}

/**
 * Wrapper pour synchroniser React Navigation Theme avec notre ThemeProvider
 */
function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  // Adapter le thème React Navigation avec nos couleurs
  const navigationTheme: NavigationTheme = {
    ...DefaultTheme,
    dark: theme.mode === 'dark' || theme.mode === 'trueBlack',
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
    </NavigationThemeProvider>
  );
}
