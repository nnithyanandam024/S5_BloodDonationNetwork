import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button, Icon } from '../../components';
import { BloodGroup, InventoryUnit } from '../../types';
import { useAuth } from '../../store/AuthContext';
import { requestsApi } from '../../services/api';

interface InventoryGroupSummary {
  group: BloodGroup;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  status: 'OPTIMAL' | 'LOW' | 'CRITICAL';
}

const DEFAULT_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const HospitalInventoryScreen = ({ navigation }: any) => {
  const { switchUserRole } = useAuth();
  const [inventoryList, setInventoryList] = useState<InventoryGroupSummary[]>([]);
  const [totalReserves, setTotalReserves] = useState(0);
  const [totalReserved, setTotalReserved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveInventory = useCallback(async () => {
    try {
      const res = await requestsApi.getAllInventory();
      const units: InventoryUnit[] = res.units || [];

      // Group units by blood group
      const summaries: InventoryGroupSummary[] = DEFAULT_GROUPS.map((grp) => {
        const groupUnits = units.filter((u) => u.bloodGroup === grp);
        const available = groupUnits.filter((u) => u.status === 'AVAILABLE').length;
        const reserved = groupUnits.filter((u) => u.status === 'RESERVED').length;
        const total = groupUnits.length;

        let status: 'OPTIMAL' | 'LOW' | 'CRITICAL' = 'OPTIMAL';
        if (available < 2) status = 'CRITICAL';
        else if (available < 5) status = 'LOW';

        return {
          group: grp,
          totalUnits: total,
          availableUnits: available,
          reservedUnits: reserved,
          status,
        };
      });

      setInventoryList(summaries);
      setTotalReserves(units.length);
      setTotalReserved(units.filter((u) => u.status === 'RESERVED').length);
    } catch (err) {
      console.error('Failed to fetch live inventory:', err);
      // Fallback
      setInventoryList([
        { group: 'O+', totalUnits: 8, availableUnits: 8, reservedUnits: 0, status: 'OPTIMAL' },
        { group: 'O-', totalUnits: 3, availableUnits: 3, reservedUnits: 0, status: 'LOW' },
        { group: 'A+', totalUnits: 6, availableUnits: 6, reservedUnits: 0, status: 'OPTIMAL' },
        { group: 'A-', totalUnits: 2, availableUnits: 2, reservedUnits: 0, status: 'CRITICAL' },
        { group: 'B+', totalUnits: 5, availableUnits: 5, reservedUnits: 0, status: 'OPTIMAL' },
        { group: 'B-', totalUnits: 2, availableUnits: 2, reservedUnits: 0, status: 'CRITICAL' },
        { group: 'AB+', totalUnits: 4, availableUnits: 4, reservedUnits: 0, status: 'LOW' },
        { group: 'AB-', totalUnits: 1, availableUnits: 1, reservedUnits: 0, status: 'CRITICAL' },
      ]);
      setTotalReserves(31);
      setTotalReserved(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveInventory();
    const timer = setInterval(fetchLiveInventory, 5000);
    return () => clearInterval(timer);
  }, [fetchLiveInventory]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenCenterTitle}>Authorized Blood Reserves</Text>
          <Text style={styles.screenSubtitle}>Regional Blood Bank Network</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconCircleBtn}
          onPress={() => navigation.navigate('CreateRequest')}
        >
          <Icon name="plus" size={18} color="#7047EB" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={inventoryList}
        keyExtractor={(item) => item.group}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLiveInventory();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIconSquircle}>
                <Icon name="flask" size={22} color="#7047EB" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.summaryTitle}>Total Stock: {totalReserves} Units</Text>
                <Text style={styles.summarySub}>
                  {totalReserved} reserved for emergencies • 8 groups
                </Text>
              </View>
            </View>
            <View style={styles.livePulseBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>LIVE SYNC</Text>
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

              <Text style={styles.unitsNum}>{item.availableUnits}</Text>
              <Text style={styles.unitsLabel}>Available Units</Text>

              {item.reservedUnits > 0 ? (
                <Text style={styles.reservedNote}>({item.reservedUnits} Reserved)</Text>
              ) : null}

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
              title="+ Create Emergency Requisition"
              onPress={() => navigation.navigate('CreateRequest')}
              style={styles.transferBtn}
            />

            <Card variant="flat" style={styles.demoCard}>
              <Text style={styles.demoTitle}>Presentation Role Switcher</Text>
              <Text style={styles.demoDesc}>
                Switch directly to Donor Dashboard to view incoming ephemeral request:
              </Text>
              <Button
                title="Switch to Donor Dashboard"
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
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7047EB',
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  summarySub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  pulseText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  gridCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F1F7',
  },
  groupBadgeSquircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeOptimal: {
    backgroundColor: '#F3E8FF',
  },
  badgeLow: {
    backgroundColor: '#FEF3C7',
  },
  badgeCritical: {
    backgroundColor: '#FEE2E2',
  },
  groupText: {
    fontSize: 18,
    fontWeight: '900',
  },
  unitsNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  unitsLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  reservedNote: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7047EB',
    marginTop: 2,
  },
  statusTag: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagOptimal: {
    backgroundColor: '#F3E8FF',
  },
  statusTagLow: {
    backgroundColor: '#FEF3C7',
  },
  statusTagCritical: {
    backgroundColor: '#FEE2E2',
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTagTextOptimal: {
    color: '#7047EB',
  },
  statusTagTextLow: {
    color: '#D97706',
  },
  statusTagTextCritical: {
    color: '#DC2626',
  },
  footer: {
    marginTop: 12,
  },
  transferBtn: {
    marginBottom: 16,
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  demoDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
});
