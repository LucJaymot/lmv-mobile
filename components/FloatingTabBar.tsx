import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

// Mapping des icônes Material Icons vers les noms SF Symbols pour iOS
const iconMapping: Record<string, { android: keyof typeof MaterialIcons.glyphMap; ios: string }> = {
  'home': { android: 'home', ios: 'house.fill' },
  'directions_car': { android: 'directions-car', ios: 'car.fill' },
  'list': { android: 'list', ios: 'list.bullet' },
  'person': { android: 'person', ios: 'person.fill' },
  'work': { android: 'work', ios: 'briefcase.fill' },
  'description': { android: 'description', ios: 'doc.text.fill' },
};

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Platform.OS === 'web' ? screenWidth / 2 : screenWidth - 40,
  borderRadius = 35,
  bottomMargin
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const animatedValue = useSharedValue(0);

  // Hide tab bar on modal/detail screens
  const shouldHideTabBar = React.useMemo(() => {
    // Liste des routes qui ne doivent pas afficher le tab bar
    const hiddenRoutes = [
      '/requests/detail',
      '/profile/edit',
      '/profile/notifications',
      '/vehicles/add',
      '/vehicles/edit',
      '/requests/create',
    ];
    
    const pathnameStr = typeof pathname === 'string' ? pathname : String(pathname);
    return hiddenRoutes.some(route => pathnameStr.includes(route));
  }, [pathname]);

  // Improved active tab detection with better path matching
  const activeTabIndex = React.useMemo(() => {
    // Find the best matching tab based on the current pathname
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;

      // Exact route match gets highest score
      if (pathname === tab.route) {
        score = 100;
      }
      // Check if pathname starts with tab route (for nested routes)
      else if (pathname.startsWith(tab.route as string)) {
        score = 80;
      }
      // Check if pathname contains the tab name
      else if (pathname.includes(tab.name)) {
        score = 60;
      }
      // Check for partial matches in the route
      else if (tab.route.includes('/(tabs)/') && pathname.includes(tab.route.split('/(tabs)/')[1])) {
        score = 40;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    // Default to first tab if no match found
    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, tabs]);

  React.useEffect(() => {
    if (activeTabIndex >= 0) {
      animatedValue.value = withSpring(activeTabIndex, {
        damping: 20,
        stiffness: 120,
        mass: 1,
      });
    }
  }, [activeTabIndex, animatedValue]);

  const handleTabPress = (route: Href) => {
    router.push(route);
  };

  // Remove unnecessary tabBarStyle animation to prevent flickering

  const tabWidthPercent = ((100 / tabs.length) - 1).toFixed(2);

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = (containerWidth - 8) / tabs.length; // Account for container padding (4px on each side)
    return {
      transform: [
        {
          translateX: interpolate(
            animatedValue.value,
            [0, tabs.length - 1],
            [0, tabWidth * (tabs.length - 1)]
          ),
        },
      ],
    };
  });

  // Calculate indicator border radius to match container
  // Container has borderRadius, indicator has top: 4 and bottom: 4
  // So indicator borderRadius should be container borderRadius - vertical padding
  const indicatorBorderRadius = borderRadius - 4;

  // Dynamic styles based on theme
  const dynamicStyles = {
    blurContainer: {
      ...styles.blurContainer,
      borderWidth: 1.2,
      borderColor: 'rgba(255, 255, 255, 1)',
      ...Platform.select({
        ios: {
          backgroundColor: theme.dark
            ? 'rgba(28, 28, 30, 0.8)'
            : 'rgba(255, 255, 255, 0.6)',
        },
        android: {
          backgroundColor: theme.dark
            ? 'rgba(28, 28, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.6)',
        },
        web: {
          backgroundColor: theme.dark
            ? 'rgba(28, 28, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    background: {
      ...styles.background,
    },
    indicator: {
      ...styles.indicator,
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.08)' // Subtle white overlay in dark mode
        : 'rgba(0, 0, 0, 0.04)', // Subtle black overlay in light mode
      width: `${tabWidthPercent}%` as `${number}%`, // Dynamic width based on number of tabs
      borderRadius: indicatorBorderRadius, // Match container borderRadius minus vertical padding
    },
  };

  // Don't render if we're on a modal/detail screen
  if (shouldHideTabBar) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={[
        styles.container,
        {
          width: containerWidth,
          marginBottom: bottomMargin ?? 20
        }
      ]}>
        <BlurView
          intensity={80}
          style={[dynamicStyles.blurContainer, { borderRadius }]}
        >
          <View style={dynamicStyles.background} />
          <Animated.View style={[dynamicStyles.indicator, indicatorStyle]} />
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;
              const iconMap = iconMapping[tab.icon] || { android: tab.icon, ios: 'circle' };
              const androidIcon = iconMap.android as keyof typeof MaterialIcons.glyphMap;
              const iosIcon = iconMap.ios;

              return (
                <React.Fragment key={index}>
                <TouchableOpacity
                  key={index} // Use index as key
                  style={styles.tab}
                  onPress={() => handleTabPress(tab.route)}
                  activeOpacity={0.7}
                >
                  <View key={index} style={styles.tabContent}>
                    {/*
                     * Sur web en dark mode, on veut l'onglet actif en blanc (et non en bleu "primary")
                     * pour un meilleur contraste dans la barre menu.
                     */}
                    {(() => {
                      const inactiveColor = theme.dark ? '#98989D' : '#000000';
                      const activeColor =
                        Platform.OS === 'web' && theme.dark ? theme.colors.text : theme.colors.primary;

                      return (
                    <IconSymbol
                      android_material_icon_name={androidIcon}
                      ios_icon_name={iosIcon}
                      size={24}
                          color={isActive ? activeColor : inactiveColor}
                    />
                      );
                    })()}
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: theme.dark ? '#98989D' : '#8E8E93' },
                        isActive && {
                          color:
                            Platform.OS === 'web' && theme.dark ? theme.colors.text : theme.colors.primary,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center', // Center the content
  },
  container: {
    marginHorizontal: 20,
    alignSelf: 'center',
    // width and marginBottom handled dynamically via props
  },
  blurContainer: {
    overflow: 'hidden',
    // borderRadius and other styling applied dynamically
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    // Dynamic styling applied in component
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 2,
    bottom: 4,
    // borderRadius will be set dynamically to match container
    width: `${(100 / 2) - 1}%`, // Default for 2 tabs, will be overridden by dynamic styles
    // Dynamic styling applied in component
  },
  tabsContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'web' ? 60 : 68,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
    // Dynamic styling applied in component
  },
});
