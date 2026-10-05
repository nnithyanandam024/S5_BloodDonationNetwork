import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, EmptyState, LoadingState, Icon } from '../../components';
import { donorsApi } from '../../services/api';
import { BloodRequest } from '../../types';
import { useAuth } from '../../store/AuthContext';

export const DonorRequestsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
        action === 'ACCEPT' ? 'Request Accepted' : 'Request Declined',
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
      {/* Top Header matching Reference Screen 2 */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconCircleBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="arrow-left" size={18} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.screenCenterTitle}>Instant Services</Text>
        <TouchableOpacity activeOpacity={0.8} style={styles.iconCircleBtn}>
          <Icon name="bell" size={20} color="#1F2937" strokeWidth={1.8} />
          {requests.length > 0 && <View style={styles.redDotBadge} />}
        </TouchableOpacity>
      </View>

      {/* Live Well & Yield Rewards Cards Row */}
      <Text style={styles.sectionHeaderTitle}>Live Network & Yield Impact</Text>
      <View style={styles.rewardsRow}>
        {/* Left Card: Medical Advisors */}
        <View style={styles.agentsCard}>
          <View style={styles.starBadgeRow}>
            <View style={styles.starIconBox}>
              <Icon name="star" size={14} color="#F59E0B" strokeWidth={2} />
            </View>
            <Text style={styles.agentsCardTitle}>Medical Advisors</Text>
          </View>
          <Text style={styles.agentsCardSubtitle}>
            Connect with verified hospital hematologists & donation coordinators
          </Text>

          {/* Overlapping circular avatars */}
          <View style={styles.avatarStackRow}>
            <View style={[styles.stackAvatar, { backgroundColor: '#FDE68A', zIndex: 4 }]}>
              <Text style={styles.stackAvatarText}>D</Text>
            </View>
            <View style={[styles.stackAvatar, { backgroundColor: '#FED7AA', zIndex: 3, marginLeft: -12 }]}>
              <Text style={styles.stackAvatarText}>R</Text>
            </View>
            <View style={[styles.stackAvatar, { backgroundColor: '#DDD6FE', zIndex: 2, marginLeft: -12 }]}>
              <Text style={styles.stackAvatarText}>S</Text>
            </View>
            <View style={[styles.stackAvatarBadge, { zIndex: 1, marginLeft: -12 }]}>
              <Text style={styles.stackAvatarBadgeText}>+20</Text>
            </View>
          </View>
        </View>

        {/* Right Card: Chat with expert */}
        <View style={styles.expertCard}>
          <View style={styles.expertChatIconBox}>
            <Icon name="chat" size={20} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.expertCardTitle}>Emergency</Text>
          <Text style={styles.expertCardTitle}>Hotline</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.messageNowBtn}
            onPress={() => Alert.alert('Emergency Support', 'Connecting to 24/7 Blood Coordination Desk...')}
          >
            <Text style={styles.messageNowText}>Connect Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Urgent Requests</Text>
        <Text style={styles.requestsCountBadge}>{requests.length} Active</Text>
      </View>
    </View>
  );

  const renderRequestCard = ({ item }: { item: BloodRequest }) => {
    const myCandidateInfo = item.matchedCandidates.find((c) => c.donorId === user?.id);
    const distanceKm = myCandidateInfo ? myCandidateInfo.distanceKm : 1.2;

    return (
      <View style={styles.requestCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalName}>{item.hospitalName}</Text>
            <View style={styles.locationRow}>
              <Icon name="location-pin" size={13} color="#6B7280" strokeWidth={2} />
              <Text style={styles.hospitalLocation}>
                {item.location?.city || 'Emergency Care Center'} • {distanceKm} km away
              </Text>
            </View>
          </View>
          <StatusBadge value={item.urgency} />
        </View>

        <View style={styles.cardDivider} />

        {/* Blood Details */}
        <View style={styles.bloodInfoRow}>
          <View style={styles.bloodGroupBadge}>
            <Text style={styles.bloodGroupText}>{item.bloodGroup}</Text>
          </View>
          <View style={styles.unitsInfo}>
            <Text style={styles.unitsCount}>{item.unitsRequired} Units Required</Text>
            <Text style={styles.componentType}>{item.component.replace('_', ' ')}</Text>
          </View>
        </View>

        {item.notes ? (
          <Text style={styles.notesText}>Note: "{item.notes}"</Text>
        ) : null}

        {/* Action Buttons */}
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
              {actionLoadingId === item.id ? 'Processing...' : 'Accept Request'}
            </Text>
            <Icon name="arrow-right" size={14} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
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
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No Pending Emergency Requests"
              description="You will be notified immediately when a nearby hospital requires your blood group."
              actionTitle="Check Again"
              onAction={fetchRequests}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchRequests();
              }}
            />
          }
        />
      )}
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
  redDotBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },

  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  agentsCard: {
    flex: 1.4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  starBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  starIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentsCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  agentsCardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  stackAvatarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  expertCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  expertChatIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7047EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  expertCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  messageNowBtn: {
    marginTop: 10,
  },
  messageNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7047EB',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  requestsCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7047EB',
    backgroundColor: '#F3EFFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },

  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hospitalInfo: {
    flex: 1,
    marginRight: 10,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hospitalLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  bloodInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bloodGroupBadge: {
    backgroundColor: '#7047EB',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodGroupText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  unitsInfo: {
    flex: 1,
  },
  unitsCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  componentType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  notesText: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  acceptBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#7047EB',
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
