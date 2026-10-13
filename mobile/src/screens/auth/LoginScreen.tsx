import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Input, Button, Card, Icon, BloodGroupSelector } from '../../components';
import { useAuth } from '../../store/AuthContext';

export const LoginScreen = ({ navigation }: any) => {
  const { login, loginWithGoogle, completeGoogleRegistration } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'HOSPITAL' | 'DONOR'>('HOSPITAL');
  const [email, setEmail] = useState('hospital@citycare.org');
  const [password, setPassword] = useState('Password123!');

  // Independent loading states for individual buttons
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Sign-In profile completion modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const [pendingFirebaseIdToken, setPendingFirebaseIdToken] = useState<string>('');
  const [compRole, setCompRole] = useState<'DONOR' | 'HOSPITAL'>('DONOR');
  const [compBloodGroup, setCompBloodGroup] = useState<any>('O+');
  const [compPhone, setCompPhone] = useState('');
  const [compHospitalName, setCompHospitalName] = useState('');
  const [compLicense, setCompLicense] = useState('');

  const handleRoleSelect = (role: 'HOSPITAL' | 'DONOR') => {
    setSelectedRole(role);
    if (role === 'HOSPITAL') {
      setEmail('hospital@citycare.org');
      setPassword('Password123!');
    } else {
      setEmail('john.doe@example.com');
      setPassword('Password123!');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password');
      return;
    }

    try {
      setIsEmailSubmitting(true);
      await login(email.trim(), password.trim());
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'Please check your credentials');
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const res = await loginWithGoogle();
      if (res.isNewUser) {
        setGoogleUserData(res.googleData);
        setPendingFirebaseIdToken(res.firebaseIdToken || '');
        setCompRole(selectedRole);
        if (selectedRole === 'HOSPITAL') {
          setCompHospitalName(res.googleData?.name || '');
        }
        setShowProfileModal(true);
      }
    } catch (err: any) {
      if (err.code === 'SIGN_IN_CANCELLED' || err.message?.includes('cancelled')) {
        return;
      }
      Alert.alert('Google Sign-In Failed', err.message || 'Unable to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!compPhone.trim()) {
      Alert.alert('Phone Required', 'Please enter your contact phone number.');
      return;
    }
    if (compRole === 'HOSPITAL' && !compHospitalName.trim()) {
      Alert.alert('Hospital Name Required', 'Please enter your facility name.');
      return;
    }

    try {
      setGoogleLoading(true);
      await completeGoogleRegistration({
        idToken: pendingFirebaseIdToken,
        role: compRole,
        phone: compPhone.trim(),
        name: compRole === 'HOSPITAL' ? compHospitalName.trim() : (googleUserData?.name || 'Blood Donor'),
        bloodGroup: compBloodGroup,
        hospitalName: compHospitalName.trim(),
        licenseNumber: compLicense.trim() || 'LIC-PENDING',
      });
      setShowProfileModal(false);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not complete registration.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Icon name="droplet" size={32} color="#DC2626" strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>BloodLink</Text>
          <Text style={styles.subtitle}>Emergency Blood Fulfillment Network</Text>
        </View>

        {/* Portal Selector Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, selectedRole === 'HOSPITAL' && styles.tabBtnActive]}
            onPress={() => handleRoleSelect('HOSPITAL')}
            activeOpacity={0.8}
          >
            <Icon
              name="hospital"
              size={18}
              color={selectedRole === 'HOSPITAL' ? '#DC2626' : colors.textSecondary}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.tabText,
                selectedRole === 'HOSPITAL' && styles.tabTextActive,
              ]}
            >
              Hospital Portal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, selectedRole === 'DONOR' && styles.tabBtnActive]}
            onPress={() => handleRoleSelect('DONOR')}
            activeOpacity={0.8}
          >
            <Icon
              name="user"
              size={18}
              color={selectedRole === 'DONOR' ? '#DC2626' : colors.textSecondary}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.tabText,
                selectedRole === 'DONOR' && styles.tabTextActive,
              ]}
            >
              Donor Portal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Sign In Card */}
        <Card variant="outlined" style={styles.formCard}>
          <Text style={styles.formTitle}>
            {selectedRole === 'HOSPITAL' ? 'Hospital Staff Sign In' : 'Donor Member Sign In'}
          </Text>

          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isEmailSubmitting}
            disabled={isEmailSubmitting || googleLoading}
            style={styles.signInBtn}
          />

          {/* Social Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[styles.googleBtn, (isEmailSubmitting || googleLoading) && styles.btnDisabled]}
            onPress={handleGoogleLogin}
            disabled={isEmailSubmitting || googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#1F2937" />
            ) : (
              <View style={styles.googleBtnContent}>
                <Icon name="google" size={18} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.registerPrompt}>
            <Text style={styles.promptText}>New facility or donor? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      {/* New User Profile Completion Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={styles.modalBadge}>
                  <Icon name="sparkles" size={20} color="#DC2626" />
                </View>
                <Text style={styles.modalTitle}>Complete Your Profile</Text>
                <Text style={styles.modalSubtitle}>
                  Signed in as {googleUserData?.email}. Please choose your clinical role to finalize onboarding.
                </Text>
              </View>

              {/* Role Toggle */}
              <View style={styles.modalRoleRow}>
                <TouchableOpacity
                  style={[styles.modalRoleBtn, compRole === 'DONOR' && styles.modalRoleBtnActive]}
                  onPress={() => setCompRole('DONOR')}
                >
                  <Icon
                    name="user"
                    size={16}
                    color={compRole === 'DONOR' ? '#DC2626' : colors.textSecondary}
                  />
                  <Text style={[styles.modalRoleText, compRole === 'DONOR' && styles.modalRoleTextActive]}>
                    Voluntary Donor
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalRoleBtn, compRole === 'HOSPITAL' && styles.modalRoleBtnActive]}
                  onPress={() => setCompRole('HOSPITAL')}
                >
                  <Icon
                    name="hospital"
                    size={16}
                    color={compRole === 'HOSPITAL' ? '#DC2626' : colors.textSecondary}
                  />
                  <Text style={[styles.modalRoleText, compRole === 'HOSPITAL' && styles.modalRoleTextActive]}>
                    Hospital Facility
                  </Text>
                </TouchableOpacity>
              </View>

              {compRole === 'DONOR' ? (
                <>
                  <BloodGroupSelector
                    selected={compBloodGroup}
                    onSelect={(g) => setCompBloodGroup(g)}
                    label="Blood Group"
                  />
                  <Input
                    label="Mobile Phone"
                    placeholder="+91 98765 43210"
                    value={compPhone}
                    onChangeText={setCompPhone}
                    keyboardType="phone-pad"
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Hospital Name"
                    placeholder="e.g. City Care Hospital"
                    value={compHospitalName}
                    onChangeText={setCompHospitalName}
                  />
                  <Input
                    label="Clinical License Number"
                    placeholder="e.g. LIC-BLR-042"
                    value={compLicense}
                    onChangeText={setCompLicense}
                  />
                  <Input
                    label="Emergency Desk Phone"
                    placeholder="+91 80 2234 5678"
                    value={compPhone}
                    onChangeText={setCompPhone}
                    keyboardType="phone-pad"
                  />
                </>
              )}

              <Button
                title="Finish & Enter BloodLink"
                onPress={handleCompleteProfile}
                loading={googleLoading}
                style={styles.modalSubmitBtn}
              />

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: '#0F172A',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.caption,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...typography.body,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  formCard: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    ...typography.h3,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  signInBtn: {
    marginTop: spacing.sm,
    backgroundColor: '#DC2626',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    ...typography.caption,
    color: '#94A3B8',
    marginHorizontal: spacing.sm,
    fontWeight: '600',
  },
  googleBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: '#1E293B',
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  promptText: {
    ...typography.body,
    color: '#64748B',
  },
  linkText: {
    ...typography.body,
    color: '#DC2626',
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    ...typography.h2,
    color: '#0F172A',
    fontWeight: '700',
  },
  modalSubtitle: {
    ...typography.caption,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalRoleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  modalRoleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    gap: 6,
    backgroundColor: '#F8FAFC',
  },
  modalRoleBtnActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  modalRoleText: {
    ...typography.body,
    color: '#64748B',
    fontWeight: '600',
  },
  modalRoleTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  modalSubmitBtn: {
    marginTop: spacing.md,
    backgroundColor: '#DC2626',
  },
  modalCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.body,
    color: '#64748B',
    fontWeight: '600',
  },
});
