import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = { ...styles.base, ...styles[size] };

    if (variant === 'primary') base = { ...base, backgroundColor: colors.primary };
    else if (variant === 'secondary') base = { ...base, backgroundColor: colors.secondary };
    else if (variant === 'danger') base = { ...base, backgroundColor: colors.statusCritical };
    else if (variant === 'outline') {
      base = {
        ...base,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
      };
    }

    if (disabled || loading) {
      base = { ...base, opacity: 0.5 };
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let base: TextStyle = { ...styles.textBase, ...styles[`${size}Text` as keyof typeof styles] };

    if (variant === 'outline') {
      base = { ...base, color: colors.primary };
    } else {
      base = { ...base, color: colors.textInverse };
    }

    return base;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary : colors.textInverse}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    paddingVertical: spacing.lg - 2,
    paddingHorizontal: spacing.xl,
  },
  textBase: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  smText: {
    fontSize: typography.sizes.sm,
  },
  mdText: {
    fontSize: typography.sizes.md,
  },
  lgText: {
    fontSize: typography.sizes.lg,
  },
});
