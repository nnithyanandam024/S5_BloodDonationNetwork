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
      Alert.alert('Missing Fields', 'Please fill in all required fields');
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
          licenseNumber: licenseNumber.trim() || 'LIC-REG',
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
      Alert.alert('Registration Error', err.message || 'Failed to register account');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Create Account" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Role Selector Tabs */}
        <View style={styles.roleTabs}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'DONOR' && styles.roleTabActive]}
            onPress={() => setRole('DONOR')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon
                name="droplet"
                size={16}
                color={role === 'DONOR' ? colors.textInverse : colors.primary}
                strokeWidth={2.2}
              />
              <Text style={[styles.roleTabText, role === 'DONOR' && styles.roleTabTextActive]}>
                Blood Donor
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleTab, role === 'HOSPITAL' && styles.roleTabActive]}
            onPress={() => setRole('HOSPITAL')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon
                name="hospital"
                size={16}
                color={role === 'HOSPITAL' ? colors.textInverse : colors.primary}
                strokeWidth={2}
              />
              <Text style={[styles.roleTabText, role === 'HOSPITAL' && styles.roleTabTextActive]}>
                Hospital / Clinic
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Card variant="outlined">
          <Input
            label={role === 'DONOR' ? 'Full Name' : 'Authorized Representative Name'}
            placeholder={role === 'DONOR' ? 'e.g. John Doe' : 'e.g. Dr. Ramesh Rao'}
            value={name}
            onChangeText={setName}
          />

          {role === 'HOSPITAL' && (
            <>
              <Input
                label="Hospital / Medical Center Name"
                placeholder="e.g. City Care Super Specialty Hospital"
                value={hospitalName}
                onChangeText={setHospitalName}
              />
              <Input
                label="License / Registration ID"
                placeholder="e.g. HOSP-BLR-2026"
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
            label="Phone Number"
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
            label="City / Location"
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
            title={role === 'DONOR' ? 'Register as Donor' : 'Register Hospital'}
            onPress={handleRegister}
            loading={isLoading}
            style={styles.submitBtn}
          />
        </Card>
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
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  roleTab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  roleTabActive: {
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roleTabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  roleTabTextActive: {
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
