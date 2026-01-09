
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (user.role === 'client') {
    return <Redirect href="/(client)/(tabs)/dashboard" />;
  }

  if (user.role === 'provider') {
    return <Redirect href="/(provider)/(tabs)/dashboard" />;
  }

  if (user.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/auth/login" />;
}
