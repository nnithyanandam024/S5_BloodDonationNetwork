import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button, StatusBadge, Icon } from '../../components';
import { useAuth } from '../../store/AuthContext';
import Svg, { Rect } from 'react-native-svg';

// High-fidelity SVG QR Code component for Hospital Facility Verification
const SvgQRCode = ({ size = 80, color = '#FFFFFF' }: { size?: number; color?: string }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="5" y="5" width="30" height="30" rx="4" fill="none" stroke={color} strokeWidth="6" />
      <Rect x="14" y="14" width="12" height="12" rx="2" fill={color} />
      <Rect x="65" y="5" width="30" height="30" rx="4" fill="none" stroke={color} strokeWidth="6" />
      <Rect x="74" y="14" width="12" height="12" rx="2" fill={color} />
      <Rect x="5" y="65" width="30" height="30" rx="4" fill="none" stroke={color} strokeWidth="6" />
      <Rect x="14" y="74" width="12" height="12" rx="2" fill={color} />

      <Rect x="42" y="10" width="8" height="8" rx="2" fill={color} />
      <Rect x="52" y="18" width="6" height="6" rx="1.5" fill={color} />
      <Rect x="42" y="26" width="8" height="8" rx="2" fill={color} />
      <Rect x="12" y="44" width="8" height="8" rx="2" fill={color} />
      <Rect x="26" y="44" width="6" height="6" rx="1.5" fill={color} />
      <Rect x="42" y="42" width="16" height="16" rx="3" fill={color} />
      <Rect x="64" y="42" width="10" height="8" rx="2" fill={color} />
      <Rect x="80" y="44" width="12" height="6" rx="1.5" fill={color} />
      <Rect x="44" y="66" width="8" height="12" rx="2" fill={color} />
      <Rect x="58" y="64" width="12" height="8" rx="2" fill={color} />
      <Rect x="76" y="62" width="16" height="12" rx="3" fill={color} />
      <Rect x="54" y="80" width="10" height="12" rx="2" fill={color} />
      <Rect x="70" y="82" width="8" height="10" rx="2" fill={color} />
      <Rect x="84" y="80" width="8" height="12" rx="2" fill={color} />
    </Svg>
  );
};

