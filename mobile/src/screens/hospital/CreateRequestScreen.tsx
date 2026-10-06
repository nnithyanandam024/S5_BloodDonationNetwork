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
import { Input, Button, Card, BloodGroupSelector, Header } from '../../components';
import { requestsApi } from '../../services/api';
import { BloodGroup, ComponentType, UrgencyLevel } from '../../types';

export const CreateRequestScreen = ({ navigation }: any) => {
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [component, setComponent] = useState<ComponentType>('WHOLE_BLOOD');
  const [unitsRequired, setUnitsRequired] = useState('2');
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [searchRadiusKm, setSearchRadiusKm] = useState('15');
  const [notes, setNotes] = useState('Emergency trauma ICU requirement');
  const [autoReserveInventory, setAutoReserveInventory] = useState(true);
  const [loading, setLoading] = useState(false);

  const COMPONENT_OPTIONS: { label: string; value: ComponentType }[] = [
    { label: 'Red Blood Cells (RBC)', value: 'RED_BLOOD_CELLS' },
    { label: 'Whole Blood', value: 'WHOLE_BLOOD' },
    { label: 'Platelets', value: 'PLATELETS' },
    { label: 'Plasma', value: 'PLASMA' },
  ];

  const URGENCY_OPTIONS: { label: string; value: UrgencyLevel }[] = [
    { label: 'Critical (Immediate)', value: 'CRITICAL' },
    { label: 'Urgent (< 4 Hours)', value: 'URGENT' },
    { label: 'Normal (Standard)', value: 'NORMAL' },
  ];

  const handleCreate = async () => {
    const units = parseInt(unitsRequired, 10);
    if (isNaN(units) || units <= 0) {
      Alert.alert('Invalid Units', 'Please specify a valid number of units');
      return;
    }

    setLoading(true);
    try {
      const res = await requestsApi.createRequest({
        bloodGroup,
        component,
        unitsRequired: units,
        urgency,
        searchRadiusKm: Number(searchRadiusKm) || 15,
        notes: notes.trim(),
        autoReserveInventory,
      });

      Alert.alert('AFGC Cycle Activated', res.message, [
        {
          text: 'Track AFGC Telemetry',
          onPress: () => {
            navigation.navigate('RequestDetails', { requestId: res.request.id });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Could not initiate AFGC cycle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Create Emergency Request" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card variant="outlined">
          {/* Blood Group Selector */}
          <BloodGroupSelector
            selected={bloodGroup}
            onSelect={setBloodGroup}
            label="Required Blood Group"
          />

          {/* Component Selection */}
          <Text style={styles.fieldLabel}>Blood Component</Text>
          <View style={styles.optionsWrap}>
            {COMPONENT_OPTIONS.map((opt) => {
              const isSelected = component === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionPill, isSelected ? styles.optionPillActive : undefined]}
                  onPress={() => setComponent(opt.value)}
                >
                  <Text
                    style={[styles.optionText, isSelected ? styles.optionTextActive : undefined]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Units Required */}
          <Input
            label="Units Required (Bags)"
            value={unitsRequired}
            onChangeText={setUnitsRequired}
            keyboardType="number-pad"
            placeholder="e.g. 2"
          />

          {/* Urgency Level */}
          <Text style={styles.fieldLabel}>Urgency Level</Text>
          <View style={styles.urgencyGrid}>
            {URGENCY_OPTIONS.map((opt) => {
              const isSelected = urgency === opt.value;
              const isCritical = opt.value === 'CRITICAL';
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.urgencyPill,
                    isSelected
                      ? isCritical
                        ? styles.urgencyCriticalActive
                        : styles.urgencyOptionActive
                      : undefined,
                  ]}
                  onPress={() => setUrgency(opt.value)}
                >
                  <Text
                    style={[
                      styles.urgencyText,
                      isSelected ? styles.urgencyTextActive : undefined,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search Radius */}
          <Input
            label="Search Radius (Kilometers)"
            value={searchRadiusKm}
            onChangeText={setSearchRadiusKm}
            keyboardType="number-pad"
            placeholder="15"
          />

          {/* Notes */}
          <Input
            label="Clinical Notes / Department"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. ICU Bed 4, Emergency OT required immediately"
          />

          {/* AFGC Dual-Source Information Card */}
          <View style={styles.afgcInfoBox}>
            <View style={styles.afgcInfoTop}>
              <Text style={styles.afgcInfoTitle}>AFGC DUAL-SOURCE COORDINATION</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAutoReserveInventory(!autoReserveInventory)}
                style={[
                  styles.togglePill,
                  autoReserveInventory ? styles.togglePillActive : styles.togglePillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    autoReserveInventory ? styles.toggleTextActive : styles.toggleTextInactive,
                  ]}
                >
                  {autoReserveInventory ? 'ENABLED' : 'DISABLED'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.afgcInfoDesc}>
              Interrogates authorized blood bank inventory reserves first (IR), securing compatible units and dispatching volunteer donors only for the unresolved gap G = Q − IR − DC.
            </Text>
          </View>

          <Button
            title="Launch AFGC Fulfillment Cycle"
            onPress={handleCreate}
            loading={loading}
            variant="danger"
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
    backgroundColor: '#F8F9FE',
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  optionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionPillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  optionText: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  optionTextActive: {
    color: colors.textInverse,
  },
  urgencyGrid: {
    flexDirection: 'column',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  urgencyPill: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  urgencyOptionActive: {
    backgroundColor: colors.statusUrgent,
    borderColor: colors.statusUrgent,
  },
  urgencyCriticalActive: {
    backgroundColor: colors.statusCritical,
    borderColor: colors.statusCritical,
  },
  urgencyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  urgencyTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
  },
  submitBtn: {
    marginTop: spacing.lg,
  },
  afgcInfoBox: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginTop: spacing.md,
  },
  afgcInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  afgcInfoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7047EB',
    letterSpacing: 0.5,
  },
  togglePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  togglePillActive: {
    backgroundColor: '#7047EB',
  },
  togglePillInactive: {
    backgroundColor: '#9CA3AF',
  },
  toggleText: {
    fontSize: 9,
    fontWeight: '800',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  toggleTextInactive: {
    color: '#FFFFFF',
  },
  afgcInfoDesc: {
    fontSize: 11,
    color: '#4C1D95',
    lineHeight: 16,
  },
});
