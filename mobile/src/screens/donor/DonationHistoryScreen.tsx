import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Header } from '../../components';
import { useAuth } from '../../store/AuthContext';

interface HistoryItem {
  id: string;
  date: string;
  type: string;
  facility: string;
  units: number;
  status: 'COMPLETED';
}

export const DonationHistoryScreen = () => {
  const { user } = useAuth();

  const historyData: HistoryItem[] = [
    {
      id: 'don-1',
      date: '12 Nov 2025',
      type: 'Whole Blood',
      facility: 'City Care Super Specialty Hospital',
      units: 1,
      status: 'COMPLETED',
    },
    {
      id: 'don-2',
      date: '10 Aug 2025',
      type: 'Whole Blood',
      facility: 'Red Cross Central Blood Bank',
      units: 1,
      status: 'COMPLETED',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Donation History" subtitle={`${user?.donationCount || historyData.length} Lifetime Donations`} />
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.facility}>{item.facility}</Text>
                <Text style={styles.date}>{item.date} • {item.type}</Text>
              </View>
              <StatusBadge value={item.status} label="Completed" />
            </View>
            <View style={styles.divider} />
            <Text style={styles.unitsText}>Donated: {item.units} Unit (450 ml)</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  facility: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  date: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  unitsText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
