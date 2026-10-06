import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, EmptyState, LoadingState, Icon } from '../../components';
import { requestsApi } from '../../services/api';
import { BloodRequest } from '../../types';
import { useAuth } from '../../store/AuthContext';

export const HospitalRequestsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'CRITICAL' | 'PENDING' | 'ACCEPTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await requestsApi.getHospitalRequests();
      setRequests(res.requests || []);
    } catch (err: any) {
      console.error('Failed to load hospital requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 4000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const filteredRequests = requests.filter((r) => {
    // Filter tab
    if (filterTab === 'CRITICAL' && r.urgency !== 'CRITICAL') return false;
    if (filterTab === 'PENDING' && !['NOTIFIED', 'MATCHING'].includes(r.status)) return false;
    if (filterTab === 'ACCEPTED' && r.status !== 'ACCEPTED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchGroup = r.bloodGroup.toLowerCase().includes(q);
      const matchComp = r.component.toLowerCase().includes(q);
      const matchDonor = r.acceptedDonorName?.toLowerCase().includes(q);
      const matchId = r.id.toLowerCase().includes(q);
      return matchGroup || matchComp || matchDonor || matchId;
    }
    return true;
  });

  const renderRequestItem = ({ item }: { item: BloodRequest }) => {
    const isAccepted = item.status === 'ACCEPTED';
    const isCritical = item.urgency === 'CRITICAL';

    return (
      <Card
        variant="outlined"
        style={[styles.requestCard, isAccepted ? styles.cardAccepted : undefined]}
        onPress={() => navigation.navigate('RequestDetails', { requestId: item.id })}
      >
        <View style={styles.cardTop}>
          <View style={[styles.bloodTagSquircle, isCritical ? styles.bloodTagCritical : styles.bloodTagNormal]}>
            <Text style={styles.bloodTagText}>{item.bloodGroup}</Text>
          </View>
          <View style={styles.reqInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.reqId}>{item.id}</Text>
              {isCritical && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>CRITICAL</Text>
                </View>
              )}
            </View>
            <Text style={styles.reqUnits}>
              {item.unitsRequired} Units • {item.component.replace('_', ' ')}
            </Text>
          </View>
          <StatusBadge value={item.status} />
        </View>

        {isAccepted && item.acceptedDonorName ? (
          <View style={styles.acceptedBanner}>
            <View style={styles.acceptedIconBox}>
              <Icon name="check" size={16} color="#16A34A" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.acceptedTitle}>Donor Confirmed!</Text>
              <Text style={styles.acceptedDonor}>{item.acceptedDonorName} is en route to center</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#16A34A" strokeWidth={2} />
          </View>
        ) : (
          <View style={styles.matchingInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.radarPulseDot} />
              <Text style={styles.candidateCount}>
                {item.matchedCandidates?.length || 0} Nearby Donors Contacted
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenCenterTitle}>Emergency Broadcasts</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconCircleBtn}
          onPress={() => navigation.navigate('CreateRequest')}
        >
          <Icon name="plus" size={18} color="#7047EB" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Icon name="search" size={18} color="#9CA3AF" strokeWidth={2} />
        <TextInput
          placeholder="Search blood group, units, or donor name..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs Row */}
      <View style={styles.filterTabsRow}>
        {(['ALL', 'CRITICAL', 'PENDING', 'ACCEPTED'] as const).map((tab) => {
          const isActive = filterTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setFilterTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab === 'ALL' && 'All'}
                {tab === 'CRITICAL' && 'Critical'}
                {tab === 'PENDING' && 'Pending'}
                {tab === 'ACCEPTED' && 'Accepted'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Requests List */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <LoadingState message="Loading live broadcasts..." />
          ) : (
            <EmptyState
              title="No Broadcasts Found"
              description="No active requests match your filter. Tap '+ New Request' to create one."
              actionTitle="+ Broadcast Emergency Request"
              onAction={() => navigation.navigate('CreateRequest')}
            />
          )
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    marginLeft: 8,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#7047EB',
    borderColor: '#7047EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  requestCard: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#F0F1F7',
    padding: 16,
  },
  cardAccepted: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodTagSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bloodTagCritical: {
    backgroundColor: '#FEE2E2',
  },
  bloodTagNormal: {
    backgroundColor: '#EDE9FE',
  },
  bloodTagText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
  },
  reqInfo: {
    flex: 1,
  },
  reqId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  reqUnits: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  matchingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  radarPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  candidateCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  acceptedBanner: {
    marginTop: 12,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  acceptedIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  acceptedDonor: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
});
