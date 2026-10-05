import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  G,
  Polyline,
  Polygon,
} from 'react-native-svg';

export type IconName =
  | 'home'
  | 'shield'
  | 'sparkles'
  | 'cart'
  | 'user'
  | 'plus'
  | 'car'
  | 'heart'
  | 'bike'
  | 'suitcase'
  | 'search'
  | 'filter'
  | 'bell'
  | 'arrow-up-right'
  | 'arrow-right'
  | 'arrow-left'
  | 'refresh'
  | 'chat'
  | 'star'
  | 'qr-code'
  | 'check'
  | 'anchor'
  | 'dots-horizontal'
  | 'droplet'
  | 'alert-siren'
  | 'hospital'
  | 'flask'
  | 'clipboard'
  | 'location-pin'
  | 'calendar'
  | 'phone'
  | 'mail'
  | 'lock'
  | 'gear'
  | 'logout'
  | 'chevron-right'
  | 'clock'
  | 'megaphone';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#111827',
  strokeWidth = 2,
  style,
}) => {
  const renderIconPaths = () => {
    switch (name) {
      case 'home':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 9.5L12 2l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
            <Path d="M9 22V12h6v10" />
          </G>
        );

      case 'shield':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </G>
        );

      case 'sparkles':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2z" />
            <Path d="M19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
          </G>
        );

      case 'cart':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="9" cy="21" r="1" fill={color} />
            <Circle cx="20" cy="21" r="1" fill={color} />
            <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </G>
        );

      case 'user':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
          </G>
        );

      case 'plus':
        return (
          <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <Line x1="12" y1="5" x2="12" y2="19" />
            <Line x1="5" y1="12" x2="19" y2="12" />
          </G>
        );

      case 'car':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L18 11l-2.32-4.64A2 2 0 0 0 13.89 5H10.1a2 2 0 0 0-1.79 1.11L6 11l-3.16.86a1 1 0 0 0-.84.99V16h3" />
            <Circle cx="6.5" cy="16.5" r="2.5" />
            <Circle cx="16.5" cy="16.5" r="2.5" />
          </G>
        );

      case 'heart':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </G>
        );

      case 'bike':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="5.5" cy="17.5" r="3.5" />
            <Circle cx="18.5" cy="17.5" r="3.5" />
            <Path d="M15 6h2l3 6.5M12 17.5V14l-3-3 4-4 3 3M5.5 17.5L9 11h3" />
          </G>
        );

      case 'suitcase':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="2" y="7" width="20" height="14" rx="2" />
            <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </G>
        );

      case 'search':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="11" cy="11" r="8" />
            <Line x1="21" y1="21" x2="16.65" y2="16.65" />
          </G>
        );

      case 'filter':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Line x1="4" y1="6" x2="20" y2="6" />
            <Line x1="7" y1="12" x2="17" y2="12" />
            <Line x1="10" y1="18" x2="14" y2="18" />
          </G>
        );

      case 'bell':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </G>
        );

      case 'arrow-up-right':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Line x1="7" y1="17" x2="17" y2="7" />
            <Polyline points="7 7 17 7 17 17" />
          </G>
        );

      case 'arrow-right':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Line x1="5" y1="12" x2="19" y2="12" />
            <Polyline points="12 5 19 12 12 19" />
          </G>
        );

      case 'arrow-left':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Line x1="19" y1="12" x2="5" y2="12" />
            <Polyline points="12 19 5 12 12 5" />
          </G>
        );

      case 'refresh':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="23 4 23 10 17 10" />
            <Polyline points="1 20 1 14 7 14" />
            <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </G>
        );

      case 'chat':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </G>
        );

      case 'star':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill={color} strokeLinecap="round" strokeLinejoin="round">
            <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </G>
        );

      case 'qr-code':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="3" y="3" width="7" height="7" />
            <Rect x="14" y="3" width="7" height="7" />
            <Rect x="3" y="14" width="7" height="7" />
            <Line x1="14" y1="14" x2="14" y2="14.01" strokeWidth={strokeWidth + 1} />
            <Line x1="14" y1="18" x2="18" y2="18" />
            <Line x1="18" y1="14" x2="21" y2="14" />
            <Line x1="18" y1="21" x2="21" y2="21" />
          </G>
        );

      case 'check':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12" />
          </G>
        );

      case 'anchor':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="5" r="3" />
            <Line x1="12" y1="22" x2="12" y2="8" />
            <Path d="M5 12H2a10 10 0 0 0 20 0h-3" />
          </G>
        );

      case 'dots-horizontal':
        return (
          <G fill={color}>
            <Circle cx="5" cy="12" r="2" />
            <Circle cx="12" cy="12" r="2" />
            <Circle cx="19" cy="12" r="2" />
          </G>
        );

      case 'droplet':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </G>
        );

      case 'alert-siren':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <Line x1="12" y1="9" x2="12" y2="13" />
            <Line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={strokeWidth + 1} />
          </G>
        );

      case 'hospital':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
            <Line x1="12" y1="7" x2="12" y2="13" />
            <Line x1="9" y1="10" x2="15" y2="10" />
            <Path d="M10 21v-4h4v4" />
          </G>
        );

      case 'flask':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M10 2v5.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 7.5V2" />
            <Line x1="8.5" y1="2" x2="15.5" y2="2" />
            <Line x1="7" y1="14" x2="17" y2="14" />
          </G>
        );

      case 'clipboard':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <Line x1="9" y1="12" x2="15" y2="12" />
            <Line x1="9" y1="16" x2="13" y2="16" />
          </G>
        );

      case 'location-pin':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <Circle cx="12" cy="10" r="3" />
          </G>
        );

      case 'calendar':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <Line x1="16" y1="2" x2="16" y2="6" />
            <Line x1="8" y1="2" x2="8" y2="6" />
            <Line x1="3" y1="10" x2="21" y2="10" />
          </G>
        );

      case 'phone':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </G>
        );

      case 'mail':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <Polyline points="22,6 12,13 2,6" />
          </G>
        );

      case 'lock':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </G>
        );

      case 'gear':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="3" />
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </G>
        );

      case 'logout':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <Polyline points="16 17 21 12 16 7" />
            <Line x1="21" y1="12" x2="9" y2="12" />
          </G>
        );

      case 'chevron-right':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="9 18 15 12 9 6" />
          </G>
        );

      case 'clock':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10" />
            <Polyline points="12 6 12 12 16 14" />
          </G>
        );

      case 'megaphone':
        return (
          <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 11l18-5v12L3 13v-2z" />
            <Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
          </G>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {renderIconPaths()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
