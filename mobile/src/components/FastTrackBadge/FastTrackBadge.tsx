import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '../../theme';

export interface FastTrackBadgeProps {
  donorName: string;
  bloodGroup: string;
  requestId: string;
  hospitalName?: string;
  token?: string;
  size?: number;
}

export const FastTrackBadge: React.FC<FastTrackBadgeProps> = ({
  donorName,
  bloodGroup,
  requestId,
  hospitalName = 'Emergency Medical Center',
  token,
  size = 120,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>FAST-TRACK INTAKE PASS</Text>
        </View>
        <Text style={styles.hospitalText}>{hospitalName}</Text>
      </View>

      {/* SVG QR Matrix Simulation */}
      <View style={styles.qrContainer}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Top-left corner */}
          <Rect x="5" y="5" width="28" height="28" rx="4" fill="none" stroke="#0F172A" strokeWidth="5" />
          <Rect x="13" y="13" width="12" height="12" rx="2" fill="#0F172A" />

          {/* Top-right corner */}
          <Rect x="67" y="5" width="28" height="28" rx="4" fill="none" stroke="#0F172A" strokeWidth="5" />
          <Rect x="75" y="13" width="12" height="12" rx="2" fill="#0F172A" />

          {/* Bottom-left corner */}
          <Rect x="5" y="67" width="28" height="28" rx="4" fill="none" stroke="#0F172A" strokeWidth="5" />
          <Rect x="13" y="75" width="12" height="12" rx="2" fill="#0F172A" />

          {/* Data Pattern Nodes */}
          <Rect x="42" y="10" width="8" height="8" rx="2" fill="#0F172A" />
          <Rect x="52" y="18" width="6" height="6" rx="1" fill="#0F172A" />
          <Rect x="42" y="26" width="8" height="8" rx="2" fill="#0F172A" />
          <Rect x="12" y="44" width="8" height="8" rx="2" fill="#0F172A" />
          <Rect x="26" y="44" width="6" height="6" rx="1" fill="#0F172A" />
          <Rect x="42" y="42" width="16" height="16" rx="3" fill="#DC2626" />
          <Rect x="64" y="42" width="10" height="8" rx="2" fill="#0F172A" />
          <Rect x="80" y="44" width="12" height="6" rx="1" fill="#0F172A" />
          <Rect x="44" y="66" width="8" height="12" rx="2" fill="#0F172A" />
          <Rect x="58" y="64" width="12" height="8" rx="2" fill="#0F172A" />
          <Rect x="76" y="62" width="16" height="12" rx="3" fill="#0F172A" />
          <Rect x="54" y="80" width="10" height="12" rx="2" fill="#0F172A" />
          <Rect x="70" y="82" width="8" height="10" rx="2" fill="#0F172A" />
          <Rect x="84" y="80" width="8" height="12" rx="2" fill="#0F172A" />
        </Svg>
      </View>

      {/* Donor & Pass Details */}
      <View style={styles.footer}>
        <View style={styles.donorRow}>
          <Text style={styles.donorName}>{donorName}</Text>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{bloodGroup}</Text>
          </View>
        </View>
        <Text style={styles.refCode}>Pass ID: {requestId}</Text>
        <Text style={styles.scanNotice}>Present at Emergency Desk for priority reception</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgePill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: 4,
  },
  badgePillText: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  hospitalText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
    width: '100%',
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  donorName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  bloodBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  bloodText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  refCode: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  scanNotice: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
