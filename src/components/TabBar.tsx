import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, typography, radii } from '../theme';
import { HomeIcon, StudyIcon, PracticeIcon, ProgressIcon } from './Icons';

export const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          height: 84 + (insets.bottom > 0 ? insets.bottom - 8 : 0),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

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

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const renderIcon = () => {
          const iconColor = isFocused ? colors.roseText : colors.muted;
          switch (route.name) {
            case 'Home':
              return <HomeIcon color={iconColor} size={22} />;
            case 'Study':
              return <StudyIcon color={iconColor} size={22} />;
            case 'Practice':
              return <PracticeIcon color={iconColor} size={22} />;
            case 'Progress':
              return <ProgressIcon color={iconColor} size={22} />;
            default:
              return null;
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel || route.name}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.tabButton}
          >
            <View style={[styles.iconPill, isFocused && styles.iconPillActive]}>
              {renderIcon()}
            </View>
            <Text
              style={[
                styles.tabLabel,
                isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.pinkLine,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 4,
  },
  iconPill: {
    width: 56,
    height: 30,
    borderRadius: radii.tabPill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: colors.pinkSoft,
  },
  tabLabel: {
    fontSize: typography.sizes.tabLabel,
  },
  tabLabelActive: {
    color: colors.roseText,
    fontFamily: typography.fontFamily.bold,
  },
  tabLabelInactive: {
    color: colors.muted,
    fontFamily: typography.fontFamily.semiBold,
  },
});
