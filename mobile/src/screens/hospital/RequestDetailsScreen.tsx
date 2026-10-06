import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, LoadingState, Header, Icon } from '../../components';
import { requestsApi } from '../../services/api';
import { BloodRequest, RequestState, FulfillmentTelemetry } from '../../types';

export const RequestDetailsScreen = ({ route, navigation }: any) => {
  const { requestId } = route.params;
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [telemetry, setTelemetry] = useState<FulfillmentTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await requestsApi.getRequestById(requestId);
      setRequest(res.request);

      try {
        const telRes = await requestsApi.getTelemetry(requestId);
        setTelemetry(telRes.telemetry);
      } catch (telErr) {
        // Fallback calculation from request object
        const q = res.request.requiredQuantity || res.request.unitsRequired;
        const ir = res.request.reservedInventoryUnits || 0;
        const dc = res.request.confirmedDonorCount || (res.request.donorCommitments?.length || 0);
        setTelemetry({
          requestId: res.request.id,
          requiredQuantity: q,
          reservedInventoryUnits: ir,
          confirmedDonorCount: dc,
          remainingGap: Math.max(0, q - ir - dc),
          currentTier: res.request.currentTier || 1,
          totalTiers: res.request.dispatchTiers?.length || 1,
          activeInvitationsCount: res.request.matchedCandidates?.filter((c) => c.status === 'NOTIFIED').length || 0,
          cancelledInvitationsCount: res.request.matchedCandidates?.filter((c) => c.status === 'CANCELLED_GAP_FULFILLED').length || 0,
          status: res.request.status,
          dispatchEfficiency: 1.0,
          updatedAt: res.request.updatedAt,
        });
      }
    } catch (err: any) {
      console.error('Failed to load request details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchDetails();
    // Live update polling every 3 seconds so donor acceptance and AFGC recalculations appear live
    const timer = setInterval(fetchDetails, 3000);
    return () => clearInterval(timer);
  }, [fetchDetails]);

  // Live Simulation Handler 1: Reserve 1 inventory unit from bank
  const handleReserveInventory = async () => {
    setSimulating(true);
    try {
      const res = await requestsApi.reserveInventory(requestId, 1);
      setRequest(res.request);
      setTelemetry(res.telemetry);
      Alert.alert('Dual-Source Inventory Reserved', res.message);
    } catch (err: any) {
      Alert.alert('Reservation Failed', err.message || 'No compatible inventory available to reserve.');
    } finally {
      setSimulating(false);
    }
  };

  // Live Simulation Handler 2: Release 1 inventory unit back to bank
  const handleReleaseInventory = async () => {
    setSimulating(true);
    try {
      const res = await requestsApi.releaseInventory(requestId);
      setRequest(res.request);
      setTelemetry(res.telemetry);
      Alert.alert('Inventory Released', res.message);
    } catch (err: any) {
      Alert.alert('Release Failed', err.message || 'Could not release inventory.');
    } finally {
      setSimulating(false);
    }
  };

  // Live Simulation Handler 3: Next notified candidate donor accepts
  const handleSimulateDonorAccept = async () => {
    setSimulating(true);
    try {
      const res = await requestsApi.simulateDonorAccept(requestId);
      setRequest(res.request);
      setTelemetry(res.telemetry);
      Alert.alert('AFGC Event: Donor Confirmed', res.message);
    } catch (err: any) {
      Alert.alert('Simulation Note', err.message || 'No candidates currently in NOTIFIED status.');
    } finally {
      setSimulating(false);
    }
  };

  // Live Simulation Handler 4: Confirmed donor cancels
  const handleSimulateDonorCancel = async () => {
    setSimulating(true);
    try {
      const res = await requestsApi.simulateDonorCancel(requestId);
      setRequest(res.request);
      setTelemetry(res.telemetry);
      Alert.alert('AFGC Event: Donor Cancelled', res.message);
    } catch (err: any) {
      Alert.alert('Cancellation Note', err.message || 'No confirmed donor to cancel.');
    } finally {
      setSimulating(false);
    }
  };

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
        <Header title="AFGC Emergency Tracking" onBack={() => navigation.goBack()} />
        <LoadingState message="Connecting to AFGC closed-loop controller..." />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="AFGC Emergency Tracking" onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Emergency request not found or expired.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // AFGC Formula Variables
  const Q = request.requiredQuantity || request.unitsRequired || 1;
  const IR = request.reservedInventoryUnits || 0;
  const DC = request.confirmedDonorCount || (request.donorCommitments?.filter((c) => c.status === 'CONFIRMED').length || 0);
  const G = telemetry ? telemetry.remainingGap : Math.max(0, Q - IR - DC);
  const isFulfilled = G === 0 || request.status === 'FULFILLED' || (request.status === 'ACCEPTED' && G === 0);
  const fulfillmentRatio = Math.min(1.0, (IR + DC) / Q);

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={`AFGC #${request.id}`}
        subtitle="Closed-Loop Emergency Fulfillment Engine"
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
        {/* ========================================================= */}
        {/* SECTION 1: MASTER AFGC GAP FORMULA & LIVE GAUGES          */}
        {/* ========================================================= */}
        <Card variant="flat" style={styles.gaugeCard}>
          <View style={styles.formulaHeaderRow}>
            <View>
              <Text style={styles.formulaTag}>CORE PATENT FORMULATION</Text>
              <Text style={styles.formulaTitle}>G = Q − IR − DC</Text>
            </View>
            <View style={[styles.statusPill, isFulfilled ? styles.pillFulfilled : styles.pillActive]}>
              <View style={[styles.pulseDot, isFulfilled ? styles.pulseDotGreen : styles.pulseDotPurple]} />
              <Text style={[styles.pillText, isFulfilled ? styles.pillTextGreen : styles.pillTextPurple]}>
                {isFulfilled ? 'FULFILLED' : `GAP: ${G} UNIT${G > 1 ? 'S' : ''}`}
              </Text>
            </View>
          </View>

          {/* 4-Metric Breakdown Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCol}>
              <Text style={styles.metricVal}>{Q}</Text>
              <Text style={styles.metricLabel}>Required (Q)</Text>
              <Text style={styles.metricSub}>Hospital Req</Text>
            </View>

            <Text style={styles.mathSymbol}>−</Text>

            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: '#059669' }]}>{IR}</Text>
              <Text style={styles.metricLabel}>Inventory (IR)</Text>
              <Text style={styles.metricSub}>Bank Units</Text>
            </View>

            <Text style={styles.mathSymbol}>−</Text>

            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: '#2563EB' }]}>{DC}</Text>
              <Text style={styles.metricLabel}>Donors (DC)</Text>
              <Text style={styles.metricSub}>Confirmed</Text>
            </View>

            <Text style={styles.mathSymbol}>=</Text>

            <View style={[styles.metricCol, styles.gapColHighlight]}>
              <Text style={[styles.metricVal, isFulfilled ? { color: '#059669' } : { color: '#DC2626' }]}>
                {G}
              </Text>
              <Text style={[styles.metricLabel, { fontWeight: '700' }]}>Gap (G)</Text>
              <Text style={styles.metricSub}>{isFulfilled ? 'Resolved' : 'To Dispatch'}</Text>
            </View>
          </View>

          {/* Fulfillment Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.round(fulfillmentRatio * 100)}%` }]} />
          </View>
          <View style={styles.progressLabelsRow}>
            <Text style={styles.progressPercentText}>{Math.round(fulfillmentRatio * 100)}% Fulfilled</Text>
            <Text style={styles.progressDetailText}>
              {IR + DC} of {Q} units secured
            </Text>
          </View>
        </Card>

        {/* ========================================================= */}
        {/* SECTION 2: QUOTA FULFILLED BANNER (AUTO-TERMINATION)       */}
        {/* ========================================================= */}
        {isFulfilled ? (
          <Card variant="flat" style={styles.quotaFulfilledCard}>
            <View style={styles.quotaFulfilledRow}>
              <View style={styles.quotaIconSquircle}>
                <Icon name="check" size={22} color="#059669" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quotaFulfilledTitle}>REQUIREMENT FULFILLED (G = 0)</Text>
                <Text style={styles.quotaFulfilledDesc}>
                  AFGC automatically stopped donor dispatch, revoked ephemeral credentials, and terminated pending invitations to prevent redundant donor mobilization.
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* ========================================================= */}
        {/* SECTION 3: LIVE DEMO & EVALUATION CONTROLS               */}
        {/* ========================================================= */}
        <Card variant="outlined" style={styles.simCard}>
          <View style={styles.simHeaderRow}>
            <Icon name="sparkles" size={18} color="#7047EB" strokeWidth={2.2} />
            <Text style={styles.simHeaderTitle}>LIVE DEMONSTRATION CONTROLS</Text>
          </View>
          <Text style={styles.simSub}>
            Trigger closed-loop feedback events to verify real-time recalculation of G:
          </Text>

          <View style={styles.simBtnGrid}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.simActionBtn, styles.btnReserve]}
              onPress={handleReserveInventory}
              disabled={simulating}
            >
              <Icon name="flask" size={15} color="#059669" strokeWidth={2.2} />
              <Text style={styles.btnReserveText}>+1 Bank Reserve (IR)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.simActionBtn, styles.btnRelease]}
              onPress={handleReleaseInventory}
              disabled={simulating || IR === 0}
            >
              <Icon name="refresh" size={15} color="#6B7280" strokeWidth={2.2} />
              <Text style={styles.btnReleaseText}>−1 Release Bank</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.simActionBtn, styles.btnDonorAccept]}
              onPress={handleSimulateDonorAccept}
              disabled={simulating}
            >
              <Icon name="user" size={15} color="#2563EB" strokeWidth={2.2} />
              <Text style={styles.btnDonorAcceptText}>+1 Donor Accept (DC)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.simActionBtn, styles.btnDonorCancel]}
              onPress={handleSimulateDonorCancel}
              disabled={simulating || DC === 0}
            >
              <Icon name="alert-siren" size={15} color="#DC2626" strokeWidth={2.2} />
              <Text style={styles.btnDonorCancelText}>−1 Donor Cancel</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* ========================================================= */}
        {/* SECTION 4: DUAL-SOURCE RESERVATION BREAKDOWN             */}
        {/* ========================================================= */}
        <Card variant="outlined" style={styles.dualSourceCard}>
          <Text style={styles.sectionTitle}>Dual-Source Fulfillment Breakdown</Text>

          {/* Source A: Blood Bank Inventory */}
          <View style={styles.sourceBox}>
            <View style={styles.sourceHeader}>
              <View style={styles.sourceTagSquircleGreen}>
                <Icon name="flask" size={16} color="#059669" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sourceTitle}>Source 1: Authorized Inventory Reserves ({IR} Units)</Text>
                <Text style={styles.sourceSub}>Secured directly from regional blood centers</Text>
              </View>
            </View>

            {request.reservedInventoryUnitIds && request.reservedInventoryUnitIds.length > 0 ? (
              <View style={styles.tagsWrap}>
                {request.reservedInventoryUnitIds.map((unitId) => (
                  <View key={unitId} style={styles.unitChip}>
                    <Text style={styles.unitChipText}>{unitId}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptySourceText}>No blood units currently reserved from inventory.</Text>
            )}
          </View>

          {/* Source B: Voluntary Donor Commitments */}
          <View style={[styles.sourceBox, { marginTop: spacing.md }]}>
            <View style={styles.sourceHeader}>
              <View style={styles.sourceTagSquircleBlue}>
                <Icon name="user" size={16} color="#2563EB" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sourceTitle}>Source 2: Voluntary Donor Commitments ({DC} Donors)</Text>
                <Text style={styles.sourceSub}>Confirmed via request-bound ephemeral invitations</Text>
              </View>
            </View>

            {request.donorCommitments && request.donorCommitments.length > 0 ? (
              request.donorCommitments.map((comm) => (
                <View key={comm.id} style={styles.commitmentRow}>
                  <View style={styles.commitmentLeft}>
                    <Text style={styles.commitmentName}>{comm.donorName}</Text>
                    <Text style={styles.commitmentMeta}>
                      {comm.bloodGroup} • Committed {new Date(comm.committedAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={[styles.chipBadge, comm.status === 'CONFIRMED' ? styles.chipConfirmed : styles.chipCancelled]}>
                    <Text style={styles.chipBadgeText}>{comm.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptySourceText}>Awaiting confirmed voluntary donor commitments.</Text>
            )}
          </View>
        </Card>

        {/* ========================================================= */}
        {/* SECTION 5: TIERED DISPATCH & PRIVACY CANDIDATES           */}
        {/* ========================================================= */}
        <Card variant="outlined">
          <View style={styles.tierHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                Response-Aware Dispatch Pool ({request.matchedCandidates?.length || 0})
              </Text>
              <Text style={styles.tierSub}>
                Tier {request.currentTier || 1} • Ephemeral HMAC Credentials • Zero Persistent GPS
              </Text>
            </View>
            <View style={styles.privacyBadge}>
              <Icon name="shield" size={14} color="#7047EB" strokeWidth={2.2} />
              <Text style={styles.privacyBadgeText}>Privacy Ephemeral</Text>
            </View>
          </View>

          {request.matchedCandidates?.map((candidate, idx) => {
            const isNotified = candidate.status === 'NOTIFIED';
            const isCancelled = candidate.status === 'CANCELLED_GAP_FULFILLED';
            const isAccepted = candidate.status === 'ACCEPTED';

            return (
              <View key={candidate.donorId} style={styles.candidateRow}>
                <View style={styles.candidateLeft}>
                  <Text style={styles.rankNum}>#{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.candidateName}>{candidate.donorName}</Text>
                    <Text style={styles.candidateSub}>
                      {candidate.bloodGroup} • {candidate.distanceKm} km away • Score: {Math.round(candidate.score * 100)}%
                    </Text>
                    {candidate.ephemeralToken ? (
                      <View style={styles.tokenBadgeRow}>
                        <Icon name="lock" size={11} color="#6B7280" />
                        <Text style={styles.tokenText}>
                          Token: {candidate.ephemeralToken.slice(0, 8)}... (Band &lt;5km)
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {isCancelled ? (
                  <View style={styles.autoCancelledBadge}>
                    <Text style={styles.autoCancelledText}>AUTO-TERMINATED</Text>
                  </View>
                ) : isNotified ? (
                  <View style={styles.tierNotifiedBadge}>
                    <Text style={styles.tierNotifiedText}>NOTIFIED (T{candidate.tierNumber || 1})</Text>
                  </View>
                ) : isAccepted ? (
                  <View style={styles.acceptedBadge}>
                    <Text style={styles.acceptedBadgeText}>CONFIRMED</Text>
                  </View>
                ) : (
                  <StatusBadge value={candidate.status} />
                )}
              </View>
            );
          })}
        </Card>

        {/* ========================================================= */}
        {/* SECTION 6: REQUEST SPECIFICATIONS                         */}
        {/* ========================================================= */}
        <Card variant="outlined" style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Hospital Requirement Details</Text>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Blood Group Required</Text>
            <Text style={styles.specValue}>{request.bloodGroup}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Component Type</Text>
            <Text style={styles.specValue}>{request.component.replace('_', ' ')}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Search Radius</Text>
            <Text style={styles.specValue}>{request.searchRadiusKm} km</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Urgency</Text>
            <StatusBadge value={request.urgency} />
          </View>
          {request.notes ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Clinical Notes</Text>
              <Text style={styles.specValue}>{request.notes}</Text>
            </View>
          ) : null}
        </Card>

        {/* State Transition Actions */}
        {request.status === 'ACCEPTED' && (
          <Button
            title="Mark Donor Arrival En Route"
            onPress={() => handleUpdateStatus('EN_ROUTE')}
            loading={updating}
            size="md"
            style={{ marginTop: spacing.md }}
          />
        )}
        {request.status === 'EN_ROUTE' && (
          <Button
            title="Mark Transfusion Completed"
            onPress={() => handleUpdateStatus('COMPLETED')}
            loading={updating}
            variant="primary"
            size="md"
            style={{ marginTop: spacing.md }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notFound: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  gaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  formulaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  formulaTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7047EB',
    letterSpacing: 0.8,
  },
  formulaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: '#F3E8FF',
  },
  pillFulfilled: {
    backgroundColor: '#D1FAE5',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pulseDotPurple: {
    backgroundColor: '#7047EB',
  },
  pulseDotGreen: {
    backgroundColor: '#059669',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextPurple: {
    color: '#7047EB',
  },
  pillTextGreen: {
    color: '#059669',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  gapColHighlight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  mathSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7047EB',
    borderRadius: 4,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7047EB',
  },
  progressDetailText: {
    fontSize: 11,
    color: '#6B7280',
  },
  quotaFulfilledCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quotaFulfilledRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quotaIconSquircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotaFulfilledTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  quotaFulfilledDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 3,
    lineHeight: 16,
  },
  simCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderColor: '#DDD6FE',
    borderWidth: 1.5,
  },
  simHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5B21B6',
    letterSpacing: 0.5,
  },
  simSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  simBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  simActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnReserve: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  btnReserveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  btnRelease: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  btnReleaseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  btnDonorAccept: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  btnDonorAcceptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  btnDonorCancel: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  btnDonorCancelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  dualSourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.sm,
  },
  sourceBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sourceTagSquircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTagSquircleBlue: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  sourceSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  unitChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  unitChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857',
  },
  emptySourceText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 6,
  },
  commitmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commitmentLeft: {
    flex: 1,
  },
  commitmentName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  commitmentMeta: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  chipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipConfirmed: {
    backgroundColor: '#D1FAE5',
  },
  chipCancelled: {
    backgroundColor: '#FEE2E2',
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  tierHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  tierSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7047EB',
  },
  candidateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  candidateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7047EB',
  },
  candidateName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  candidateSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  tokenBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  tokenText: {
    fontSize: 9,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  autoCancelledBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  autoCancelledText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7047EB',
  },
  tierNotifiedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tierNotifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
  },
  acceptedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  acceptedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  specLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
});
