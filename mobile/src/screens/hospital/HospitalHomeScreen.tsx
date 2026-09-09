import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, LoadingState, EmptyState } from '../../components';
import { useAuth } from '../../store/AuthContext';
import { requestsApi } from '../../services/api';
import { BloodRequest } from '../../types';

export const HospitalHomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    const interval = setInterval(fetchHospitalRequests, 4000); // Live poll for donor acceptance
    return () => clearInterval(interval);
  }, [fetchHospitalRequests]);

  const activeCount = requests.filter((r) => !['COMPLETED', 'CANCELLED'].includes(r.status)).length;
  const acceptedCount = requests.filter((r) => r.status === 'ACCEPTED').length;
  const pendingCount = requests.filter((r) => r.status === 'NOTIFIED' || r.status === 'MATCHING').length;

  const renderRequestItem = ({ item }: { item: BloodRequest }) => {
    const isAccepted = item.status === 'ACCEPTED';

    return (
      <Card
        variant="outlined"
        style={[styles.requestCard, isAccepted ? styles.cardAccepted : undefined]}
        onPress={() => navigation.navigate('RequestDetails', { requestId: item.id })}
      >
        <View style={styles.cardTop}>
          <View style={styles.bloodTag}>
            <Text style={styles.bloodTagText}>{item.bloodGroup}</Text>
          </View>
          <View style={styles.reqInfo}>
            <Text style={styles.reqId}>{item.id}</Text>
            <Text style={styles.reqUnits}>
              {item.unitsRequired} Units • {item.component.replace('_', ' ')}
            </Text>
          </View>
          <StatusBadge value={item.status} />
        </View>

        {isAccepted && item.acceptedDonorName ? (
          <View style={styles.acceptedBanner}>
            <Text style={styles.acceptedIcon}>✅</Text>
            <View>
              <Text style={styles.acceptedTitle}>Donor Accepted!</Text>
              <Text style={styles.acceptedDonor}>{item.acceptedDonorName} is preparing to donate</Text>
            </View>
          </View>
        ) : (
          <View style={styles.matchingInfo}>
            <Text style={styles.candidateCount}>
              📢 {item.matchedCandidates?.length || 0} Nearby Donors Notified
            </Text>
            <Text style={styles.timestamp}>
              Created {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.facilityType}>HOSPITAL DASHBOARD</Text>
          <Text style={styles.facilityName}>{user?.hospitalName || user?.name || 'Medical Center'}</Text>
        </View>
        <Button
          title="+ New Request"
          onPress={() => navigation.navigate('CreateRequest')}
          size="sm"
        />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHospitalRequests();
            }}
          />
        }
        ListHeaderComponent={
          <>
            {/* 3-Stat Minimal Metric Counter (Phase 6 requirement) */}
            <View style={styles.metricsRow}>
              <Card variant="flat" style={styles.metricCard}>
                <Text style={styles.metricNumber}>{activeCount}</Text>
                <Text style={styles.metricLabel}>Active</Text>
              </Card>

              <Card variant="flat" style={styles.metricCard}>
                <Text style={[styles.metricNumber, { color: colors.statusUrgent }]}>
                  {pendingCount}
                </Text>
                <Text style={styles.metricLabel}>Pending</Text>
              </Card>

              <Card variant="flat" style={styles.metricCard}>
                <Text style={[styles.metricNumber, { color: colors.statusAccepted }]}>
                  {acceptedCount}
                </Text>
                <Text style={styles.metricLabel}>Accepted</Text>
              </Card>
            </View>

            <Text style={styles.sectionHeading}>Emergency Blood Requests</Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState message="Loading requests..." />
          ) : (
            <EmptyState
              title="No Active Requests"
              description="Tap '+ New Request' to broadcast an emergency request to nearby donors."
              actionTitle="Create Emergency Request"
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
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  facilityType: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  facilityName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  list: {
    padding: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: 0,
  },
  metricNumber: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  requestCard: {
    marginBottom: spacing.md,
  },
  cardAccepted: {
    borderColor: colors.statusAccepted,
    backgroundColor: '#F0FDF4',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  bloodTagText: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
  reqInfo: {
    flex: 1,
  },
  reqId: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  reqUnits: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  matchingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  candidateCount: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  timestamp: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  acceptedBanner: {
    marginTop: spacing.md,
    backgroundColor: colors.statusAcceptedBg,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  acceptedIcon: {
    fontSize: 20,
  },
  acceptedTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.statusAccepted,
  },
  acceptedDonor: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
