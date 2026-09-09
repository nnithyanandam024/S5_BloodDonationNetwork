import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button, Header, StatusBadge } from '../../components';
import { useAuth } from '../../store/AuthContext';

export const DonorProfileScreen = () => {
  const { user, logout, switchUserRole } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="My Profile" subtitle="Personal and medical details" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card variant="outlined" style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge value={user?.bloodGroup || 'O+'} label={`Blood Group ${user?.bloodGroup || 'O+'}`} />
            <StatusBadge
              value={user?.isAvailable !== false ? 'AVAILABLE' : 'UNAVAILABLE'}
              label={user?.isAvailable !== false ? 'Available' : 'Unavailable'}
            />
          </View>
        </Card>

        <Card variant="outlined">
          <Text style={styles.sectionTitle}>Contact & Location</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoVal}>{user?.phone || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City</Text>
            <Text style={styles.infoVal}>{user?.location?.city || 'Bengaluru'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoVal}>{user?.dateOfBirth || '2000-01-01'}</Text>
          </View>
        </Card>

        {/* Demo Switch for Project Demonstration */}
        <Card variant="flat" style={styles.demoCard}>
          <Text style={styles.demoTitle}>Presentation Quick-Switch</Text>
          <Text style={styles.demoDesc}>
            Switch role to Hospital dashboard without logging out:
          </Text>
          <Button
            title="Switch to Hospital View"
            onPress={() => switchUserRole('HOSPITAL')}
            variant="secondary"
            size="sm"
          />
        </Card>

        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  name: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  email: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  demoCard: {
    marginVertical: spacing.md,
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
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
});
