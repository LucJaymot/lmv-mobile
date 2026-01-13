import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { washRequestService } from '@/services/databaseService';
import { WashRequest } from '@/types';

interface GroupedInvoices {
  [key: string]: WashRequest[];
}

export default function InvoicesScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
  const [invoices, setInvoices] = useState<WashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      if (!clientCompany) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await washRequestService.getInvoicesByClientCompanyId(clientCompany.id);
        setInvoices(data);
      } catch (error: any) {
        console.error('Erreur lors du chargement des factures:', error);
        Alert.alert('Erreur', error.message || 'Impossible de charger les factures');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [clientCompany]);

  // Grouper les factures par date
  const groupedInvoices = useMemo<GroupedInvoices>(() => {
    const grouped: GroupedInvoices = {};
    
    invoices.forEach((invoice) => {
      const dateKey = formatDateKey(invoice.dateTime);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(invoice);
    });

    // Trier les dates (les plus récentes en premier)
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    const sortedGrouped: GroupedInvoices = {};
    sortedDates.forEach((date) => {
      sortedGrouped[date] = grouped[date];
    });

    return sortedGrouped;
  }, [invoices]);

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const formatDateLabel = (dateKey: string): string => {
    const date = new Date(dateKey);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleViewInvoice = (invoiceUrl: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.open) {
        window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      Linking.openURL(invoiceUrl);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des factures...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (invoices.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Factures</Text>
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="doc.text.fill"
            android_material_icon_name="description"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>Aucune facture disponible</Text>
          <Text style={styles.emptySubtext}>
            Les factures des demandes terminées apparaîtront ici
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Factures</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedInvoices).map(([dateKey, dateInvoices]) => (
          <View key={dateKey} style={styles.dateSection}>
            <View style={styles.dateHeader}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.dateLabel}>{formatDateLabel(dateKey)}</Text>
            </View>
            {dateInvoices.map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                style={styles.invoiceCard}
                onPress={() => invoice.invoiceUrl && handleViewInvoice(invoice.invoiceUrl)}
                disabled={!invoice.invoiceUrl}
              >
                <View style={styles.invoiceContent}>
                  <View style={styles.invoiceInfo}>
                    <View style={styles.invoiceHeader}>
                      <IconSymbol
                        ios_icon_name="doc.fill"
                        android_material_icon_name="description"
                        size={24}
                        color={colors.primary}
                      />
                      <View style={styles.invoiceDetails}>
                        <Text style={styles.invoiceTime}>{formatTime(invoice.dateTime)}</Text>
                        <Text style={styles.invoiceAddress} numberOfLines={1}>
                          {invoice.address}
                        </Text>
                        {invoice.provider && (
                          <Text style={styles.invoiceProvider}>{invoice.provider.name}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  {invoice.invoiceUrl && (
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  invoiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  invoiceDetails: {
    flex: 1,
  },
  invoiceTime: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  invoiceAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  invoiceProvider: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});

