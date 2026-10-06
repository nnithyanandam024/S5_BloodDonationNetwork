import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Input, Button, Card, BloodGroupSelector, Header, Icon } from '../../components';
import { useAuth } from '../../store/AuthContext';
import { BloodGroup, UserRole } from '../../types';

export const RegisterScreen = ({ navigation }: any) => {
  const { register, isLoading } = useAuth();
  const [role, setRole] = useState<UserRole>('DONOR');

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');

  // Donor fields
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [dateOfBirth, setDateOfBirth] = useState('2000-01-01');

  // Hospital fields
  const [hospitalName, setHospitalName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required Information', 'Please complete all mandatory profile fields');
      return;
    }

    try {
      if (role === 'DONOR') {
        await register({
          role: 'DONOR',
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim(),
          bloodGroup,
          dateOfBirth,
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            city: city.trim(),
          },
        });
      } else {
        await register({
          role: 'HOSPITAL',
          name: name.trim(),
          hospitalName: hospitalName.trim() || name.trim(),
          licenseNumber: licenseNumber.trim() || 'LIC-REG-2026',
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim(),
          location: {
            latitude: 12.975,
            longitude: 77.599,
            city: city.trim(),
          },
        });
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not create account');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Create Account" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Role Switcher Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, role === 'DONOR' && styles.tabBtnActive]}
            onPress={() => setRole('DONOR')}
          >
            <Icon
              name="droplet"
              size={18}
              color={role === 'DONOR' ? '#DC2626' : colors.textSecondary}
              strokeWidth={2.2}
            />
            <Text style={[styles.tabText, role === 'DONOR' && styles.tabTextActive]}>
              Volunteer Donor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, role === 'HOSPITAL' && styles.tabBtnActive]}
            onPress={() => setRole('HOSPITAL')}
          >
            <Icon
              name="hospital"
              size={18}
              color={role === 'HOSPITAL' ? '#DC2626' : colors.textSecondary}
              strokeWidth={2}
            />
            <Text style={[styles.tabText, role === 'HOSPITAL' && styles.tabTextActive]}>
              Hospital Facility
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <Card variant="outlined" style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {role === 'DONOR' ? 'Personal & Medical Information' : 'Institutional Credentials'}
          </Text>

          <Input
            label={role === 'DONOR' ? 'Full Name' : 'Authorized Officer Name'}
            placeholder={role === 'DONOR' ? 'e.g. John Doe' : 'e.g. Dr. Ramesh Rao'}
            value={name}
            onChangeText={setName}
          />

          {role === 'HOSPITAL' && (
            <>
              <Input
                label="Hospital / Medical Facility Name"
                placeholder="e.g. City Care Super Specialty Hospital"
                value={hospitalName}
                onChangeText={setHospitalName}
              />
              <Input
                label="License / Clinical Registration ID"
                placeholder="e.g. HOSP-BLR-2026-90"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
              />
            </>
          )}

          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Emergency Contact Phone"
            placeholder="+91 98765 43210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="City / Jurisdiction"
            placeholder="e.g. Bengaluru"
            value={city}
            onChangeText={setCity}
          />

          {role === 'DONOR' && (
            <>
              <BloodGroupSelector
                selected={bloodGroup}
                onSelect={(bg) => setBloodGroup(bg)}
                label="Your Blood Group"
              />

              <Input
                label="Date of Birth (YYYY-MM-DD)"
                placeholder="2000-01-01"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
            </>
          )}

          <Button
            title={role === 'DONOR' ? 'Register as Voluntary Donor' : 'Register Medical Facility'}
            onPress={handleRegister}
            loading={isLoading}
            style={styles.submitBtn}
          />

          <View style={styles.footerPrompt}>
            <Text style={styles.promptText}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: borderRadius.lg,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  formCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  submitBtn: {
    marginTop: spacing.md,
    backgroundColor: '#DC2626',
  },
  footerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  promptText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  linkText: {
    ...typography.bodySmall,
    color: '#DC2626',
    fontWeight: '700',
  },
});
