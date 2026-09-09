import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, StatusBadge, Button, EmptyState, LoadingState, Header } from '../../components';
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

  const renderRequestCard = ({ item }: { item: BloodRequest }) => {
    // Find candidate record for current donor
    const myCandidateInfo = item.matchedCandidates.find((c) => c.donorId === user?.id);
    const distanceKm = myCandidateInfo ? myCandidateInfo.distanceKm : 1.2;

    return (
      <Card variant="outlined" style={styles.requestCard}>
        <View style={styles.cardHeader}>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalName}>{item.hospitalName}</Text>
            <Text style={styles.hospitalLocation}>
              📍 {item.location?.city || 'Local Emergency Center'} • {distanceKm} km away
            </Text>
          </View>
          <StatusBadge value={item.urgency} />
        </View>

        <View style={styles.divider} />

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

        <View style={styles.actionsRow}>
          <Button
            title="Decline"
            variant="outline"
            size="sm"
            onPress={() => handleRespond(item.id, 'DECLINE')}
            disabled={actionLoadingId === item.id}
            style={styles.actionBtn}
          />
          <Button
            title="Accept Request"
            variant="primary"
            size="sm"
            onPress={() => handleRespond(item.id, 'ACCEPT')}
            loading={actionLoadingId === item.id}
            style={styles.actionBtn}
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Emergency Requests" subtitle="Urgent requests matching your profile" />
      {loading ? (
        <LoadingState message="Checking nearby emergency requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Pending Emergency Requests"
          description="You will be notified immediately when a nearby hospital requires your blood group."
          actionTitle="Refresh"
          onAction={fetchRequests}
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
  },
  requestCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hospitalInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  hospitalName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  hospitalLocation: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  bloodInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bloodGroupBadge: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodGroupText: {
    color: colors.textInverse,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  unitsInfo: {
    flex: 1,
  },
  unitsCount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  componentType: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  notesText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
