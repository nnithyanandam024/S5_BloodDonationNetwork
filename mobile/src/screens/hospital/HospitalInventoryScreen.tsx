import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button, Icon } from '../../components';
import { BloodGroup } from '../../types';
import { useAuth } from '../../store/AuthContext';

interface InventoryEntry {
  group: BloodGroup;
  units: number;
  status: 'OPTIMAL' | 'LOW' | 'CRITICAL';
}

const SAMPLE_INVENTORY: InventoryEntry[] = [
  { group: 'O+', units: 12, status: 'OPTIMAL' },
  { group: 'O-', units: 2, status: 'CRITICAL' },
  { group: 'A+', units: 15, status: 'OPTIMAL' },
  { group: 'A-', units: 3, status: 'LOW' },
  { group: 'B+', units: 8, status: 'OPTIMAL' },
  { group: 'B-', units: 1, status: 'CRITICAL' },
  { group: 'AB+', units: 5, status: 'OPTIMAL' },
  { group: 'AB-', units: 1, status: 'CRITICAL' },
];

export const HospitalInventoryScreen = ({ navigation }: any) => {
  const { switchUserRole } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenCenterTitle}>Blood Bank Reserves</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconCircleBtn}
          onPress={() => navigation.navigate('CreateRequest')}
        >
          <Icon name="plus" size={18} color="#7047EB" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={SAMPLE_INVENTORY}
        keyExtractor={(item) => item.group}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIconSquircle}>
                <Icon name="flask" size={22} color="#7047EB" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.summaryTitle}>Total Reserves: 47 Units</Text>
                <Text style={styles.summarySub}>8 Blood groups monitored 24/7</Text>
              </View>
            </View>
            <View style={styles.livePulseBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>LIVE</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isCritical = item.status === 'CRITICAL';
          const isLow = item.status === 'LOW';

          return (
            <Card variant="outlined" style={styles.gridCard}>
              <View
                style={[
                  styles.groupBadgeSquircle,
                  isCritical
                    ? styles.badgeCritical
                    : isLow
                    ? styles.badgeLow
                    : styles.badgeOptimal,
                ]}
              >
                <Text
                  style={[
                    styles.groupText,
                    isCritical
                      ? { color: '#DC2626' }
                      : isLow
                      ? { color: '#D97706' }
                      : { color: '#7047EB' },
                  ]}
                >
                  {item.group}
                </Text>
              </View>

              <Text style={styles.unitsNum}>{item.units}</Text>
              <Text style={styles.unitsLabel}>Units in Stock</Text>

              <View
                style={[
                  styles.statusTag,
                  isCritical
                    ? styles.statusTagCritical
                    : isLow
                    ? styles.statusTagLow
                    : styles.statusTagOptimal,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    isCritical
                      ? styles.statusTagTextCritical
                      : isLow
                      ? styles.statusTagTextLow
                      : styles.statusTagTextOptimal,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              title="+ Request Blood Bank Restock"
              onPress={() => navigation.navigate('CreateRequest')}
              style={styles.transferBtn}
            />

            <Card variant="flat" style={styles.demoCard}>
              <Text style={styles.demoTitle}>Presentation Quick-Switch</Text>
              <Text style={styles.demoDesc}>
                Switch role to Donor dashboard without logging out:
              </Text>
              <Button
                title="Switch to Donor View"
                onPress={() => switchUserRole('DONOR')}
                variant="outline"
                size="sm"
                style={{ marginTop: 8 }}
              />
            </Card>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenCenterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3EFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  summarySub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  pulseText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  gridCard: {
    flex: 1,
    margin: 6,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  groupBadgeSquircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeOptimal: {
    backgroundColor: '#EDE9FE',
  },
  badgeLow: {
    backgroundColor: '#FEF3C7',
  },
  badgeCritical: {
    backgroundColor: '#FEE2E2',
  },
  groupText: {
    fontSize: 18,
    fontWeight: '800',
  },
  unitsNum: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  unitsLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusTagOptimal: {
    backgroundColor: '#DCFCE7',
  },
  statusTagLow: {
    backgroundColor: '#FEF3C7',
  },
  statusTagCritical: {
    backgroundColor: '#FEE2E2',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTagTextOptimal: {
    color: '#15803D',
  },
  statusTagTextLow: {
    color: '#B45309',
  },
  statusTagTextCritical: {
    color: '#B91C1C',
  },
  footer: {
    marginTop: 16,
  },
  transferBtn: {
    marginBottom: 16,
  },
  demoCard: {
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: '#F3EFFF',
    padding: 16,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7047EB',
  },
  demoDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
