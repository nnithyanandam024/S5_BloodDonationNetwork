import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Input, Button, Card, Icon } from '../../components';
import { useAuth } from '../../store/AuthContext';
import { apiClient } from '../../services/api';

export const LoginScreen = ({ navigation }: any) => {
  const { login, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'HOSPITAL' | 'DONOR'>('HOSPITAL');
  const [email, setEmail] = useState('hospital@citycare.org');
  const [password, setPassword] = useState('Password123!');
  const [showConfig, setShowConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(apiClient.getBaseUrl());
  const [connStatus, setConnStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connDetails, setConnDetails] = useState<string>('');

  const testConnection = async (targetUrl = serverUrl) => {
    setConnStatus('testing');
    setConnDetails('Verifying network status...');
    const result = await apiClient.checkHealth(targetUrl, 3000);
    if (result.ok) {
      setConnStatus('connected');
      setConnDetails(`Active (${result.latency}ms)`);
    } else {
      setConnStatus('error');
      setConnDetails(result.message || 'Offline');
    }
  };

  useEffect(() => {
    // Probe on mount to verify backend connectivity
    (async () => {
      setConnStatus('testing');
      const initial = apiClient.getBaseUrl();
      const direct = await apiClient.checkHealth(initial, 2000);
      if (direct.ok) {
        setConnStatus('connected');
        setConnDetails(`Active (${direct.latency}ms)`);
        return;
      }

      const detected = await apiClient.autoDetectWorkingHost();
      if (detected) {
        setServerUrl(detected);
        setConnStatus('connected');
        setConnDetails('Auto-connected');
      } else {
        setConnStatus('error');
        setConnDetails('Network unavailable');
      }
    })();
  }, []);

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
      await login(email.trim(), password.trim());
    } catch (err: any) {
      const msg = err.message || 'Please check your credentials';
      Alert.alert('Sign In Failed', msg);
      if (msg.includes('Unable to reach') || msg.includes('timed out')) {
        setShowConfig(true);
        testConnection();
      }
    }
  };

  const applyPreset = (presetUrl: string) => {
    setServerUrl(presetUrl);
    apiClient.setBaseUrl(presetUrl, true);
    testConnection(presetUrl);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Icon name="droplet" size={32} color="#DC2626" strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>BloodLink</Text>
          <Text style={styles.subtitle}>Emergency Blood Fulfillment Network</Text>

          {/* Connection Status Pill */}
          <View style={styles.statusPill}>
            {connStatus === 'testing' && <ActivityIndicator size="small" color="#D97706" />}
            <View
              style={[
                styles.statusDot,
                connStatus === 'connected' && styles.statusDotGreen,
                connStatus === 'error' && styles.statusDotRed,
                connStatus === 'testing' && styles.statusDotAmber,
              ]}
            />
            <Text style={styles.statusPillText}>
              {connStatus === 'connected' && `Network Ready • ${connDetails}`}
              {connStatus === 'testing' && (connDetails || 'Checking network...')}
              {connStatus === 'error' && `Offline • ${connDetails}`}
              {connStatus === 'idle' && 'Network Ready'}
            </Text>
          </View>
        </View>

        {/* Portal Selector Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, selectedRole === 'HOSPITAL' && styles.tabBtnActive]}
            onPress={() => handleRoleSelect('HOSPITAL')}
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
            loading={isLoading}
            style={styles.signInBtn}
          />

          <View style={styles.registerPrompt}>
            <Text style={styles.promptText}>New facility or donor? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quick Demo Accounts Pill Chips */}
        <View style={styles.quickAccountsSection}>
          <Text style={styles.quickTitle}>Quick Demo Switcher (1-Tap):</Text>
          <View style={styles.quickChipsRow}>
            <TouchableOpacity
              style={[
                styles.quickChip,
                selectedRole === 'HOSPITAL' && styles.quickChipActive,
              ]}
              onPress={() => handleRoleSelect('HOSPITAL')}
            >
              <Text style={styles.quickChipText}>🏥 City Care Hospital</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickChip,
                selectedRole === 'DONOR' && styles.quickChipActive,
              ]}
              onPress={() => handleRoleSelect('DONOR')}
            >
              <Text style={styles.quickChipText}>🩸 John Doe (O+ Donor)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Discreet Server Settings Toggle */}
        <TouchableOpacity
          style={styles.configToggle}
          onPress={() => setShowConfig(!showConfig)}
        >
          <View style={styles.configToggleRow}>
            <Icon name="gear" size={14} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.configToggleText}>
              {showConfig ? 'Hide Network Configuration' : 'Network Settings'}
            </Text>
          </View>
        </TouchableOpacity>

        {showConfig && (
          <Card variant="outlined" style={styles.configCard}>
            <Text style={styles.configTitle}>API Endpoint Connection</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[
                  styles.presetChip,
                  serverUrl.includes('localhost:5000') && styles.presetChipActive,
                ]}
                onPress={() => applyPreset('http://localhost:5000/api')}
              >
                <Text style={styles.presetChipText}>USB (localhost:5000)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetChip,
                  serverUrl.includes('10.40.27.205') && styles.presetChipActive,
                ]}
                onPress={() => applyPreset('http://10.40.27.205:5000/api')}
              >
                <Text style={styles.presetChipText}>Wi-Fi (10.40.27.205)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetChip,
                  serverUrl.includes('10.0.2.2') && styles.presetChipActive,
                ]}
                onPress={() => applyPreset('http://10.0.2.2:5000/api')}
              >
                <Text style={styles.presetChipText}>Emulator (10.0.2.2)</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Custom Endpoint URL"
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.x.x:5000/api"
              autoCapitalize="none"
            />
          </Card>
        )}
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
  header: {
    alignItems: 'center',
    marginVertical: spacing.md,
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
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: spacing.sm,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotGreen: {
    backgroundColor: '#059669',
  },
  statusDotRed: {
    backgroundColor: '#DC2626',
  },
  statusDotAmber: {
    backgroundColor: '#D97706',
  },
  statusPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
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
  formTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  signInBtn: {
    marginTop: spacing.sm,
    backgroundColor: '#DC2626',
  },
  registerPrompt: {
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
  quickAccountsSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  quickTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  quickChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  configToggle: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.xs,
  },
  configToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  configToggleText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  configCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
  },
  configTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: '#DC2626',
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
