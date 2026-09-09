import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, LoadingState } from '../../components';
import { useAuth } from '../../store/AuthContext';
import { donorsApi } from '../../services/api';
import { BloodRequest, EligibilityResult } from '../../types';

export const DonorHomeScreen = ({ navigation }: any) => {
  const { user, toggleAvailability, logout } = useAuth();
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
    const interval = setInterval(loadData, 5000); // Polling for live emergency alerts
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName}>{user?.name || 'Valued Donor'}</Text>
          </View>
          <View style={styles.bloodPill}>
            <Text style={styles.bloodPillText}>{user?.bloodGroup || 'O+'}</Text>
          </View>
        </View>

        {/* Emergency Alert Banner if there are active incoming requests */}
        {incomingRequests.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Requests')}
            style={styles.urgentBanner}
          >
            <View style={styles.urgentBannerLeft}>
              <Text style={styles.urgentIcon}>🚨</Text>
              <View>
                <Text style={styles.urgentTitle}>
                  {incomingRequests.length} Urgent Blood Request
                  {incomingRequests.length > 1 ? 's' : ''}!
                </Text>
                <Text style={styles.urgentSub}>Tap to view details and respond</Text>
              </View>
            </View>
            <Text style={styles.urgentArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Emergency Availability Card */}
        <Card variant="outlined" style={styles.availabilityCard}>
          <View style={styles.availabilityRow}>
            <View>
              <Text style={styles.cardTitle}>Emergency Availability</Text>
              <Text style={styles.cardSubtitle}>
                {isAvailable ? 'Active for emergency calls' : 'Paused — you will not be notified'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isAvailable ? colors.primary : '#FFFFFF'}
            />
          </View>
        </Card>

        {/* Eligibility Status Card */}
        <Card variant="outlined" style={styles.eligibilityCard}>
          <View style={styles.eligibilityHeader}>
            <Text style={styles.cardTitle}>Donation Eligibility</Text>
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

          {eligibility?.reason && (
            <Text style={styles.eligibilityReason}>{eligibility.reason}</Text>
          )}
        </Card>

        {/* Quick Stats Grid */}
        <View style={styles.statsRow}>
          <Card variant="flat" style={styles.statCard}>
            <Text style={styles.statNum}>{incomingRequests.length}</Text>
            <Text style={styles.statLabel}>Nearby Requests</Text>
          </Card>

          <Card variant="flat" style={styles.statCard}>
            <Text style={styles.statNum}>{user?.donationCount || 0}</Text>
            <Text style={styles.statLabel}>Donations Made</Text>
          </Card>
        </View>

        {/* Action Button */}
        <Button
          title="View Urgent Requests"
          onPress={() => navigation.navigate('Requests')}
          variant="primary"
          style={styles.actionBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  bloodPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  bloodPillText: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  urgentBanner: {
    backgroundColor: colors.statusCriticalBg,
    borderColor: colors.statusCritical,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  urgentBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  urgentIcon: {
    fontSize: 24,
  },
  urgentTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.statusCritical,
  },
  urgentSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  urgentArrow: {
    fontSize: 20,
    fontWeight: typography.weights.bold,
    color: colors.statusCritical,
  },
  availabilityCard: {
    marginBottom: spacing.md,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eligibilityCard: {
    marginBottom: spacing.md,
  },
  eligibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eligibilityDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  datesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  eligibilityReason: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statNum: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actionBtn: {
    marginBottom: spacing.xl,
  },
});
