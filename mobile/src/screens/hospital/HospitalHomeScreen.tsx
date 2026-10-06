import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, EmptyState, LoadingState, Icon } from '../../components';
import { useAuth } from '../../store/AuthContext';
import { requestsApi } from '../../services/api';
import { BloodRequest } from '../../types';
import Svg, { Circle } from 'react-native-svg';

// Progress Ring around hospital avatar matching Donor Screen design
const AvatarProgressRing = ({
  initial = 'H',
  percentage = 100,
}: {
  initial?: string;
  percentage?: number;
}) => {
  const size = 46;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 46 46">
        <Circle cx="23" cy="23" r="21" stroke="#E5E7EB" strokeWidth={2.5} fill="none" />
        <Circle
          cx="23"
          cy="23"
          r="21"
          stroke={colors.violetPrimary}
          strokeWidth={2.5}
          fill="none"
          strokeDasharray="132"
          strokeDashoffset={132 - (132 * percentage) / 100}
          strokeLinecap="round"
          transform="rotate(-90 23 23)"
        />
      </Svg>
      <View style={styles.avatarInner}>
        <Text style={styles.avatarLetter}>{initial.toUpperCase()}</Text>
      </View>
      <View style={styles.progressBadge}>
        <Text style={styles.progressBadgeText}>{percentage}%</Text>
      </View>
    </View>
  );
};

