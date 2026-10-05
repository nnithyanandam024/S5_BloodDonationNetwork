import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, Icon } from '../../components';
import { useAuth } from '../../store/AuthContext';
import { donorsApi } from '../../services/api';
import { BloodRequest, EligibilityResult } from '../../types';
import Svg, { Circle } from 'react-native-svg';

// Progress Ring around user avatar matching reference Screen 1
const AvatarProgressRing = ({
  initial = 'D',
  percentage = 75,
}: {
  initial?: string;
  percentage?: number;
}) => {
  const size = 46;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 46 46">
        <Circle cx="23" cy="23" r="21" stroke="#E5E7EB" strokeWidth="2.5" fill="none" />
        <Circle
          cx="23"
          cy="23"
          r="21"
          stroke={colors.violetPrimary}
          strokeWidth="2.5"
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

export const DonorHomeScreen = ({ navigation }: any) => {
  const { user, toggleAvailability } = useAuth();
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<BloodRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [eligRes, reqsRes] = await Promise.all([
        donorsApi.getEligibility().catch(() => null),
        donorsApi.getIncomingRequests().catch(() => ({ requests: [] })),
      ]);

      if (eligRes) setEligibility(eligRes);
      if (reqsRes && reqsRes.requests) setIncomingRequests(reqsRes.requests);
    } catch (err) {
      console.error('Failed to load donor dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleAvailability = async (val: boolean) => {
    try {
      await toggleAvailability(val);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update availability status');
    }
  };

  const isAvailable = user?.isAvailable !== false;
  const userInitial = user?.name ? user.name.charAt(0) : 'D';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header - Reference Design Recreation */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <AvatarProgressRing
              initial={userInitial}
              percentage={eligibility?.isEligible ? 100 : 60}
            />
            <View style={styles.headerTextGroup}>
              <Text style={styles.greetingTitle}>
                Hello  {user?.name ? user.name.split(' ')[0] : 'Donor'}!
              </Text>
              <Text style={styles.greetingSubtitle}>
                {eligibility?.isEligible ? 'Ready to save lives today' : 'Complete profile & check health'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Requests')}
          >
            <Icon name="bell" size={20} color="#1F2937" strokeWidth={1.8} />
            {incomingRequests.length > 0 && <View style={styles.redDotBadge} />}
          </TouchableOpacity>
        </View>

        {/* Interactive Reference Design Shortcut Pill */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DesignReference')}
          style={styles.uiReferenceBanner}
        >
          <View style={styles.uiReferenceLeft}>
            <View style={styles.uiReferenceIconBox}>
              <Icon name="sparkles" size={16} color="#7047EB" strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.uiReferenceTitle}>UI Design Reference Mode</Text>
              <Text style={styles.uiReferenceSub}>Tap to view exact 3-screen interactive recreation</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={16} color="#7047EB" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Search Bar - Reference Design */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            placeholder="Search hospitals, blood banks, or requests..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
          <TouchableOpacity activeOpacity={0.7} style={styles.filterBtn}>
            <Icon name="filter" size={16} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Emergency Alert Banner if requests are incoming (NO EMOJIS) */}
        {incomingRequests.length > 0 && (
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
                  {incomingRequests.length} Urgent Blood Request
                  {incomingRequests.length > 1 ? 's' : ''}!
                </Text>
                <Text style={styles.urgentSub}>Tap to view immediate hospital locations</Text>
              </View>
            </View>
            <Icon name="arrow-right" size={18} color="#DC2626" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Featured Purple Hero Card - Reference Design Recreation */}
        <View style={styles.purpleHeroCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconSquircle}>
              <Icon name="droplet" size={22} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardMainTitle}>Emergency Blood Pass</Text>
              <Text style={styles.cardSubTitle}>
                Universal Donor • Group {user?.bloodGroup || 'O+'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile')}
              style={styles.cardCornerBtn}
            >
              <Icon name="arrow-up-right" size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardDetailsRow}>
            <View style={styles.cardDetailCol}>
              <Text style={styles.cardDetailLabel}>Card Holder</Text>
              <Text style={styles.cardDetailValue}>{user?.name || 'Valued Life Donor'}</Text>
            </View>
            <View style={[styles.cardDetailCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.cardDetailLabel}>Center Network</Text>
              <Text style={styles.cardDetailValue}>City Health Registry</Text>
            </View>
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardDetailLabel}>Next Eligible Date</Text>
              <Text style={styles.cardDateValue}>
                {eligibility?.nextEligibleDate
                  ? new Date(eligibility.nextEligibleDate).toLocaleDateString()
                  : 'Available Today'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.darkPillBtn}
              onPress={() => navigation.navigate('Requests')}
            >
              <Text style={styles.darkPillBtnText}>Donate Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Health & Services Categories - 4 Squircles from Reference */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Health & Donation</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesRow}>
          {/* Category 1: Health (Pink) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Requests')}
            style={styles.categoryItem}
          >
            <View style={[styles.categorySquircle, { backgroundColor: '#FDECEF' }]}>
              <Icon name="heart" size={22} color="#E11D48" strokeWidth={2} />
            </View>
            <Text style={styles.categoryLabel}>Health</Text>
          </TouchableOpacity>

          {/* Category 2: Rapid Ride / Transport (Peach) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Requests')}
            style={styles.categoryItem}
          >
            <View style={[styles.categorySquircle, { backgroundColor: '#FFF2E8' }]}>
              <Icon name="bike" size={22} color="#F97316" strokeWidth={2} />
            </View>
            <Text style={styles.categoryLabel}>Emergency</Text>
          </TouchableOpacity>

          {/* Category 3: Donation Camps (Lavender) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('History')}
            style={styles.categoryItem}
          >
            <View style={[styles.categorySquircle, { backgroundColor: '#F1ECFE' }]}>
              <Icon name="home" size={22} color="#7C3AED" strokeWidth={2} />
            </View>
            <Text style={styles.categoryLabel}>Camps</Text>
          </TouchableOpacity>

          {/* Category 4: Medical Supply (Cyan) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
            style={styles.categoryItem}
          >
            <View style={[styles.categorySquircle, { backgroundColor: '#E2F6FC' }]}>
              <Icon name="suitcase" size={22} color="#0284C7" strokeWidth={2} />
            </View>
            <Text style={styles.categoryLabel}>Card ID</Text>
          </TouchableOpacity>
        </View>

        {/* Carousel Dots */}
        <View style={styles.dotIndicatorsRow}>
          <View style={styles.activeDotPill} />
          <View style={styles.inactiveDot} />
          <View style={styles.inactiveDot} />
        </View>

        {/* Quick Actions List with Badges - Reference Recreation */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.viewAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Requests')}
          style={styles.quickActionCard}
        >
          <View style={[styles.quickActionIconBox, { backgroundColor: '#FFF2E8' }]}>
            <Icon name="clipboard" size={20} color="#F97316" strokeWidth={2} />
          </View>
          <View style={styles.quickActionTextBox}>
            <Text style={styles.quickActionTitle}>Register a Donation</Text>
            <Text style={styles.quickActionSub}>Nearby goal: 1 unit (450ml)</Text>
          </View>
          <Text style={styles.quickActionAmount}>+250 Pts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Requests')}
          style={styles.quickActionCard}
        >
          <View style={[styles.quickActionIconBox, { backgroundColor: '#F1ECFE' }]}>
            <Icon name="location-pin" size={20} color="#7C3AED" strokeWidth={2} />
          </View>
          <View style={styles.quickActionTextBox}>
            <Text style={styles.quickActionTitle}>Find Local Services</Text>
            <Text style={styles.quickActionSub}>Blood banks within 5 km</Text>
          </View>
          <Text style={styles.quickActionAmount}>+134.00</Text>
        </TouchableOpacity>

        {/* Emergency Availability Card */}
        <Card variant="outlined" style={styles.availabilityCard}>
          <View style={styles.availabilityRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.cardHeaderTitle}>Emergency Availability</Text>
              <Text style={styles.cardHeaderSubtitle}>
                {isAvailable
                  ? 'Active — Ready to receive emergency hospital calls'
                  : 'Paused — You will not receive emergency alerts'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: '#E2E8F0', true: '#DDD6FE' }}
              thumbColor={isAvailable ? '#7047EB' : '#FFFFFF'}
            />
          </View>
        </Card>

        {/* Eligibility Status Card */}
        <Card variant="outlined" style={styles.eligibilityCard}>
          <View style={styles.eligibilityHeader}>
            <Text style={styles.cardHeaderTitle}>Donation Eligibility</Text>
            <StatusBadge
              value={eligibility?.isEligible ? 'ELIGIBLE' : 'INELIGIBLE'}
              label={eligibility?.isEligible ? 'Eligible to Donate' : 'Waiting Period'}
            />
          </View>

          <View style={styles.eligibilityDivider} />

          <View style={styles.datesGrid}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Last Donation</Text>
              <Text style={styles.dateValue}>
                {eligibility?.lastDonationDate
                  ? new Date(eligibility.lastDonationDate).toLocaleDateString()
                  : 'No prior record'}
              </Text>
            </View>

            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Next Eligible Date</Text>
              <Text style={styles.dateValue}>
                {eligibility?.nextEligibleDate
                  ? new Date(eligibility.nextEligibleDate).toLocaleDateString()
                  : 'Available Today'}
              </Text>
            </View>
          </View>
        </Card>
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
    paddingBottom: 100,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  greetingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF0F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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

  uiReferenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3EFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  uiReferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  uiReferenceIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uiReferenceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7047EB',
  },
  uiReferenceSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1F2937',
  },
  filterBtn: {
    padding: 6,
  },

  urgentBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  urgentBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  urgentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  urgentSub: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 1,
  },

  purpleHeroCard: {
    backgroundColor: '#7047EB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardMainTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cardCornerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardDetailCol: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  cardDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 14,
  },
  cardDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  darkPillBtn: {
    backgroundColor: '#151622',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 20,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7047EB',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  dotIndicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
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

  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickActionTextBox: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  quickActionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  quickActionAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  availabilityCard: {
    marginTop: 8,
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },

  eligibilityCard: {
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  eligibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eligibilityDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  datesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
});
