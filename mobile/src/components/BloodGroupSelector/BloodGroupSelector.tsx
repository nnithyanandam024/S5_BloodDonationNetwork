import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { BloodGroup } from '../../types';

export interface BloodGroupSelectorProps {
  selected?: BloodGroup;
  onSelect: (group: BloodGroup) => void;
  containerStyle?: StyleProp<ViewStyle>;
  label?: string;
  error?: string;
}

const BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const BloodGroupSelector: React.FC<BloodGroupSelectorProps> = ({
  selected,
  onSelect,
  containerStyle,
  label = 'Select Blood Group',
  error,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.grid}>
        {BLOOD_GROUPS.map((group) => {
          const isSelected = selected === group;
          return (
            <TouchableOpacity
              key={group}
              activeOpacity={0.7}
              style={[styles.pill, isSelected ? styles.pillSelected : undefined]}
              onPress={() => onSelect(group)}
            >
              <Text style={[styles.pillText, isSelected ? styles.pillTextSelected : undefined]}>
                {group}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    width: '22%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.textInverse,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.statusCritical,
    marginTop: spacing.xs,
  },
});
