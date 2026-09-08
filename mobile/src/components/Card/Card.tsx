import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'outlined',
}) => {
  const getCardStyle = (): ViewStyle => {
    let base: ViewStyle = { ...styles.base };

    if (variant === 'elevated') {
      base = { ...base, ...shadows.sm, borderWidth: 0 };
    } else if (variant === 'outlined') {
      base = { ...base, borderWidth: 1, borderColor: colors.divider };
    } else if (variant === 'flat') {
      base = { ...base, borderWidth: 0, backgroundColor: colors.secondaryLight };
    }

    return base;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[getCardStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
