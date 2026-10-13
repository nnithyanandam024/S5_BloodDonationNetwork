import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Icon } from '../../components/Icon/Icon';
import { useNotification } from '../../store/NotificationContext';
import { useAuth } from '../../store/AuthContext';
import { AppNotification } from '../../types';

export const NotificationsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } =
    useNotification();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (item: AppNotification) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }

    if (item.requestId) {
      if (user?.role === 'HOSPITAL') {
        navigation.navigate('RequestDetails', { requestId: item.requestId });
      } else {
        navigation.navigate('Requests');
      }
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffMin = Math.floor((now - past) / (1000 * 60));

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getNotificationVisuals = (item: AppNotification) => {
    switch (item.type) {
      case 'DISPATCH_INVITE':
        return {
          icon: 'alert-siren' as const,
          iconColor: colors.primary,
          bg: '#FEF2F2',
          badgeText: 'Emergency Dispatch',
        };
      case 'DONOR_COMMITTED':
        return {
          icon: 'heart' as const,
          iconColor: colors.primary,
          bg: '#FFF1F2',
          badgeText: 'Donor En Route',
        };
      case 'GAP_FULFILLED':
        return {
          icon: 'check' as const,
          iconColor: '#059669',
          bg: '#ECFDF5',
          badgeText: 'Fulfilled',
        };
      case 'DONATION_CONFIRMED':
        return {
          icon: 'droplet' as const,
          iconColor: colors.violetPrimary,
          bg: '#F5F3FF',
          badgeText: 'Donation Confirmed',
        };
      default:
        return {
          icon: 'bell' as const,
          iconColor: '#3B82F6',
          bg: '#EFF6FF',
          badgeText: 'Update',
        };
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const visual = getNotificationVisuals(item);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.itemCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconCircle, { backgroundColor: visual.bg }]}>
          <Icon name={visual.icon} size={20} color={visual.iconColor} strokeWidth={2} />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: visual.bg }]}>
                <Text style={[styles.typeBadgeText, { color: visual.iconColor }]}>
                  {visual.badgeText}
                </Text>
              </View>
              {item.bloodGroup && (
                <View style={styles.bloodTag}>
                  <Text style={styles.bloodTagText}>{item.bloodGroup}</Text>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>

          <Text style={[styles.itemTitle, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.itemBody} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.markReadBtn}
            onPress={markAllAsRead}
          >
            <Text style={styles.markReadText}>Mark read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Icon name="bell" size={32} color="#9CA3AF" strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! Emergency blood requests and live updates will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 18,
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  markReadText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  unreadCard: {
    backgroundColor: '#FAFAFF',
    borderColor: '#E0E7FF',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bloodTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  bloodTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  unreadTitle: {
    color: '#111827',
    fontWeight: '700',
  },
  itemBody: {
    ...typography.bodySmall,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: 14,
    right: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.h3,
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 6,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
