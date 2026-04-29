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

type RequestRow = {
  id: string;
  client_company_id: string;
  provider_id: string | null;
  address: string;
  date_time: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
};

type AdminRequest = {
  id: string;
  status: RequestRow['status'];
  address: string;
  dateTime: Date;
  clientCompanyName?: string;
  providerName?: string;
};

export default function AdminAllRequestsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<AdminRequest[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wash_requests')
        .select('id, client_company_id, provider_id, address, date_time, status, notes, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows: RequestRow[] = (data ?? []) as any;
      if (rows.length === 0) {
        setItems([]);
        return;
      }

      const clientCompanyIds = Array.from(new Set(rows.map(r => r.client_company_id).filter(Boolean)));
      const providerIds = Array.from(new Set(rows.map(r => r.provider_id).filter(Boolean))) as string[];

      const [clientsRes, providersRes] = await Promise.all([
        supabase.from('client_companies').select('id, name').in('id', clientCompanyIds),
        providerIds.length > 0
          ? supabase.from('providers').select('id, name').in('id', providerIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (providersRes.error) throw providersRes.error;

      const clientNameById = new Map<string, string>();
      (clientsRes.data ?? []).forEach((c: any) => clientNameById.set(c.id, c.name));

      const providerNameById = new Map<string, string>();
      (providersRes.data ?? []).forEach((p: any) => providerNameById.set(p.id, p.name));

      const mapped: AdminRequest[] = rows.map((r) => ({
        id: r.id,
        status: r.status,
        address: r.address,
        dateTime: new Date(r.date_time),
        clientCompanyName: clientNameById.get(r.client_company_id),
        providerName: r.provider_id ? providerNameById.get(r.provider_id) : undefined,
      }));

      setItems(mapped);
    } catch (e: any) {
      console.error('Erreur chargement demandes admin:', e);
      Alert.alert('Erreur', e.message || 'Impossible de charger les demandes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const count = useMemo(() => items.length, [items.length]);

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
        <Text style={[styles.title, { color: theme.colors.text }]}>Demandes</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {count} au total
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <IconSymbol
                ios_icon_name="tray"
                android_material_icon_name="inventory-2"
                size={36}
                color={theme.colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Aucune demande</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                Il n&apos;y a pas encore de demandes de prestation.
              </Text>
            </View>
          ) : (
            items.map((r) => (
              <View
                key={r.id}
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={[styles.address, { color: theme.colors.text }]} numberOfLines={2}>
                      {r.address}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                      {formatDateTime(r.dateTime)} • {labelStatus(r.status)}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                      Client : {r.clientCompanyName || '—'} {r.providerName ? `• Prestataire : ${r.providerName}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(r.status, theme) }]} />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function labelStatus(status: AdminRequest['status']): string {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'accepted':
      return 'Acceptée';
    case 'in_progress':
      return 'En cours';
    case 'completed':
      return 'Terminée';
    case 'cancelled':
      return 'Annulée';
    default:
      return status;
  }
}

function statusColor(status: AdminRequest['status'], theme: any): string {
  switch (status) {
    case 'pending':
      return theme.colors.warning || '#F59E0B';
    case 'accepted':
      return theme.colors.accent || '#2D8FD6';
    case 'in_progress':
      return theme.colors.info || '#1A6DA8';
    case 'completed':
      return theme.colors.success || '#22C55E';
    case 'cancelled':
      return theme.colors.error || '#EF4444';
    default:
      return theme.colors.textMuted || '#64748B';
  }
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
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardLeft: { flex: 1 },
  address: { fontSize: 15, fontWeight: '800' },
  meta: { marginTop: 6, fontSize: 12, lineHeight: 16 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '800' },
  emptySubtitle: { marginTop: 6, fontSize: 13, textAlign: 'center' },
});

