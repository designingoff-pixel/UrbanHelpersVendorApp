import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import JobsScreen from '../screens/JobsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JobDetailsScreen from '../screens/JobDetailsScreen';
import MapScreen from '../screens/MapScreen';
import OTPScreen from '../screens/OTPScreen';
import ServiceScreen from '../screens/ServiceScreen';
import CompleteScreen from '../screens/CompleteScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

import { Colors, Typography, Radius } from '../theme';
import { store } from '../store/AppStore';

const Stack = createNativeStackNavigator();

// ── Custom Tab Bar (no Reanimated dependency) ──────────────────────────────
const TABS = [
  { name: 'Home',     icon: 'home',      iconOut: 'home-outline'      },
  { name: 'Jobs',     icon: 'briefcase', iconOut: 'briefcase-outline'  },
  { name: 'Earnings', icon: 'wallet',    iconOut: 'wallet-outline'     },
  { name: 'Profile',  icon: 'person',    iconOut: 'person-outline'     },
];

const TAB_SCREENS: Record<string, React.ComponentType<any>> = {
  Home:     HomeScreen,
  Jobs:     JobsScreen,
  Earnings: EarningsScreen,
  Profile:  ProfileScreen,
};

function CustomTabBar({ activeTab, onTabPress }: { activeTab: string; onTabPress: (name: string) => void }) {
  return (
    <View style={tabStyles.bar}>
      {TABS.map(tab => {
        const active = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={tabStyles.item}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}>
            <View style={[tabStyles.iconWrap, active && tabStyles.iconWrapActive]}>
              <Ionicons
                name={(active ? tab.icon : tab.iconOut) as any}
                size={22}
                color={active ? Colors.onSecondaryContainer : Colors.onSurfaceVariant}
              />
            </View>
            <Text style={[tabStyles.label, active && tabStyles.labelActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main Tabs container (no @react-navigation/bottom-tabs) ─────────────────
function MainTabsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('Home');

  const handleTabPress = (name: string) => {
    setActiveTab(name);
  };

  const ActiveScreen = TAB_SCREENS[activeTab] ?? HomeScreen;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.midnightNavy }}>
      <View style={{ flex: 1 }}>
        <ActiveScreen navigation={navigation} route={{ params: {} }} />
      </View>
      <CustomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

// ── Root Navigator ─────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login"         component={LoginScreen} />
        <Stack.Screen name="MainTabs"      component={MainTabsScreen} />
        <Stack.Screen name="JobDetails"    component={JobDetailsScreen} />
        <Stack.Screen name="Map"           component={MapScreen} />
        <Stack.Screen name="OTP"           component={OTPScreen} />
        <Stack.Screen
          name="Service"
          component={ServiceScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="Complete"
          component={CompleteScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    height: Platform.OS === 'ios' ? 82 : 68,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    padding: 5,
    borderRadius: Radius.md,
  },
  iconWrapActive: {
    backgroundColor: Colors.secondaryContainer,
  },
  label: {
    ...Typography.labelMd,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  labelActive: {
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
});
