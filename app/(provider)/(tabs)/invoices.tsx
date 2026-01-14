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
import { commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { washRequestService } from '@/services/databaseService';
import { WashRequest } from '@/types';
import { useTheme } from '@/theme/hooks';
import { pickInvoice, uploadInvoice, deleteAllInvoicesForRequest } from '@/services/storageService';
import { Button } from '@/components/ui/Button';

interface GroupedInvoices {
  [key: string]: WashRequest[];
}

export default function ProviderInvoicesScreen() {
  const router = useRouter();
  const { provider } = useAuth();
  const { theme } = useTheme();
  const [invoices, setInvoices] = useState<WashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      if (!provider) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await washRequestService.getInvoicesByProviderId(provider.id);
        setInvoices(data);
      } catch (error: any) {
        console.error('Erreur lors du chargement des factures:', error);
        Alert.alert('Erreur', error.message || 'Impossible de charger les factures');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [provider]);

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

  const handleViewInvoice = (invoiceUrl: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.open) {
        window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      Linking.openURL(invoiceUrl);
    }
  };

  const handleReplaceInvoice = async (invoice: WashRequest) => {
    if (!invoice.id || !provider) {
      return;
    }

    setUploadingInvoiceId(invoice.id);
    try {
      // Sélectionner le fichier PDF
      const result = await pickInvoice();
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploadingInvoiceId(null);
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        setUploadingInvoiceId(null);
        return;
      }

      // Vérifier que c'est bien un PDF
      if (asset.mimeType !== 'application/pdf' && !asset.name?.endsWith('.pdf')) {
        Alert.alert('Erreur', 'Veuillez sélectionner un fichier PDF');
        setUploadingInvoiceId(null);
        return;
      }

      // Supprimer toutes les factures existantes pour cette demande avant d'uploader la nouvelle
      if (invoice.invoiceUrl) {
        try {
          await deleteAllInvoicesForRequest(invoice.id);
        } catch (error) {
          console.warn('⚠️ Erreur lors de la suppression des factures existantes (on continue quand même):', error);
          // On continue quand même l'upload même si la suppression échoue
        }
      }

      // Uploader le PDF
      const invoiceUrl = await uploadInvoice(asset.uri, invoice.id);
      
      // Mettre à jour la demande avec l'URL de la facture
      const updated = await washRequestService.update(invoice.id, { invoiceUrl });
      
      // Mettre à jour la liste des factures
      setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? updated : inv)));
      
      Alert.alert('Succès', 'Facture remplacée avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors du remplacement de la facture:', error);
      Alert.alert('Erreur', error.message || 'Impossible de remplacer la facture');
    } finally {
      setUploadingInvoiceId(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement des factures...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (invoices.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Factures</Text>
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="doc.text.fill"
            android_material_icon_name="description"
            size={64}
            color={theme.colors.textMuted}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>Aucune facture disponible</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textMuted }]}>
            Les factures des demandes terminées apparaîtront ici
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Factures</Text>
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
                color={theme.colors.accent}
              />
              <Text style={[styles.dateLabel, { color: theme.colors.text }]}>{formatDateLabel(dateKey)}</Text>
            </View>
            {dateInvoices.map((invoice) => (
              <View
                key={invoice.id}
                style={[styles.invoiceCard, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  ...theme.shadows.sm,
                }]}
              >
                <View style={styles.invoiceContent}>
                  <View style={styles.invoiceInfo}>
                    <View style={styles.invoiceHeader}>
                      <IconSymbol
                        ios_icon_name="doc.fill"
                        android_material_icon_name="description"
                        size={24}
                        color={theme.colors.accent}
                      />
                      <View style={styles.invoiceDetails}>
                        <Text style={[styles.invoiceTime, { color: theme.colors.text }]}>{formatTime(invoice.dateTime)}</Text>
                        <Text style={[styles.invoiceAddress, { color: theme.colors.textMuted }]} numberOfLines={1}>
                          {invoice.address}
                        </Text>
                        {invoice.clientCompany && (
                          <Text style={[styles.invoiceClient, { color: theme.colors.accent }]}>{invoice.clientCompany.name}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
                {invoice.invoiceUrl && (
                  <View style={[styles.invoiceActions, { borderTopColor: theme.colors.border }]}>
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() => invoice.invoiceUrl && handleViewInvoice(invoice.invoiceUrl)}
                      style={styles.viewInvoiceButton}
                    >
                      Voir la facture
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => handleReplaceInvoice(invoice)}
                      disabled={uploadingInvoiceId === invoice.id}
                      loading={uploadingInvoiceId === invoice.id}
                      style={styles.replaceInvoiceButton}
                      textStyle={{ color: theme.colors.accent }}
                    >
                      Remplacer
                    </Button>
                  </View>
                )}
              </View>
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
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
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
    textTransform: 'capitalize',
  },
  invoiceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  invoiceAddress: {
    fontSize: 14,
    marginBottom: 4,
  },
  invoiceClient: {
    fontSize: 13,
    fontWeight: '500',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  viewInvoiceButton: {
    flex: 1,
  },
  replaceInvoiceButton: {
    minWidth: 100,
  },
});

