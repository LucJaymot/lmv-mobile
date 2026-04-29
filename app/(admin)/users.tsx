import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/theme/hooks';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

type AdminUser = {
  id: string;
  email: string;
  role: 'client' | 'provider' | 'admin';
  createdAt: string;
  displayName?: string;
};

export default function AdminUsersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      const baseUsers: AdminUser[] = (usersData ?? []).map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
      }));

      const userIds = baseUsers.map(u => u.id);
      if (userIds.length === 0) {
        setUsers([]);
        return;
      }

      // Charger noms clients / prestataires en 2 requêtes (plus rapide que N requêtes)
      const [clientsRes, providersRes] = await Promise.all([
        supabase
          .from('client_companies')
          .select('user_id, name')
          .in('user_id', userIds),
        supabase
          .from('providers')
          .select('user_id, name')
          .in('user_id', userIds),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (providersRes.error) throw providersRes.error;

      const clientNameByUserId = new Map<string, string>();
      (clientsRes.data ?? []).forEach((c: any) => {
        if (c.user_id && c.name) clientNameByUserId.set(c.user_id, c.name);
      });

      const providerNameByUserId = new Map<string, string>();
      (providersRes.data ?? []).forEach((p: any) => {
        if (p.user_id && p.name) providerNameByUserId.set(p.user_id, p.name);
      });

      const enriched = baseUsers.map((u) => {
        const displayName =
          u.role === 'client'
            ? clientNameByUserId.get(u.id)
            : u.role === 'provider'
              ? providerNameByUserId.get(u.id)
              : 'Administrateur';
        return { ...u, displayName };
      });

      setUsers(enriched);
    } catch (e: any) {
      console.error('Erreur chargement utilisateurs:', e);
      Alert.alert('Erreur', e.message || 'Impossible de charger les utilisateurs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const count = useMemo(() => users.length, [users.length]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(admin)/dashboard');
          }}
          style={[styles.backButton, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border }]}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={18}
            color={theme.colors.text}
          />
          <Text style={[styles.backText, { color: theme.colors.text }]}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Utilisateurs</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{count} au total</Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {users.map((u) => (
            <View
              key={u.id}
              style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={styles.left}>
                <Text style={[styles.name, { color: theme.colors.text }]}>{u.displayName || u.email}</Text>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                  {u.email} • {labelRole(u.role)}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border }]}>
                <IconSymbol
                  ios_icon_name={u.role === 'admin' ? 'lock.fill' : u.role === 'provider' ? 'sparkles' : 'building.2.fill'}
                  android_material_icon_name={u.role === 'admin' ? 'lock' : u.role === 'provider' ? 'local-car-wash' : 'business'}
                  size={16}
                  color={theme.colors.textMuted}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function labelRole(role: AdminUser['role']): string {
  if (role === 'admin') return 'Admin';
  if (role === 'provider') return 'Prestataire';
  return 'Client';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 48 : 20, paddingBottom: 12 },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 10,
  },
  backText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 4, fontSize: 14 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 8, gap: 10 },
  row: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  left: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800' },
  meta: { marginTop: 4, fontSize: 12 },
  badge: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

