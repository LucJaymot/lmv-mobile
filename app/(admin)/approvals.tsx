import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/theme/hooks';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { sendAccountApprovedEmail } from '@/services/emailService';
import { useRouter } from 'expo-router';

type PendingApproval = {
  kind: 'client' | 'provider';
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function AdminApprovalsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<PendingApproval[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientsRes, providersRes] = await Promise.all([
        supabase
          .from('client_companies')
          .select('id, user_id, name, email, created_at')
          .is('approved_at', null)
          .is('rejected_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('providers')
          .select('id, user_id, name, phone, created_at')
          .is('approved_at', null)
          .is('rejected_at', null)
          .order('created_at', { ascending: false }),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (providersRes.error) throw providersRes.error;

      const clients: PendingApproval[] = (clientsRes.data ?? []).map((c: any) => ({
        kind: 'client',
        id: c.id,
        userId: c.user_id,
        name: c.name,
        email: c.email,
        createdAt: c.created_at,
      }));

      // Les providers n'ont pas d'email en table (souvent dans auth.users). On affiche un placeholder.
      const providers: PendingApproval[] = (providersRes.data ?? []).map((p: any) => ({
        kind: 'provider',
        id: p.id,
        userId: p.user_id,
        name: p.name,
        email: '—',
        createdAt: p.created_at,
      }));

      setItems([...clients, ...providers].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
    } catch (e: any) {
      console.error('Erreur chargement approvals:', e);
      Alert.alert('Erreur', e.message || 'Impossible de charger les demandes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = useMemo(() => items.length, [items.length]);

  const approve = async (item: PendingApproval) => {
    try {
      const table = item.kind === 'client' ? 'client_companies' : 'providers';
      const { error } = await supabase
        .from(table)
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          rejected_at: null,
          rejection_reason: null,
        })
        .eq('id', item.id);
      if (error) throw error;

      // Envoyer l'email uniquement au moment de l'approbation
      try {
        let targetEmail = item.email;
        if (item.kind === 'provider') {
          // Récupérer l'email prestataire via RPC (auth.users) si disponible
          const { data: emailsData, error: rpcError } = await supabase.rpc('get_provider_emails', {
            provider_user_ids: [item.userId],
          });
          if (!rpcError && emailsData && emailsData.length > 0 && emailsData[0]?.email) {
            targetEmail = emailsData[0].email;
          }
        }

        if (targetEmail && targetEmail !== '—') {
          await sendAccountApprovedEmail(targetEmail, item.name, item.kind);
        }
      } catch (emailError: any) {
        console.warn('⚠️ Email approbation non envoyé (non bloquant):', emailError?.message || emailError);
      }

      await load();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de valider');
    }
  };

  const reject = async (item: PendingApproval) => {
    const doReject = async (reason?: string) => {
      const table = item.kind === 'client' ? 'client_companies' : 'providers';
      const { error } = await supabase
        .from(table)
        .update({
          is_approved: false,
          approved_at: null,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason ?? null,
        })
        .eq('id', item.id);
      if (error) throw error;
      await load();
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const reason = window.prompt('Raison du refus (optionnel)') ?? undefined;
      try {
        await doReject(reason);
      } catch (e: any) {
        Alert.alert('Erreur', e.message || 'Impossible de refuser');
      }
      return;
    }

    Alert.alert(
      'Refuser la demande',
      'Confirmez-vous le refus ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await doReject();
            } catch (e: any) {
              Alert.alert('Erreur', e.message || 'Impossible de refuser');
            }
          },
        },
      ]
    );
  };

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
        <Text style={[styles.title, { color: theme.colors.text }]}>Demandes d'inscription</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {pendingCount} en attente
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
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={36}
                color={theme.colors.success || theme.colors.accent}
              />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Aucune demande</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                Toutes les inscriptions ont été traitées.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={`${item.kind}-${item.id}`} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.cardMeta, { color: theme.colors.textMuted }]}>
                      {item.kind === 'client' ? 'Client' : 'Prestataire'} • {item.email}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.textMuted }]}>En attente</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.elevated }]}
                    onPress={() => reject(item)}
                  >
                    <Text style={[styles.actionText, { color: theme.colors.error || '#E53935' }]}>Refuser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
                    onPress={() => approve(item)}
                  >
                    <Text style={[styles.actionTextPrimary]}>Valider</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
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
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { marginTop: 4, fontSize: 14 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 8, gap: 12 },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardMeta: { marginTop: 4, fontSize: 13 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  actionText: { fontSize: 14, fontWeight: '700' },
  actionTextPrimary: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '700' },
  emptySubtitle: { marginTop: 6, fontSize: 13, textAlign: 'center' },
});

