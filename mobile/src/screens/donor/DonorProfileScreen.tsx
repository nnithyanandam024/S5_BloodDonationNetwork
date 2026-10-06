import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button, StatusBadge, Icon } from '../../components';
import { useAuth } from '../../store/AuthContext';
import Svg, { Rect, Circle } from 'react-native-svg';

// High-fidelity SVG QR Code component for Digital Donor ID Card
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

export const DonorProfileScreen = ({ navigation }: any) => {
  const { user, logout, switchUserRole } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const donorIdNumber = user?.id ? `DON-${user.id.substring(0, 8).toUpperCase()}` : 'DON-32654762';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenCenterTitle}>Donor Identity Pass</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconCircleBtn}>
            <Icon name="bell" size={20} color="#1F2937" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Top Profile Banner Row - Screen 3 Recreation */}
        <View style={styles.profileBannerRow}>
          <View style={styles.profileLeftBox}>
            <Text style={styles.profileName}>{user?.name?.split(' ')[0] || 'Valued'}</Text>
            <Text style={styles.profileName}>{user?.name?.split(' ')[1] || 'Donor'}</Text>
            <Text style={styles.profileDob}>{user?.dateOfBirth || 'Registered Active Donor'}</Text>

            {/* Donor Network Community Avatar Chips */}
            <View style={styles.profileAvatarRow}>
              <View style={[styles.miniAvatar, { backgroundColor: '#C7D2FE', zIndex: 4 }]}>
                <Text style={styles.miniAvatarText}>O+</Text>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#FDE68A', zIndex: 3, marginLeft: -8 }]}>
                <Text style={styles.miniAvatarText}>A+</Text>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#A7F3D0', zIndex: 2, marginLeft: -8 }]}>
                <Text style={styles.miniAvatarText}>B+</Text>
              </View>
              <View style={[styles.miniAddBtn, { zIndex: 1, marginLeft: -8 }]}>
                <Icon name="droplet" size={12} color="#7047EB" strokeWidth={2.5} />
              </View>
            </View>
          </View>

          {/* Right Portrait & Rings */}
          <View style={styles.profileRightBox}>
            <View style={styles.ringsBadge}>
              <Svg width={36} height={18} viewBox="0 0 38 20">
                <Circle cx="10" cy="10" r="8" stroke="#9CA3AF" strokeWidth="1.5" fill="none" opacity={0.6} />
                <Circle cx="24" cy="10" r="8" stroke="#9CA3AF" strokeWidth="1.5" fill="none" opacity={0.6} />
              </Svg>
              <Text style={styles.ringsText}>Verified (Active)</Text>
            </View>
            <View style={styles.personPhotoMock}>
              <Icon name="user" size={44} color="#7047EB" strokeWidth={1.6} />
            </View>
          </View>
        </View>

        {/* Signature Purple Digital ID Card with QR Code - Exact Screen 3 Style */}
        <View style={styles.purpleIdCard}>
          {/* Top 3 Pills Row */}
          <View style={styles.idCardPillsRow}>
            <View style={styles.idCardPill}>
              <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={styles.idCardPill}>
              <Icon name="shield" size={14} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.idCardPill}>
              <Icon name="dots-horizontal" size={14} color="#FFFFFF" />
            </View>
          </View>

          {/* Body with QR Code */}
          <View style={styles.idCardBodyRow}>
            <View style={styles.idCardInfoLeft}>
              <Text style={styles.idCardLabelTag}>Registry Blood Card</Text>
              <Text style={styles.idCardHeaderTitle}>Donor ID Card</Text>

              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.idSubLabel}>Donor Number</Text>
                <Text style={styles.idSubVal}>{donorIdNumber}</Text>

                <Text style={[styles.idSubLabel, { marginTop: 6 }]}>Blood Group</Text>
                <Text style={styles.idSubVal}>{user?.bloodGroup || 'O-Positive'}</Text>

                <Text style={[styles.idSubLabel, { marginTop: 6 }]}>Location</Text>
                <Text style={styles.idSubVal}>{user?.location?.city || 'Bengaluru, India'}</Text>
              </View>
            </View>

            {/* Crisp High-Res SVG QR Code for Scanning at Blood Banks */}
            <View style={styles.qrContainer}>
              <SvgQRCode size={84} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Contact & Medical Details Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Contact & Location</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <Icon name="phone" size={16} color="#6B7280" strokeWidth={1.8} />
              <Text style={styles.infoLabel}>Phone</Text>
            </View>
            <Text style={styles.infoVal}>{user?.phone || 'Not provided'}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <Icon name="mail" size={16} color="#6B7280" strokeWidth={1.8} />
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <Text style={styles.infoVal}>{user?.email || 'donor@bloodnet.org'}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <Icon name="location-pin" size={16} color="#6B7280" strokeWidth={1.8} />
              <Text style={styles.infoLabel}>City</Text>
            </View>
            <Text style={styles.infoVal}>{user?.location?.city || 'Bengaluru'}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoLabelGroup}>
              <Icon name="calendar" size={16} color="#6B7280" strokeWidth={1.8} />
              <Text style={styles.infoLabel}>Birth Date</Text>
            </View>
            <Text style={styles.infoVal}>{user?.dateOfBirth || '2000-01-01'}</Text>
          </View>
        </View>

        {/* Presentation Switch for Demonstration */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Presentation Role Switch</Text>
          <Text style={styles.demoDesc}>
            Quickly switch between Donor dashboard and Hospital portal:
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => switchUserRole('HOSPITAL')}
            style={styles.switchRoleBtn}
          >
            <Icon name="hospital" size={18} color="#7047EB" strokeWidth={2} />
            <Text style={styles.switchRoleBtnText}>Switch to Hospital View</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} style={styles.logoutBtn}>
          <Icon name="logout" size={18} color="#DC2626" strokeWidth={2} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
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
    paddingBottom: 100,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenCenterTitle: {
    fontSize: 20,
    fontWeight: '800',
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

  profileBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  profileLeftBox: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 26,
  },
  profileDob: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  miniAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    backgroundColor: '#F3EFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRightBox: {
    alignItems: 'flex-end',
  },
  ringsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ringsText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  personPhotoMock: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  purpleIdCard: {
    backgroundColor: '#7047EB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  idCardPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  idCardPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idCardBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  idCardInfoLeft: {
    flex: 1,
  },
  idCardLabelTag: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  idCardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  idSubLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  idSubVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  qrContainer: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  demoDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3EFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 18,
    paddingVertical: 10,
  },
  switchRoleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7047EB',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 18,
    paddingVertical: 12,
    marginBottom: 30,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
