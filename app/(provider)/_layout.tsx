
import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Stack } from 'expo-router';

export default function ProviderLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== 'provider') {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="requests/detail" options={{ headerShown: true, title: 'Détail de la demande' }} />
    </Stack>
  );
}
