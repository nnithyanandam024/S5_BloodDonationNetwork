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
import { Input, Button, Card } from '../../components';
import { useAuth } from '../../store/AuthContext';
import { apiClient } from '../../services/api';

export const LoginScreen = ({ navigation }: any) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(apiClient.getBaseUrl());

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password');
      return;
    }

    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Please check your credentials');
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    try {
      await login(demoEmail, 'Password123!');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    }
  };

  const handleSaveConfig = () => {
    apiClient.setBaseUrl(serverUrl.trim());
    setShowConfig(false);
    Alert.alert('Server Configured', `API URL set to ${serverUrl.trim()}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🩸</Text>
          </View>
          <Text style={styles.title}>BloodNet</Text>
          <Text style={styles.subtitle}>Emergency Blood Donation Network</Text>
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

        {/* Server Endpoint Config Toggle (Essential for physical phone testing) */}
        <TouchableOpacity
          style={styles.configToggle}
          onPress={() => setShowConfig(!showConfig)}
        >
          <Text style={styles.configToggleText}>
            ⚙️ {showConfig ? 'Hide Server Settings' : 'Configure Server Endpoint'}
          </Text>
        </TouchableOpacity>

        {showConfig && (
          <Card variant="outlined" style={styles.configCard}>
            <Text style={styles.configTitle}>Backend API URL</Text>
            <Text style={styles.configDesc}>
              Use 'http://10.0.2.2:5000/api' for Android emulator, or your PC's IP (e.g.
              'http://192.168.1.100:5000/api') for physical phones.
            </Text>
            <Input
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.x.x:5000/api"
              autoCapitalize="none"
            />
            <Button title="Save Server URL" onPress={handleSaveConfig} size="sm" />
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
    marginBottom: spacing.sm,
    marginTop: 2,
  },
});
