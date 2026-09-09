import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme';
import { Card, Header, Button } from '../../components';
import { BloodGroup } from '../../types';
import { useAuth } from '../../store/AuthContext';

interface InventoryEntry {
  group: BloodGroup;
  units: number;
  status: 'OPTIMAL' | 'LOW' | 'CRITICAL';
}

const SAMPLE_INVENTORY: InventoryEntry[] = [
  { group: 'O+', units: 12, status: 'OPTIMAL' },
  { group: 'O-', units: 2, status: 'CRITICAL' },
  { group: 'A+', units: 15, status: 'OPTIMAL' },
  { group: 'A-', units: 3, status: 'LOW' },
  { group: 'B+', units: 8, status: 'OPTIMAL' },
  { group: 'B-', units: 1, status: 'CRITICAL' },
  { group: 'AB+', units: 5, status: 'OPTIMAL' },
  { group: 'AB-', units: 1, status: 'CRITICAL' },
];

export const HospitalInventoryScreen = ({ navigation }: any) => {
  const { logout, switchUserRole } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Blood Bank & Inventory" subtitle="Current on-site reserves" />
      <FlatList
        data={SAMPLE_INVENTORY}
        keyExtractor={(item) => item.group}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isCritical = item.status === 'CRITICAL';
          const isLow = item.status === 'LOW';

          return (
            <Card variant="outlined" style={styles.gridCard}>
              <View style={styles.groupBadge}>
                <Text style={styles.groupText}>{item.group}</Text>
              </View>
              <Text style={styles.unitsNum}>{item.units}</Text>
              <Text style={styles.unitsLabel}>Units in Stock</Text>
              <View
                style={[
                  styles.statusTag,
                  isCritical
                    ? styles.statusTagCritical
                    : isLow
                    ? styles.statusTagLow
                    : styles.statusTagOptimal,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    isCritical
                      ? styles.statusTagTextCritical
                      : isLow
                      ? styles.statusTagTextLow
                      : styles.statusTagTextOptimal,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              title="Request Transfer from Blood Bank"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('CreateRequest')}
              style={styles.transferBtn}
            />

            <Card variant="flat" style={styles.demoCard}>
              <Text style={styles.demoTitle}>Presentation Quick-Switch</Text>
              <Text style={styles.demoDesc}>
                Switch role to Donor dashboard without logging out:
              </Text>
              <Button
                title="Switch to Donor View"
                onPress={() => switchUserRole('DONOR')}
                variant="secondary"
                size="sm"
              />
            </Card>

            <Button
              title="Sign Out"
              variant="outline"
              onPress={logout}
              style={styles.logoutBtn}
            />
          </View>
        }
      />
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
  gridCard: {
    flex: 1,
    margin: spacing.xs,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  groupBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: spacing.xs,
  },
  groupText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  unitsNum: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  unitsLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statusTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusTagOptimal: {
    backgroundColor: colors.statusAcceptedBg,
  },
  statusTagLow: {
    backgroundColor: colors.statusUrgentBg,
  },
  statusTagCritical: {
    backgroundColor: colors.statusCriticalBg,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  statusTagTextOptimal: {
    color: colors.statusAccepted,
  },
  statusTagTextLow: {
    color: colors.statusUrgent,
  },
  statusTagTextCritical: {
    color: colors.statusCritical,
  },
  footer: {
    marginTop: spacing.md,
  },
  transferBtn: {
    marginBottom: spacing.md,
  },
  demoCard: {
    marginBottom: spacing.md,
  },
  demoTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  demoDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  logoutBtn: {
    marginBottom: spacing.xl,
  },
});
