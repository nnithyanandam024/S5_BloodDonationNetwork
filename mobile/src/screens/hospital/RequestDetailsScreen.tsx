import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, LoadingState, Header } from '../../components';
import { requestsApi } from '../../services/api';
import { BloodRequest, RequestState } from '../../types';

export const RequestDetailsScreen = ({ route, navigation }: any) => {
  const { requestId } = route.params;
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await requestsApi.getRequestById(requestId);
      setRequest(res.request);
    } catch (err: any) {
      console.error('Failed to load request details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchDetails();
    // Live update polling every 3 seconds so donor acceptance appears automatically!
    const timer = setInterval(fetchDetails, 3000);
    return () => clearInterval(timer);
  }, [fetchDetails]);

  const handleUpdateStatus = async (newStatus: RequestState) => {
    setUpdating(true);
    try {
      const res = await requestsApi.updateRequestStatus(requestId, newStatus);
      setRequest(res.request);
      Alert.alert('Status Updated', res.message);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !request) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Request Tracking" onBack={() => navigation.goBack()} />
        <LoadingState message="Tracking emergency request status..." />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Request Tracking" onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Request not found or expired.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAccepted = request.status === 'ACCEPTED' || request.status === 'EN_ROUTE' || request.status === 'COMPLETED';

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={`Request ${request.id}`}
        subtitle="Live state & donor response tracking"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDetails();
            }}
          />
        }
      >
        {/* Real-time State Machine Pipeline */}
        <Card variant="flat" style={styles.progressCard}>
          <Text style={styles.pipelineTitle}>Request State Progression</Text>
          <View style={styles.pipelineRow}>
            {(['MATCHING', 'NOTIFIED', 'ACCEPTED', 'COMPLETED'] as const).map((step, idx) => {
              const activeIndex = ['CREATED', 'MATCHING', 'NOTIFIED', 'ACCEPTED', 'EN_ROUTE', 'COMPLETED'].indexOf(request.status);
              const stepIndex = ['CREATED', 'MATCHING', 'NOTIFIED', 'ACCEPTED', 'EN_ROUTE', 'COMPLETED'].indexOf(step);
              const isPastOrCurrent = activeIndex >= stepIndex;

              return (
                <View key={step} style={styles.stepBlock}>
                  <View
                    style={[
                      styles.stepCircle,
                      isPastOrCurrent ? styles.stepCircleActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNum,
                        isPastOrCurrent ? styles.stepNumActive : undefined,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={styles.stepLabel}>{step}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Live Acceptance Banner */}
        {isAccepted && request.acceptedDonorName ? (
          <Card variant="outlined" style={styles.acceptedCard}>
            <View style={styles.acceptedHeader}>
              <Text style={styles.acceptedIcon}>🎉</Text>
              <View style={styles.acceptedTitleWrap}>
                <Text style={styles.acceptedTitle}>DONOR ACCEPTED!</Text>
                <Text style={styles.acceptedSub}>
                  Confirmed at {request.acceptedAt ? new Date(request.acceptedAt).toLocaleTimeString() : 'Recently'}
                </Text>
              </View>
            </View>

            <View style={styles.donorProfileBox}>
              <View style={styles.donorInfoRow}>
                <Text style={styles.donorLabel}>Donor Name</Text>
                <Text style={styles.donorValue}>{request.acceptedDonorName}</Text>
              </View>
              <View style={styles.donorInfoRow}>
                <Text style={styles.donorLabel}>Blood Group</Text>
                <Text style={styles.donorValue}>{request.bloodGroup}</Text>
              </View>
              <View style={styles.donorInfoRow}>
                <Text style={styles.donorLabel}>Contact Phone</Text>
                <Text style={styles.donorValue}>{request.acceptedDonorPhone || '+91 98765 43210'}</Text>
              </View>
            </View>

            {request.status === 'ACCEPTED' && (
              <Button
                title="Mark Donor En Route"
                onPress={() => handleUpdateStatus('EN_ROUTE')}
                loading={updating}
                size="sm"
                style={styles.transitionBtn}
              />
            )}

            {request.status === 'EN_ROUTE' && (
              <Button
                title="Mark Donation Completed"
                onPress={() => handleUpdateStatus('COMPLETED')}
                loading={updating}
                variant="primary"
                size="sm"
                style={styles.transitionBtn}
              />
            )}
          </Card>
        ) : (
          <Card variant="outlined" style={styles.waitingCard}>
            <Text style={styles.waitingTitle}>⏳ Awaiting Donor Responses</Text>
            <Text style={styles.waitingSub}>
              Matching engine notified {request.matchedCandidates?.length || 0} eligible candidates in radius.
              Dashboard updates live as soon as a donor accepts.
            </Text>
          </Card>
        )}

        {/* Request Details Overview */}
        <Card variant="outlined">
          <Text style={styles.sectionTitle}>Request Specification</Text>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Blood Group</Text>
            <Text style={styles.specValue}>{request.bloodGroup}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Component</Text>
            <Text style={styles.specValue}>{request.component.replace('_', ' ')}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Units Required</Text>
            <Text style={styles.specValue}>{request.unitsRequired} Bags</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Urgency</Text>
            <StatusBadge value={request.urgency} />
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Search Radius</Text>
            <Text style={styles.specValue}>{request.searchRadiusKm} km</Text>
          </View>
          {request.notes ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Notes</Text>
              <Text style={styles.specValue}>{request.notes}</Text>
            </View>
          ) : null}
        </Card>

        {/* Matched Donors Candidate Ranking */}
        <Card variant="outlined">
          <Text style={styles.sectionTitle}>
            Matched Candidates ({request.matchedCandidates?.length || 0})
          </Text>

          {request.matchedCandidates?.map((candidate, idx) => (
            <View key={candidate.donorId} style={styles.candidateRow}>
              <View style={styles.candidateLeft}>
                <Text style={styles.rankNum}>#{idx + 1}</Text>
                <View>
                  <Text style={styles.candidateName}>{candidate.donorName}</Text>
                  <Text style={styles.candidateSub}>
                    {candidate.bloodGroup} • {candidate.distanceKm} km away • Score: {Math.round(candidate.score * 100)}%
                  </Text>
                </View>
              </View>
              <StatusBadge value={candidate.status} />
            </View>
          ))}
        </Card>
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
  notFound: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  progressCard: {
    marginBottom: spacing.md,
  },
  pipelineTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  pipelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepBlock: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepNum: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
  stepNumActive: {
    color: colors.textInverse,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  acceptedCard: {
    borderColor: colors.statusAccepted,
    backgroundColor: '#F0FDF4',
    marginBottom: spacing.md,
  },
  acceptedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  acceptedIcon: {
    fontSize: 26,
  },
  acceptedTitleWrap: {
    flex: 1,
  },
  acceptedTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.statusAccepted,
  },
  acceptedSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  donorProfileBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  donorInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  donorLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  donorValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  transitionBtn: {
    marginTop: spacing.xs,
  },
  waitingCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  waitingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.statusUrgent,
  },
  waitingSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  specLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  specValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  candidateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  candidateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  rankNum: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
  candidateName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  candidateSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
