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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(apiClient.getBaseUrl());
  const [connStatus, setConnStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connDetails, setConnDetails] = useState<string>('');

  const testConnection = async (targetUrl = serverUrl) => {
    setConnStatus('testing');
    setConnDetails('Checking backend health...');
    const result = await apiClient.checkHealth(targetUrl, 3000);
    if (result.ok) {
      setConnStatus('connected');
      setConnDetails(`Connected (${result.latency}ms)`);
    } else {
      setConnStatus('error');
      setConnDetails(result.message || 'Cannot reach backend');
    }
  };

  useEffect(() => {
    // Probe on mount to ensure user is connected or auto-select working host
    (async () => {
      setConnStatus('testing');
      const initial = apiClient.getBaseUrl();
      const direct = await apiClient.checkHealth(initial, 2000);
      if (direct.ok) {
        setConnStatus('connected');
        setConnDetails(`Connected (${direct.latency}ms)`);
        return;
      }

      // Probing candidate hosts
      const detected = await apiClient.autoDetectWorkingHost();
      if (detected) {
        setServerUrl(detected);
        setConnStatus('connected');
        setConnDetails('Auto-detected working endpoint');
      } else {
        setConnStatus('error');
        setConnDetails('Server not detected yet');
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password');
      return;
    }

    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      const msg = err.message || 'Please check your credentials';
      Alert.alert('Login Failed', msg);
      if (msg.includes('Unable to reach') || msg.includes('timed out')) {
        setShowConfig(true);
        testConnection();
      }
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    try {
      await login(demoEmail, 'Password123!');
    } catch (err: any) {
      const msg = err.message || 'Please check your credentials';
      Alert.alert('Login Failed', msg);
      if (msg.includes('Unable to reach') || msg.includes('timed out')) {
        setShowConfig(true);
        testConnection();
      }
    }
  };

  const handleSaveConfig = () => {
    const trimmed = serverUrl.trim();
    apiClient.setBaseUrl(trimmed, true);
    Alert.alert('Server Configured', `API URL set to ${trimmed}`);
    testConnection(trimmed);
  };

  const applyPreset = (presetUrl: string) => {
    setServerUrl(presetUrl);
    apiClient.setBaseUrl(presetUrl, true);
    testConnection(presetUrl);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Icon name="droplet" size={32} color="#DC2626" strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>BloodNet</Text>
          <Text style={styles.subtitle}>Emergency Blood Donation Network</Text>

          {/* Connection status badge */}
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
              {connStatus === 'connected' && `Backend Online • ${connDetails}`}
              {connStatus === 'testing' && (connDetails || 'Checking backend...')}
              {connStatus === 'error' && `Backend Offline • ${connDetails}`}
              {connStatus === 'idle' && 'Backend Status: Ready'}
            </Text>
          </View>
        </View>

        <Card variant="outlined" style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>

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
            <Text style={styles.promptText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Register</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quick Demo Logins for Instant Testing */}
        <Card variant="flat" style={styles.demoCard}>
          <Text style={styles.demoTitle}>Quick Demo Logins (1-Tap)</Text>
          <Text style={styles.demoSub}>
            Instant login for quick testing without typing credentials:
          </Text>

          <View style={styles.demoButtons}>
            <Button
              title="Demo Donor (O+ John)"
              onPress={() => handleQuickLogin('john.doe@example.com')}
              variant="secondary"
              size="sm"
              style={styles.demoBtn}
            />
            <Button
              title="Demo Hospital (City Care)"
              onPress={() => handleQuickLogin('hospital@citycare.org')}
              variant="outline"
              size="sm"
              style={styles.demoBtn}
            />
          </View>
        </Card>

        {/* Server Endpoint Config Toggle */}
        <TouchableOpacity
          style={styles.configToggle}
          onPress={() => setShowConfig(!showConfig)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="gear" size={16} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.configToggleText}>
              {showConfig ? 'Hide Server Settings' : 'Configure Server Endpoint'}
            </Text>
          </View>
        </TouchableOpacity>

        {showConfig && (
          <Card variant="outlined" style={styles.configCard}>
            <Text style={styles.configTitle}>Backend API Settings</Text>
            <Text style={styles.configDesc}>
              Quick Presets (Tap to switch):
            </Text>

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[
                  styles.presetChip,
                  serverUrl.includes('localhost:5000') && styles.presetChipActive,
                ]}
                onPress={() => applyPreset('http://localhost:5000/api')}
              >
                <Text style={styles.presetChipText}>🔌 USB (localhost:5000)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetChip,
                  serverUrl.includes('10.10.187.171') && styles.presetChipActive,
                ]}
                onPress={() => applyPreset('http://10.10.187.171:5000/api')}
              >
                <Text style={styles.presetChipText}>📶 Wi-Fi (10.10.187.171)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetChip,
                  serverUrl.includes('10.0.2.2') && styles.presetChipActive,
                ]}
                onPress={() => applyPreset('http://10.0.2.2:5000/api')}
              >
                <Text style={styles.presetChipText}>💻 Emulator (10.0.2.2)</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Custom API URL"
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.x.x:5000/api"
              autoCapitalize="none"
            />

            <View style={styles.configBtnRow}>
              <Button
                title="Test Connection"
                onPress={() => testConnection(serverUrl.trim())}
                variant="outline"
                size="sm"
                style={{ flex: 1 }}
              />
              <Button
                title="Save & Use"
                onPress={handleSaveConfig}
                size="sm"
                style={{ flex: 1 }}
              />
            </View>

            <Text style={styles.hintText}>
              Note for USB Debugging: Ensure you ran "adb reverse tcp:5000 tcp:5000" in your terminal so your phone routes port 5000 to your PC.
            </Text>
          </Card>
        )}
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  signInBtn: {
    marginTop: spacing.sm,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  promptText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  demoCard: {
    marginBottom: spacing.lg,
  },
  demoTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  demoSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  demoBtn: {
    flex: 1,
  },
  configToggle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  configToggleText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  configCard: {
    marginTop: spacing.sm,
  },
  configTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  configDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  statusDotGreen: {
    backgroundColor: '#10B981',
  },
  statusDotAmber: {
    backgroundColor: '#F59E0B',
  },
  statusDotRed: {
    backgroundColor: '#EF4444',
  },
  statusPillText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  presetChipText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  configBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});
