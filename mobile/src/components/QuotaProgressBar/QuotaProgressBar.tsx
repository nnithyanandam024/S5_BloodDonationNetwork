import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

export interface QuotaProgressBarProps {
  totalRequired: number;
  reservedInventory: number;
  confirmedDonors: number;
  remainingNeeded: number;
  isFulfilled?: boolean;
}

export const QuotaProgressBar: React.FC<QuotaProgressBarProps> = ({
  totalRequired,
  reservedInventory,
  confirmedDonors,
  remainingNeeded,
  isFulfilled = false,
}) => {
  const total = Math.max(1, totalRequired);
  const secured = reservedInventory + confirmedDonors;
  const pctSecured = Math.min(100, Math.round((secured / total) * 100));

  const invFlex = Math.max(0, reservedInventory);
  const donorFlex = Math.max(0, confirmedDonors);
  const pendingFlex = Math.max(0, remainingNeeded);

  return (
    <View style={styles.container}>
      {/* Header with Title and Progress Count */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Fulfillment Progress</Text>
          <Text style={styles.subtitle}>
            {secured} of {totalRequired} units secured
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            isFulfilled ? styles.statusPillFulfilled : styles.statusPillActive,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isFulfilled ? styles.dotFulfilled : styles.dotActive,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              isFulfilled ? styles.textFulfilled : styles.textActive,
            ]}
          >
            {isFulfilled ? 'Fully Secured' : `${pctSecured}% Ready`}
          </Text>
        </View>
      </View>

      {/* Multi-Segment Track */}
      <View style={styles.track}>
        {invFlex > 0 && (
          <View
            style={[
              styles.segment,
              styles.segmentInventory,
              { flex: invFlex },
              secured === totalRequired && donorFlex === 0 ? styles.roundedFull : undefined,
            ]}
          />
        )}
        {donorFlex > 0 && (
          <View
            style={[
              styles.segment,
              styles.segmentDonor,
              { flex: donorFlex },
              secured === totalRequired && invFlex === 0 ? styles.roundedFull : undefined,
            ]}
          />
        )}
        {pendingFlex > 0 && (
          <View style={[styles.segment, styles.segmentPending, { flex: pendingFlex }]} />
        )}
      </View>

      {/* Legend & Breakdown Tags */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotInventory]} />
          <Text style={styles.legendLabel}>
            {reservedInventory} Bank {reservedInventory === 1 ? 'Unit' : 'Units'}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotDonor]} />
          <Text style={styles.legendLabel}>
            {confirmedDonors} {confirmedDonors === 1 ? 'Donor' : 'Donors'} En Route
          </Text>
        </View>
        {remainingNeeded > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotPending]} />
            <Text style={styles.legendLabel}>
              {remainingNeeded} {remainingNeeded === 1 ? 'Unit' : 'Units'} Needed
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: 2,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  statusPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  statusPillFulfilled: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#2563EB',
  },
  dotFulfilled: {
    backgroundColor: '#059669',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
  textActive: {
    color: '#1D4ED8',
  },
  textFulfilled: {
    color: '#047857',
  },
  track: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  segment: {
    height: '100%',
  },
  segmentInventory: {
    backgroundColor: '#0D9488', // Emerald/Teal for Bank Stock
  },
  segmentDonor: {
    backgroundColor: '#2563EB', // Blue for En Route Donors
  },
  segmentPending: {
    backgroundColor: '#E2E8F0', // Neutral light grey for remaining
  },
  roundedFull: {
    borderRadius: borderRadius.full,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotInventory: {
    backgroundColor: '#0D9488',
  },
  dotDonor: {
    backgroundColor: '#2563EB',
  },
  dotPending: {
    backgroundColor: '#CBD5E1',
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
