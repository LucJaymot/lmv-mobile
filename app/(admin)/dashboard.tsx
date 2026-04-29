
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stats, setStats] = React.useState({
    clients: 0,
    providers: 0,
    requests: 0,
    completed: 0,
  });
  const [statsLoading, setStatsLoading] = React.useState(true);

  const loadStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const [clientsRes, providersRes, requestsRes, completedRes] = await Promise.all([
        supabase.from('client_companies').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('wash_requests').select('id', { count: 'exact', head: true }),
        supabase
          .from('wash_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (providersRes.error) throw providersRes.error;
      if (requestsRes.error) throw requestsRes.error;
      if (completedRes.error) throw completedRes.error;

      setStats({
        clients: clientsRes.count ?? 0,
        providers: providersRes.count ?? 0,
        requests: requestsRes.count ?? 0,
        completed: completedRes.count ?? 0,
      });
    } catch (e: any) {
      console.error('Erreur chargement stats admin:', e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLogout = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      if (!confirmed) return;
      logout().then(() => console.log('Logged out'));
      return;
    }

    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          console.log('Logged out');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Administration</Text>
          <Text style={styles.subtitle}>Tableau de bord</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="building.2.fill"
              android_material_icon_name="business"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.statValue}>{statsLoading ? '—' : String(stats.clients)}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="local-car-wash"
              size={32}
              color={colors.accent}
            />
            <Text style={styles.statValue}>{statsLoading ? '—' : String(stats.providers)}</Text>
            <Text style={styles.statLabel}>Prestataires</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={32}
              color={colors.info}
            />
            <Text style={styles.statValue}>{statsLoading ? '—' : String(stats.requests)}</Text>
            <Text style={styles.statLabel}>Demandes</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={32}
              color={colors.accent}
            />
            <Text style={styles.statValue}>{statsLoading ? '—' : String(stats.completed)}</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(admin)/approvals')}>
            <IconSymbol
              ios_icon_name="person.badge.plus"
              android_material_icon_name="person-add"
              size={20}
              color={colors.text}
            />
            <Text style={styles.actionText}>Demandes d'inscription</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(admin)/users')}>
            <IconSymbol
              ios_icon_name="person.2.fill"
              android_material_icon_name="people"
              size={20}
              color={colors.text}
            />
            <Text style={styles.actionText}>Gérer les utilisateurs</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(admin)/all-requests')}>
            <IconSymbol
              ios_icon_name="list.bullet"
              android_material_icon_name="list"
              size={20}
              color={colors.text}
            />
            <Text style={styles.actionText}>Voir toutes les demandes</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionItem, styles.actionItemDisabled]} disabled>
            <IconSymbol
              ios_icon_name="chart.bar.fill"
              android_material_icon_name="bar-chart"
              size={20}
              color={colors.text}
            />
            <Text style={styles.actionText}>Statistiques</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[buttonStyles.outline, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={commonStyles.buttonTextOutline}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  actionItemDisabled: {
    opacity: 0.45,
    filter: 'grayscale(1)',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 16,
  },
});
