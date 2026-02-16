import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
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

// Largeur max de la barre sur web (évite qu'elle soit trop large sur grands écrans)
const WEB_TAB_BAR_MAX_WIDTH = 480;
const MOBILE_HORIZONTAL_PADDING = 40;

export default function FloatingTabBar({
  tabs,
  containerWidth: propContainerWidth,
  borderRadius = 35,
  bottomMargin
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const animatedValue = useSharedValue(0);
  const { width: screenWidth } = useWindowDimensions();

  // Responsive : sur web, adapte à la largeur avec un max ; sur mobile, pleine largeur moins padding
  const containerWidth = (propContainerWidth != null ? propContainerWidth : (
    Platform.OS === 'web'
      ? Math.min(screenWidth - MOBILE_HORIZONTAL_PADDING, WEB_TAB_BAR_MAX_WIDTH)
      : screenWidth - MOBILE_HORIZONTAL_PADDING
  ));

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

  // Routes qui appartiennent au tab Profil (ex: factures accessibles depuis Profil)
  const profileRelatedPaths = ['/invoices'];

  // Improved active tab detection with better path matching
  const activeTabIndex = React.useMemo(() => {
    const pathnameStr = typeof pathname === 'string' ? pathname : String(pathname);

    // Si on est sur une route liée au Profil (ex: factures), sélectionner le tab Profil
    if (profileRelatedPaths.some(path => pathnameStr.includes(path))) {
      const profileIndex = tabs.findIndex(tab => tab.name === 'profile');
      if (profileIndex >= 0) return profileIndex;
    }

    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;

      // Exact route match gets highest score
      if (pathnameStr === String(tab.route)) {
        score = 100;
      }
      // Check if pathname starts with tab route (for nested routes)
      else if (pathnameStr.startsWith(String(tab.route))) {
        score = 80;
      }
      // Check if pathname contains the tab name
      else if (pathnameStr.includes(tab.name)) {
        score = 60;
      }
      // Check for partial matches in the route
      else if (String(tab.route).includes('/(tabs)/')) {
        const routePart = String(tab.route).split('/(tabs)/')[1];
        if (routePart && pathnameStr.includes(routePart)) score = 40;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

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

  // Légèrement plus large pour combler le gap à droite sur le dernier onglet
  const tabWidthPercent = (100 / tabs.length).toFixed(2);

  // Padding asymétrique
  const paddingLeft = 4;
  const paddingRight = 6;
  const extraRightOffset = 6; // Extension à droite pour que l'indicateur touche le bord sur Profil

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = (containerWidth - paddingLeft - paddingRight) / tabs.length;
    const maxTranslateX = tabWidth * (tabs.length - 1) + extraRightOffset;
    return {
      transform: [
        {
          translateX: interpolate(
            animatedValue.value,
            [0, tabs.length - 1],
            [0, maxTranslateX]
          ),
        },
      ],
    };
  });

  // Calculate indicator border radius to match container
  const indicatorBorderRadius = borderRadius - 2;

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
    top: 2,
    left: 2,
    bottom: 2,
    // borderRadius will be set dynamically to match container
    width: `${(100 / 2) - 1}%`, // Default for 2 tabs, will be overridden by dynamic styles
    // Dynamic styling applied in component
  },
  tabsContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'web' ? 60 : 68,
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 6,
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
