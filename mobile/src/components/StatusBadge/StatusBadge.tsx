import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { UrgencyLevel, RequestState } from '../../types';

export interface StatusBadgeProps {
  label?: string;
  type?: 'urgency' | 'state' | 'eligibility' | 'availability';
  value: UrgencyLevel | RequestState | 'ELIGIBLE' | 'INELIGIBLE' | 'AVAILABLE' | 'UNAVAILABLE' | string;
  style?: StyleProp<ViewStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  value,
  style,
}) => {
  const getColors = (): { bg: string; text: string } => {
    switch (value) {
      case 'CRITICAL':
        return { bg: colors.statusCriticalBg, text: colors.statusCritical };
      case 'URGENT':
        return { bg: colors.statusUrgentBg, text: colors.statusUrgent };
      case 'NORMAL':
        return { bg: colors.statusNormalBg, text: colors.statusNormal };
      case 'ACCEPTED':
      case 'ELIGIBLE':
      case 'AVAILABLE':
        return { bg: colors.statusAcceptedBg, text: colors.statusAccepted };
      case 'NOTIFIED':
      case 'MATCHING':
        return { bg: colors.statusNotifiedBg, text: colors.statusNotified };
      case 'COMPLETED':
        return { bg: colors.statusCompletedBg, text: colors.statusCompleted };
      case 'INELIGIBLE':
      case 'UNAVAILABLE':
      case 'DECLINED':
      case 'CANCELLED':
        return { bg: colors.statusIneligibleBg, text: colors.statusIneligible };
      default:
        return { bg: colors.secondaryLight, text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, { color: text }]}>
        {label || value.replace('_', ' ')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
