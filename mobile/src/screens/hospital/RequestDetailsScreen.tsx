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
import { Card, StatusBadge, Button, LoadingState, Header, Icon, QuotaProgressBar } from '../../components';
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
  const [showSimDrawer, setShowSimDrawer] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await requestsApi.getRequestById(requestId);
      setRequest(res.request);

      try {
        const telRes = await requestsApi.getTelemetry(requestId);
        setTelemetry(telRes.telemetry);
      } catch (telErr) {
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
    const timer = setInterval(fetchDetails, 3000);
    return () => clearInterval(timer);
  }, [fetchDetails]);

  const handleUpdateStatus = async (targetState: RequestState) => {
    setUpdating(true);
    try {
      await requestsApi.updateRequestStatus(requestId, targetState);
      Alert.alert('Status Updated', `Emergency requisition state updated to ${targetState}`);
      fetchDetails();
    } catch (err: any) {
      Alert.alert('Transition Error', err.message || 'Could not update requisition state');
    } finally {
      setUpdating(false);
    }
  };

  const handleReserveInventory = async () => {
    setSimulating(true);
    try {
      const res = await requestsApi.reserveInventory(requestId, 1);
      Alert.alert('Inventory Stock Locked', res.message);
      fetchDetails();
    } catch (err: any) {
      Alert.alert('Reserve Failed', err.message || 'Could not lock inventory unit');
    } finally {
      setSimulating(false);
    }
  };

  const handleReleaseInventory = async () => {
    setSimulating(true);
    try {
      const res = await requestsApi.releaseInventory(requestId);
      Alert.alert('Inventory Stock Released', res.message);
      fetchDetails();
    } catch (err: any) {
      Alert.alert('Release Failed', err.message || 'Could not release inventory');
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateDonorAccept = async () => {
    setSimulating(true);
    try {
      const res = await requestsApi.simulateDonorAccept(requestId);
      Alert.alert('Volunteer Check-In Confirmed', res.message);
      fetchDetails();
    } catch (err: any) {
      Alert.alert('Simulation Failed', err.message || 'No candidate available to simulate check-in');
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateDonorCancel = async () => {
    setSimulating(true);
    try {
      const res = await requestsApi.simulateDonorCancel(requestId);
      Alert.alert('Volunteer Notice Cancelled', res.message);
      fetchDetails();
    } catch (err: any) {
      Alert.alert('Simulation Failed', err.message || 'No active commitment available to cancel');
    } finally {
      setSimulating(false);
    }
  };

  if (loading && !request) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Emergency Tracker" onBack={() => navigation.goBack()} />
        <LoadingState message="Connecting to emergency fulfillment network..." />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Emergency Tracker" onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Emergency requisition not found or closed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const Q = request.requiredQuantity || request.unitsRequired || 1;
  const IR = request.reservedInventoryUnits || 0;
  const DC = request.confirmedDonorCount || (request.donorCommitments?.filter((c) => c.status === 'CONFIRMED').length || 0);
  const G = telemetry ? telemetry.remainingGap : Math.max(0, Q - IR - DC);
  const isFulfilled = G === 0 || request.status === 'FULFILLED' || (request.status === 'ACCEPTED' && G === 0);

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={`Requisition #${request.id}`}
        subtitle="Live Clinical Fulfillment Tracker"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
        {/* SECTION 1: MASTER QUOTA PROGRESS GAUGE */}
        <QuotaProgressBar
          totalRequired={Q}
          reservedInventory={IR}
          confirmedDonors={DC}
          remainingNeeded={G}
          isFulfilled={isFulfilled}
        />

        {/* SECTION 2: STATUS CARD */}
        {isFulfilled ? (
          <View style={styles.fulfilledCard}>
            <View style={styles.fulfilledIconCircle}>
              <Icon name="check" size={20} color="#059669" strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fulfilledTitle}>TARGET QUOTA SECURED</Text>
              <Text style={styles.fulfilledDesc}>
                All required units have been confirmed. Additional volunteer dispatch has been concluded to prevent redundant mobilization.
              </Text>
            </View>
          </View>
        ) : null}

        {/* SECTION 3: RESOURCE ALLOCATION BREAKDOWN */}
        <Card variant="outlined" style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Fulfillment Sources</Text>

          {/* Source 1: Blood Bank Stock */}
          <View style={styles.sourceBox}>
            <View style={styles.sourceHeader}>
              <View style={[styles.sourceIconSquare, { backgroundColor: '#CCFBF1' }]}>
                <Icon name="flask" size={16} color="#0D9488" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sourceName}>Regional Blood Bank Reserves</Text>
                <Text style={styles.sourceCount}>
                  {IR} {IR === 1 ? 'unit' : 'units'} locked and ready for delivery
                </Text>
              </View>
            </View>

            {request.reservedInventoryUnitIds && request.reservedInventoryUnitIds.length > 0 ? (
              <View style={styles.chipsRow}>
                {request.reservedInventoryUnitIds.map((uid) => (
                  <View key={uid} style={styles.unitChip}>
                    <Text style={styles.unitChipText}>{uid}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* Source 2: Mobilized Volunteers */}
          <View style={[styles.sourceBox, { marginTop: spacing.md }]}>
            <View style={styles.sourceHeader}>
              <View style={[styles.sourceIconSquare, { backgroundColor: '#DBEAFE' }]}>
                <Icon name="user" size={16} color="#2563EB" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sourceName}>Confirmed Volunteer Donors</Text>
                <Text style={styles.sourceCount}>
                  {DC} {DC === 1 ? 'donor' : 'donors'} committed and en route
                </Text>
              </View>
            </View>

            {request.donorCommitments && request.donorCommitments.length > 0 ? (
              request.donorCommitments.map((comm) => (
                <View key={comm.id} style={styles.commRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commName}>{comm.donorName}</Text>
                    <Text style={styles.commMeta}>
                      {comm.bloodGroup} • Confirmed at {new Date(comm.committedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPillSmall,
                      comm.status === 'CONFIRMED' ? styles.pillConfirmed : styles.pillCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillSmallText,
                        comm.status === 'CONFIRMED' ? styles.textConfirmed : styles.textCancelled,
                      ]}
                    >
                      {comm.status === 'CONFIRMED' ? 'En Route' : 'Cancelled'}
                    </Text>
                  </View>
                </View>
              ))
            ) : null}
          </View>
        </Card>

        {/* SECTION 4: NEARBY RESPONSE POOL */}
        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.poolHeader}>
            <View>
              <Text style={styles.cardHeaderTitle}>Nearby Volunteer Candidates</Text>
              <Text style={styles.poolSubtitle}>
                {request.matchedCandidates?.length || 0} eligible candidates in vicinity
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Icon name="shield" size={12} color="#0D9488" strokeWidth={2} />
              <Text style={styles.verifiedBadgeText}>Privacy Protected</Text>
            </View>
          </View>

          {request.matchedCandidates?.map((cand, idx) => {
            const isNotified = cand.status === 'NOTIFIED';
            const isCancelled = cand.status === 'CANCELLED_GAP_FULFILLED';
            const isAccepted = cand.status === 'ACCEPTED';

            return (
              <View key={cand.donorId} style={styles.candidateRow}>
                <View style={styles.candidateLeft}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankNum}>#{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.candName}>{cand.donorName}</Text>
                    <Text style={styles.candSub}>
                      {cand.bloodGroup} • {cand.distanceKm} km away
                    </Text>
                  </View>
                </View>

                {isCancelled ? (
                  <View style={styles.tagCancelled}>
                    <Text style={styles.tagCancelledText}>Concluded</Text>
                  </View>
                ) : isAccepted ? (
                  <View style={styles.tagConfirmed}>
                    <Text style={styles.tagConfirmedText}>Checked In</Text>
                  </View>
                ) : isNotified ? (
                  <View style={styles.tagAlerted}>
                    <Text style={styles.tagAlertedText}>Alerted</Text>
                  </View>
                ) : (
                  <StatusBadge value={cand.status} />
                )}
              </View>
            );
          })}
        </Card>

        {/* SECTION 5: CLINICAL REQUISITION SPECS */}
        <Card variant="outlined" style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Requisition Specifications</Text>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Required Blood Type</Text>
            <Text style={styles.specValue}>{request.bloodGroup}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Component</Text>
            <Text style={styles.specValue}>{request.component.replace('_', ' ')}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Search Radius</Text>
            <Text style={styles.specValue}>{request.searchRadiusKm} km</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Priority Level</Text>
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

        {/* SECTION 6: COLLAPSIBLE TESTING & DEMONSTRATION DRAWER */}
        <View style={styles.drawerWrap}>
          <TouchableOpacity
            style={styles.drawerHeader}
            onPress={() => setShowSimDrawer(!showSimDrawer)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="sparkles" size={14} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.drawerHeaderText}>
                {showSimDrawer ? 'Hide Evaluation Controls' : 'Show Evaluation & Demo Controls'}
              </Text>
            </View>
            <Icon
              name={showSimDrawer ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textSecondary}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {showSimDrawer && (
            <Card variant="flat" style={styles.simCard}>
              <Text style={styles.simSubtitle}>
                Simulate live emergency responses for presentation review:
              </Text>

              <View style={styles.simBtnGrid}>
                <TouchableOpacity
                  style={[styles.simBtn, styles.btnGreen]}
                  onPress={handleReserveInventory}
                  disabled={simulating}
                >
                  <Text style={styles.btnGreenText}>+ Lock Bank Unit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simBtn, styles.btnGray]}
                  onPress={handleReleaseInventory}
                  disabled={simulating || IR === 0}
                >
                  <Text style={styles.btnGrayText}>− Release Bank Unit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simBtn, styles.btnBlue]}
                  onPress={handleSimulateDonorAccept}
                  disabled={simulating}
                >
                  <Text style={styles.btnBlueText}>+ Simulate Donor Check-In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simBtn, styles.btnRed]}
                  onPress={handleSimulateDonorCancel}
                  disabled={simulating || DC === 0}
                >
                  <Text style={styles.btnRedText}>− Simulate Cancellation</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notFoundText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fulfilledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    gap: spacing.sm,
  },
  fulfilledIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fulfilledTitle: {
    ...typography.caption,
    color: '#065F46',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fulfilledDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
  sectionCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    ...typography.h3,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sourceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sourceIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#0F172A',
  },
  sourceCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  unitChip: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  unitChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  commRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  commName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: '#0F172A',
  },
  commMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statusPillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  pillConfirmed: {
    backgroundColor: '#DBEAFE',
  },
  pillCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusPillSmallText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textConfirmed: {
    color: '#1D4ED8',
  },
  textCancelled: {
    color: '#DC2626',
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  poolSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  candidateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  candName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: '#0F172A',
  },
  candSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tagCancelled: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagCancelledText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tagConfirmed: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagConfirmedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  tagAlerted: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagAlertedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  specLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  specValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: '#0F172A',
  },
  drawerWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  drawerHeaderText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  simCard: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  simBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  simBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGreen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  btnGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  btnGray: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnGrayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  btnBlue: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  btnBlueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  btnRed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  btnRedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
  },
});