export const HospitalHomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHospitalRequests = useCallback(async () => {
    try {
      const res = await requestsApi.getHospitalRequests();
      setRequests(res.requests || []);
    } catch (err) {
      console.error('Failed to load hospital requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitalRequests();
    const interval = setInterval(fetchHospitalRequests, 4000);
    return () => clearInterval(interval);
  }, [fetchHospitalRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHospitalRequests();
  };

  const activeCount = requests.filter((r) => !['COMPLETED', 'CANCELLED'].includes(r.status)).length;
  const acceptedCount = requests.filter((r) => r.status === 'ACCEPTED').length;
  const pendingCount = requests.filter((r) => r.status === 'NOTIFIED' || r.status === 'MATCHING').length;

  const facilityInitial = user?.hospitalName
    ? user.hospitalName.charAt(0)
    : user?.name
    ? user.name.charAt(0)
    : 'H';

  const hospitalName = user?.hospitalName || user?.name || 'City Care Hospital';
  const directorTitle = user?.name ? user.name.split(' ')[0] : 'Director';

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.bloodGroup.toLowerCase().includes(q) ||
      r.component.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.acceptedDonorName && r.acceptedDonorName.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header - Matching Donor Design */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <AvatarProgressRing
              initial={facilityInitial}
              percentage={100}
            />
            <View style={styles.headerTextGroup}>
              <Text style={styles.greetingTitle}>
                Hello  {directorTitle}!
              </Text>
              <Text style={styles.greetingSubtitle}>
                Emergency Trauma Center • Active
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Requests')}
          >
            <Icon name="bell" size={20} color="#1F2937" strokeWidth={1.8} />
            {pendingCount > 0 && <View style={styles.redDotBadge} />}
          </TouchableOpacity>
        </View>

        {/* Search Bar - Matching Donor Design */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            placeholder="Search blood requests, units, donors..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.filterBtn}
            onPress={() => navigation.navigate('Requests')}
          >
            <Icon name="filter" size={16} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Emergency Alert Banner if pending requests exist */}
        {pendingCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Requests')}
            style={styles.urgentBanner}
          >
            <View style={styles.urgentBannerLeft}>
              <View style={styles.urgentIconBox}>
                <Icon name="alert-siren" size={20} color="#DC2626" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.urgentTitle}>
                  {pendingCount} Critical Blood Request{pendingCount > 1 ? 's' : ''}!
                </Text>
                <Text style={styles.urgentSub}>
                  Live donor radar active • Tap to view candidates
                </Text>
              </View>
            </View>
            <Icon name="arrow-right" size={18} color="#DC2626" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Featured Purple Hero Card - Matching Donor Design Recreation */}
        <View style={styles.purpleHeroCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconSquircle}>
              <Icon name="hospital" size={22} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardMainTitle}>Emergency Operations Hub</Text>
              <Text style={styles.cardSubTitle}>
                Priority 1 Medical Dispatch • Licensed Center
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('CreateRequest')}
              style={styles.cardCornerBtn}
            >
              <Icon name="arrow-up-right" size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardDetailsRow}>
            <View style={styles.cardDetailCol}>
              <Text style={styles.cardDetailLabel}>Hospital Facility</Text>
              <Text style={styles.cardDetailValue}>{hospitalName}</Text>
            </View>
            <View style={[styles.cardDetailCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.cardDetailLabel}>Center License</Text>
              <Text style={styles.cardDetailValue}>
                {user?.licenseNumber || 'HOSP-BLR-2024-889'}
              </Text>
            </View>
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardDetailLabel}>Active Operations</Text>
              <Text style={styles.cardDateValue}>
                {activeCount > 0 ? `${activeCount} Units Broadcasted` : 'All Units Fulfilled'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.darkPillBtn}
              onPress={() => navigation.navigate('CreateRequest')}
            >
              <Text style={styles.darkPillBtnText}>+ New Request</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories - 4 Pastel Squircles matching Donor Design */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Hospital Services</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesRow}>
          {/* Category 1: New Request (Pink) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateRequest')}
            style={styles.categoryItem}
          >
            <View style={[styles.categorySquircle, { backgroundColor: '#FDECEF' }]}>
              <Icon name="plus" size={22} color="#E11D48" strokeWidth={2.5} />
            </View>
            <Text style={styles.categoryLabel}>Broadcast</Text>
          </TouchableOpacity>

          {/* Category 2: Live Radar (Peach) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Requests')}
            style={styles.categoryItem}
          >
            <View style={[styles.categorySquircle, { backgroundColor: '#FFF2E8' }]}>
              <Icon name="alert-siren" size={22} color="#F97316" strokeWidth={2} />
            </View>
            <Text style={styles.categoryLabel}>Live Radar</Text>
          </TouchableOpacity>

          {/* Category 3: Blood Reserves (Lavender) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Inventory')}
            style={styles.categoryItem}
          >
            <View style={[styles.categorySquircle, { backgroundColor: '#F1ECFE' }]}>
              <Icon name="flask" size={22} color="#7C3AED" strokeWidth={2} />
            </View>
            <Text style={styles.categoryLabel}>Reserves</Text>
          </TouchableOpacity>

          {/* Category 4: Facility ID (Cyan) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
            style={styles.categoryItem}
          >
            <View style={[styles.categorySquircle, { backgroundColor: '#E2F6FC' }]}>
              <Icon name="shield" size={22} color="#0284C7" strokeWidth={2} />
            </View>
            <Text style={styles.categoryLabel}>Center ID</Text>
          </TouchableOpacity>
        </View>

        {/* Carousel Dots */}
        <View style={styles.dotIndicatorsRow}>
          <View style={styles.activeDotPill} />
          <View style={styles.inactiveDot} />
          <View style={styles.inactiveDot} />
        </View>

        {/* 3-Stat Metric Counter Row */}
        <View style={styles.metricsRow}>
          <Card variant="flat" style={styles.metricCard}>
            <Text style={styles.metricNumber}>{activeCount}</Text>
            <Text style={styles.metricLabel}>Active</Text>
          </Card>

          <Card variant="flat" style={styles.metricCard}>
            <Text style={[styles.metricNumber, { color: colors.statusUrgent }]}>
              {pendingCount}
            </Text>
            <Text style={styles.metricLabel}>Pending Match</Text>
          </Card>

          <Card variant="flat" style={styles.metricCard}>
            <Text style={[styles.metricNumber, { color: colors.statusAccepted }]}>
              {acceptedCount}
            </Text>
            <Text style={styles.metricLabel}>Accepted</Text>
          </Card>
        </View>

        {/* Quick Actions List - Matching Donor Design */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Protocols</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('CreateRequest')}>
            <Text style={styles.viewAllText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreateRequest')}
          style={styles.quickActionCard}
        >
          <View style={[styles.quickActionIconBox, { backgroundColor: '#FFF2E8' }]}>
            <Icon name="clipboard" size={20} color="#F97316" strokeWidth={2} />
          </View>
          <View style={styles.quickActionTextBox}>
            <Text style={styles.quickActionTitle}>Emergency Trauma Broadcast</Text>
            <Text style={styles.quickActionSub}>Auto-matches within 15km radar</Text>
          </View>
          <Text style={styles.quickActionAmount}>Priority 1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Inventory')}
          style={styles.quickActionCard}
        >
          <View style={[styles.quickActionIconBox, { backgroundColor: '#F1ECFE' }]}>
            <Icon name="flask" size={20} color="#7C3AED" strokeWidth={2} />
          </View>
          <View style={styles.quickActionTextBox}>
            <Text style={styles.quickActionTitle}>Blood Bank Reserves</Text>
            <Text style={styles.quickActionSub}>Check 8 groups on-site stock</Text>
          </View>
          <Text style={styles.quickActionAmount}>8 Groups</Text>
        </TouchableOpacity>

        {/* Live Requests Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Live Emergency Broadcasts</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.viewAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingState message="Loading hospital requests..." />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No Active Requests"
            description="All patient blood requirements are currently satisfied. Tap below to create an emergency broadcast."
            actionTitle="+ Broadcast Emergency Request"
            onAction={() => navigation.navigate('CreateRequest')}
          />
        ) : (
          filteredRequests.slice(0, 5).map((item) => {
            const isAccepted = item.status === 'ACCEPTED';
            const isCritical = item.urgency === 'CRITICAL';

            return (
              <Card
                key={item.id}
                variant="outlined"
                style={[styles.requestCard, isAccepted ? styles.cardAccepted : undefined]}
                onPress={() => navigation.navigate('RequestDetails', { requestId: item.id })}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.bloodTagSquircle,
                      isCritical ? styles.bloodTagCritical : styles.bloodTagNormal,
                    ]}
                  >
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
                      <Text style={styles.acceptedDonor}>
                        {item.acceptedDonorName} is en route to center
                      </Text>
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
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7047EB',
  },
  progressBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#7047EB',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  progressBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerTextGroup: {
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  greetingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDotBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1F2937',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  urgentBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  urgentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  urgentSub: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 1,
  },
  purpleHeroCard: {
    backgroundColor: '#7047EB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  cardMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardSubTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  cardCornerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardDetailCol: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  cardDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
  },
  cardDateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  darkPillBtn: {
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  darkPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7047EB',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categorySquircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  dotIndicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  activeDotPill: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7047EB',
  },
  inactiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionTextBox: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  quickActionSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  quickActionAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7047EB',
    backgroundColor: '#F3EFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  requestCard: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#F0F1F7',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
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
