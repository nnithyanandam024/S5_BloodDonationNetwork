import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme';
import { Input, Button, Card, Header } from '../../components';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');

  const handleReset = () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your registered email address');
      return;
    }
    Alert.alert(
      'Password Reset Link Sent',
      `Instructions have been sent to ${email.trim()}`,
      [{ text: 'Back to Sign In', onPress: () => navigation.navigate('Login') }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Forgot Password" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Card variant="outlined">
          <Text style={styles.desc}>
            Enter your registered email address to receive a secure password reset link.
          </Text>
          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button title="Send Reset Link" onPress={handleReset} />
        </Card>
      </View>
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
  desc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
});