export const HospitalProfileScreen = ({ navigation }: any) => {
  const { user, logout, switchUserRole } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const facilityId = user?.id ? `HOSP-${user.id.substring(0, 8).toUpperCase()}` : 'HOSP-BLR-8890';
  const hospitalName = user?.hospitalName || user?.name || 'City Care Super Specialty Hospital';
  const directorName = user?.name || 'Dr. Ramesh Rao';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenCenterTitle}>Hospital Facility Pass</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconCircleBtn}>
            <Icon name="bell" size={20} color="#1F2937" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Top Profile Banner Row */}
        <View style={styles.profileBannerRow}>
          <View style={styles.profileLeftBox}>
            <Text style={styles.profileName}>{hospitalName.split(' ').slice(0, 2).join(' ')}</Text>
            <Text style={styles.profileName}>{hospitalName.split(' ').slice(2).join(' ') || 'Center'}</Text>
            <Text style={styles.profileDob}>
              {user?.licenseNumber || 'License: HOSP-BLR-2024-889'}
            </Text>

            {/* Verification Badges */}
            <View style={styles.profileAvatarRow}>
              <View style={[styles.miniAvatar, { backgroundColor: '#C7D2FE', zIndex: 4 }]}>
                <Text style={styles.miniAvatarText}>ICU</Text>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#FDE68A', zIndex: 3, marginLeft: -8 }]}>
                <Text style={styles.miniAvatarText}>OT</Text>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#FECDD3', zIndex: 2, marginLeft: -8 }]}>
                <Text style={styles.miniAvatarText}>BLR</Text>
              </View>
              <View style={styles.networkCountBadge}>
                <Text style={styles.networkCountText}>Active</Text>
              </View>
            </View>
          </View>

          {/* Verification Badge */}
          <View style={styles.profileCardRight}>
            <View style={styles.starCircle}>
              <Icon name="sparkles" size={14} color="#7047EB" strokeWidth={2.5} />
            </View>
            <View style={styles.verifiedChip}>
              <Text style={styles.verifiedChipText}>VERIFIED</Text>
            </View>
          </View>
        </View>

        {/* Purple Hero Pass Card */}
        <View style={styles.purplePassCard}>
          <View style={styles.passTopRow}>
            <View style={styles.passIconSquircle}>
              <Icon name="hospital" size={22} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passHeaderTitle}>Emergency Trauma Network</Text>
              <Text style={styles.passHeaderSub}>NABH Accredited • Level 1 Center</Text>
            </View>
            <View style={styles.qrCodeBox}>
              <SvgQRCode size={48} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.passDivider} />

          <View style={styles.passDetailGrid}>
            <View style={styles.passCol}>
              <Text style={styles.passLabel}>Chief Officer</Text>
              <Text style={styles.passValue}>{directorName}</Text>
            </View>
            <View style={styles.passCol}>
              <Text style={styles.passLabel}>Emergency Hotline</Text>
              <Text style={styles.passValue}>{user?.phone || '+91 80 2345 6789'}</Text>
            </View>
          </View>

          <View style={styles.passBottomRow}>
            <View>
              <Text style={styles.passLabel}>Registry ID</Text>
              <Text style={styles.passIdText}>{facilityId}</Text>
            </View>
            <View style={styles.passStatusPill}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.passStatusText}>DISPATCH READY</Text>
            </View>
          </View>
        </View>

        {/* Operational Statistics */}
        <Text style={styles.sectionHeaderTitle}>Operational Metrics</Text>
        <View style={styles.statsRow}>
          <Card variant="flat" style={styles.statCard}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </Card>
          <Card variant="flat" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#7047EB' }]}>15 km</Text>
            <Text style={styles.statLabel}>Radar Coverage</Text>
          </Card>
          <Card variant="flat" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>24/7</Text>
            <Text style={styles.statLabel}>Blood Bank</Text>
          </Card>
        </View>

        {/* Facility Details Card */}
        <Card variant="outlined" style={styles.facilityCard}>
          <Text style={styles.cardHeaderTitle}>Center Information</Text>

          <View style={styles.infoRow}>
            <Icon name="location-pin" size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>
              {user?.location?.address || 'Residency Road, Bengaluru'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="mail" size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email || 'hospital@citycare.org'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="shield" size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.infoLabel}>Accreditation:</Text>
            <Text style={styles.infoValue}>NABH & State Blood Council</Text>
          </View>
        </Card>

        {/* Presentation Switch Role Demo */}
        <Card variant="flat" style={styles.demoCard}>
          <Text style={styles.demoTitle}>Presentation Quick-Switch</Text>
          <Text style={styles.demoDesc}>
            Switch to the Donor view instantly without logging out:
          </Text>
          <Button
            title="Switch to Donor Dashboard"
            variant="outline"
            size="sm"
            onPress={() => switchUserRole('DONOR')}
            style={{ marginTop: 8 }}
          />
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.signOutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenCenterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  profileBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  profileLeftBox: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
  },
  profileDob: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 14,
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  miniAvatarText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1F2937',
  },
  networkCountBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 6,
  },
  networkCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  profileCardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  starCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  verifiedChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  purplePassCard: {
    backgroundColor: '#7047EB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  passTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passIconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  passHeaderSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  qrCodeBox: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 16,
  },
  passDetailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  passCol: {
    flex: 1,
  },
  passLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 3,
  },
  passValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  passBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  passStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  passStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F1F7',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  facilityCard: {
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#F0F1F7',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  demoCard: {
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: '#F3EFFF',
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7047EB',
  },
  demoDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  signOutBtn: {
    borderColor: '#FCA5A5',
    marginBottom: 20,
  },
});
