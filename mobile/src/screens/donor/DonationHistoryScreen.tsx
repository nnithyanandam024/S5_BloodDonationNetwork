import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { StatusBadge, Icon } from '../../components';
import { useAuth } from '../../store/AuthContext';

interface HistoryItem {
  id: string;
  date: string;
  type: string;
  facility: string;
  units: number;
  status: 'COMPLETED';
}

export const DonationHistoryScreen = ({ navigation }: any) => {
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

  const renderHeader = () => (
    <View style={styles.topSection}>
      {/* Top Header matching Reference style */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconCircleBtn}
          onPress={() => navigation?.navigate?.('Home')}
        >
          <Icon name="arrow-left" size={18} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.screenCenterTitle}>Benefits & History</Text>
        <TouchableOpacity activeOpacity={0.8} style={styles.iconCircleBtn}>
          <Icon name="bell" size={20} color="#1F2937" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Hero Impact Stats Row */}
      <View style={styles.statsCardRow}>
        <View style={styles.statBox}>
          <View style={[styles.statIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Icon name="droplet" size={18} color="#DC2626" strokeWidth={2.2} />
          </View>
          <Text style={styles.statNumber}>{user?.donationCount || historyData.length}</Text>
          <Text style={styles.statCaption}>Donations</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="sparkles" size={18} color="#D97706" strokeWidth={2.2} />
          </View>
          <Text style={styles.statNumber}>{(user?.donationCount || historyData.length) * 3}</Text>
          <Text style={styles.statCaption}>Lives Saved</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.statIconCircle, { backgroundColor: '#EDE9FE' }]}>
            <Icon name="star" size={18} color="#7047EB" strokeWidth={2.2} />
          </View>
          <Text style={styles.statNumber}>450</Text>
          <Text style={styles.statCaption}>Points</Text>
        </View>
      </View>

      <Text style={styles.listSectionTitle}>Verified Records</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.facilityInfo}>
                <Text style={styles.facilityName}>{item.facility}</Text>
                <View style={styles.dateRow}>
                  <Icon name="calendar" size={12} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.dateText}>{item.date} • {item.type}</Text>
                </View>
              </View>
              <StatusBadge value={item.status} label="Completed" />
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.detailsRow}>
              <View style={styles.detailPill}>
                <Icon name="droplet" size={13} color="#7047EB" strokeWidth={2} />
                <Text style={styles.detailPillText}>Donated: {item.units} Unit (450 ml)</Text>
              </View>
              <View style={styles.verifiedChip}>
                <Icon name="check" size={12} color="#059669" strokeWidth={2.5} />
                <Text style={styles.verifiedChipText}>Verified</Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  topSection: {
    marginBottom: 8,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenCenterTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  statsCardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statCaption: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  listSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  facilityInfo: {
    flex: 1,
    marginRight: 10,
  },
  facilityName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3EFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  detailPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7047EB',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});
