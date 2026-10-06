import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Input, Button, Card, Header, Icon } from '../../components';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your registered email address');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Password Reset Link Sent',
        `Verification instructions have been sent to ${email.trim()}`,
        [{ text: 'Back to Sign In', onPress: () => navigation.navigate('Login') }]
      );
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Account Recovery" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Card variant="outlined" style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="shield" size={32} color="#DC2626" strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.desc}>
            Enter your registered email address. We'll send you a secure verification link to regain access.
          </Text>

          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Button
            title="Send Recovery Link"
            onPress={handleReset}
            loading={isSubmitting}
            style={styles.submitBtn}
          />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backText}>Return to Sign In</Text>
          </TouchableOpacity>
        </Card>
      </View>
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
  },
  card: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  desc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  submitBtn: {
    width: '100%',
    marginTop: spacing.sm,
  },
  backBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  backText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
