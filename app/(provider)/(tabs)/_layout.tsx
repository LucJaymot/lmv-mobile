
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function ProviderTabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'dashboard',
      route: '/(provider)/(tabs)/dashboard',
      icon: 'home',
      label: 'Accueil',
    },
    {
      name: 'requests',
      route: '/(provider)/(tabs)/requests',
      icon: 'list',
      label: 'Demandes',
    },
    {
      name: 'jobs',
      route: '/(provider)/(tabs)/jobs',
      icon: 'work',
      label: 'Mes jobs',
    },
    {
      name: 'profile',
      route: '/(provider)/(tabs)/profile',
      icon: 'person',
      label: 'Profil',
    },
  ];

  return (
    <React.Fragment>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="jobs" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="invoices" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </React.Fragment>
  );
}
