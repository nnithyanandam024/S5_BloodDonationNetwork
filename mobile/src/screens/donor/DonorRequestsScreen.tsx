import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal as RNModal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, EmptyState, LoadingState, Icon, FastTrackBadge } from '../../components';
import { donorsApi } from '../../services/api';
import { BloodRequest } from '../../types';
import { useAuth } from '../../store/AuthContext';

export const DonorRequestsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activePassRequest, setActivePassRequest] = useState<BloodRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await donorsApi.getIncomingRequests();
      setRequests(res.requests || []);
    } catch (err: any) {
      console.error('Failed to load incoming requests:', err);
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

  const handleRespond = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    setActionLoadingId(requestId);
    try {
      const res = await donorsApi.respondToRequest(requestId, action);
      Alert.alert(
        action === 'ACCEPT' ? 'Request Confirmed' : 'Request Declined',
        res.message
      );
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Could not process response');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderHeaderComponent = () => (
    <View style={styles.topSection}>
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Urgent Requisitions</Text>
          <Text style={styles.screenSubtitle}>Nearby verified hospital emergencies</Text>
        </View>
        <View style={styles.activePill}>
          <View style={styles.pulseDot} />
          <Text style={styles.activePillText}>{requests.length} Available</Text>
        </View>
      </View>

      {/* Emergency Assurance Banner */}
      <View style={styles.assuranceBanner}>
        <View style={styles.shieldIcon}>
          <Icon name="shield" size={18} color="#0D9488" strokeWidth={2.2} />
        </View>
        <View style={styles.assuranceTextContainer}>
          <Text style={styles.assuranceTitle}>Private & Verified Dispatch</Text>
          <Text style={styles.assuranceDesc}>
            Your exact residential coordinates are never shared. Verified intake pass issued upon response.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRequestCard = ({ item }: { item: BloodRequest }) => {
    const myCandidateInfo = item.matchedCandidates?.find((c) => c.donorId === user?.id);
    const distanceKm = myCandidateInfo?.distanceKm ? myCandidateInfo.distanceKm.toFixed(1) : '2.1';
    const isAccepted = myCandidateInfo?.status === 'ACCEPTED' || (item.donorCommitments || []).some(c => c.donorId === user?.id && c.status === 'CONFIRMED');
    const isClosed = myCandidateInfo?.status === 'CANCELLED_GAP_FULFILLED' || item.remainingGap === 0;

    return (
      <View style={styles.requestCard}>
        {/* Card Top: Hospital & Urgency */}
        <View style={styles.cardHeader}>
          <View style={styles.hospitalMeta}>
            <Text style={styles.hospitalName}>{item.hospitalName}</Text>
            <View style={styles.locationRow}>
              <Icon name="location-pin" size={13} color="#64748B" strokeWidth={2} />
              <Text style={styles.hospitalLocation}>
                {item.location?.city || 'Medical Center'} • {distanceKm} km away
              </Text>
            </View>
          </View>
          <StatusBadge value={item.urgency} />
        </View>

        {/* Blood Component Need Row */}
        <View style={styles.bloodInfoRow}>
          <View style={styles.bloodGroupBadge}>
            <Text style={styles.bloodGroupText}>{item.bloodGroup}</Text>
          </View>
          <View style={styles.unitsInfo}>
            <Text style={styles.unitsCount}>
              {item.remainingGap !== undefined ? `${item.remainingGap} Units Still Needed` : `${item.unitsRequired} Units Required`}
            </Text>
            <Text style={styles.componentType}>
              {item.component ? item.component.replace('_', ' ') : 'Whole Blood'}
            </Text>
          </View>

          {/* Quick Intake Pass Button if accepted */}
          {isAccepted && (
            <TouchableOpacity
              style={styles.viewPassBtn}
              onPress={() => setActivePassRequest(item)}
            >
              <Icon name="shield" size={14} color="#0D9488" strokeWidth={2} />
              <Text style={styles.viewPassText}>Intake Pass</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.notes ? (
          <Text style={styles.notesText}>Note: "{item.notes}"</Text>
        ) : null}

        {/* State Banners or Action Buttons */}
        {isClosed && !isAccepted ? (
          <View style={styles.fulfilledTerminationBox}>
            <Icon name="check" size={16} color="#059669" strokeWidth={2.2} />
            <Text style={styles.fulfilledTerminationText}>
              Requirement Met — Another volunteer or reserve checked in first. Thank you for your readiness!
            </Text>
          </View>
        ) : isAccepted ? (
          <View style={styles.acceptedConfirmationBox}>
            <Icon name="check" size={16} color="#0D9488" strokeWidth={2.4} />
            <Text style={styles.acceptedConfirmationText}>
              You are confirmed for this emergency. Please proceed to intake.
            </Text>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleRespond(item.id, 'DECLINE')}
              disabled={actionLoadingId === item.id}
              style={styles.declineBtn}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleRespond(item.id, 'ACCEPT')}
              disabled={actionLoadingId === item.id}
              style={styles.acceptBtn}
            >
              <Text style={styles.acceptBtnText}>
                {actionLoadingId === item.id ? 'Confirming...' : 'Accept Emergency'}
              </Text>
              <Icon name="arrow-right" size={14} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {loading ? (
        <LoadingState message="Checking nearby emergency requests..." />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeaderComponent}
          renderItem={renderRequestCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchRequests} colors={['#DC2626']} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Urgent Requisitions"
              description="There are currently no active emergency blood requisitions in your vicinity."
            />
          }
        />
      )}

      {/* Fast-Track Digital Pass Modal */}
      <RNModal
        visible={!!activePassRequest}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePassRequest(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActivePassRequest(null)}
        >
          <View style={styles.modalCardWrap}>
            {activePassRequest && (
              <FastTrackBadge
                donorName={user?.name || 'Verified Donor'}
                bloodGroup={activePassRequest.bloodGroup}
                requestId={activePassRequest.id}
                hospitalName={activePassRequest.hospitalName}
              />
            )}
            <TouchableOpacity
              style={styles.closePassBtn}
              onPress={() => setActivePassRequest(null)}
            >
              <Text style={styles.closePassText}>Close Pass</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </RNModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topSection: {
    marginBottom: spacing.md,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  screenTitle: {
    ...typography.h2,
    color: '#0F172A',
    fontWeight: '800',
  },
  screenSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  activePillText: {
    ...typography.caption,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  assuranceBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  shieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assuranceTextContainer: {
    flex: 1,
  },
  assuranceTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: '#0F766E',
  },
  assuranceDesc: {
    fontSize: 11,
    color: '#115E59',
    marginTop: 1,
    lineHeight: 15,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  hospitalMeta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  hospitalName: {
    ...typography.h3,
    color: '#0F172A',
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  hospitalLocation: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bloodInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bloodGroupBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  bloodGroupText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  unitsInfo: {
    flex: 1,
  },
  unitsCount: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#0F172A',
  },
  componentType: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  viewPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  viewPassText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  notesText: {
    ...typography.caption,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fulfilledTerminationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  fulfilledTerminationText: {
    ...typography.caption,
    color: '#065F46',
    flex: 1,
    fontWeight: '600',
  },
  acceptedConfirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  acceptedConfirmationText: {
    ...typography.caption,
    color: '#0F766E',
    flex: 1,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCardWrap: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  closePassBtn: {
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closePassText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

