import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from '../components/Icon/Icon';
import { colors } from '../theme';

interface CustomBottomTabBarProps extends BottomTabBarProps {
  onCenterPress?: () => void;
}

export const CustomBottomTabBar: React.FC<CustomBottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  onCenterPress,
}) => {
  const getTabIcon = (routeName: string): IconName => {
    switch (routeName) {
      case 'Home':
        return 'home';
      case 'Requests':
      case 'Services':
        return 'shield';
      case 'History':
      case 'Benefits':
        return 'sparkles';
      case 'Profile':
      case 'Buy':
        return 'user';
      case 'Reference':
        return 'qr-code';
      default:
        return 'home';
    }
  };

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'Home':
        return 'Home';
      case 'Requests':
        return 'Policies';
      case 'History':
        return 'Benefits';
      case 'Profile':
        return 'Buy';
      case 'Reference':
        return 'Design UI';
      default:
        return routeName;
    }
  };

  // We have 4 standard tabs + 1 elevated center button in the middle
  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2, 4);

  return (
    <View style={styles.container}>
      {/* Left Tabs */}
      <View style={styles.tabGroup}>
        {leftRoutes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Icon
                name={getTabIcon(route.name)}
                size={22}
                color={isFocused ? colors.violetPrimary : '#9CA3AF'}
                strokeWidth={isFocused ? 2.2 : 1.8}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {getTabLabel(route.name)}
              </Text>
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Center Floating Elevated Action Button */}
      <View style={styles.centerFabSlot}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (onCenterPress) {
              onCenterPress();
            } else {
              navigation.navigate('Requests');
            }
          }}
          style={styles.centerFabBtn}
        >
          <Icon name="plus" size={24} color="#FFFFFF" strokeWidth={2.8} />
        </TouchableOpacity>
      </View>

      {/* Right Tabs */}
      <View style={styles.tabGroup}>
        {rightRoutes.map((route, relativeIndex) => {
          const index = relativeIndex + 2;
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Icon
                name={getTabIcon(route.name)}
                size={22}
                color={isFocused ? colors.violetPrimary : '#9CA3AF'}
                strokeWidth={isFocused ? 2.2 : 1.8}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {getTabLabel(route.name)}
              </Text>
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: Platform.OS === 'ios' ? 78 : 68,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: 60,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#7047EB',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7047EB',
    marginTop: 3,
  },
  centerFabSlot: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabBtn: {
    position: 'absolute',
    top: -30,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7047EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
