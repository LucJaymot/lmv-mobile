
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function ClientTabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'dashboard',
      route: '/(client)/(tabs)/dashboard',
      icon: 'home',
      label: 'Accueil',
    },
    {
      name: 'vehicles',
      route: '/(client)/(tabs)/vehicles',
      icon: 'directions_car' as any, // Mappé dans FloatingTabBar
      label: 'Véhicules',
    },
    {
      name: 'requests',
      route: '/(client)/(tabs)/requests',
      icon: 'list',
      label: 'Demandes',
    },
    {
      name: 'profile',
      route: '/(client)/(tabs)/profile',
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
        <Stack.Screen name="vehicles" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </React.Fragment>
  );
}
