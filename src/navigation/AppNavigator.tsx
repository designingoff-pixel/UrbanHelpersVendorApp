import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

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
import EditProfileScreen from '../screens/EditProfileScreen';

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
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'Login' | 'MainTabs'>('Login');

  useEffect(() => {
    let timeout = setTimeout(() => {
      setCheckingAuth(false);
    }, 2500);

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'vendors', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            store.setFirebaseUser(firebaseUser.uid, data.name ?? 'Vendor', data.mobile ?? '');
          } else {
            store.setFirebaseUser(firebaseUser.uid, 'Vendor', '');
          }
        } catch (e) {
          console.warn('[AppNavigator] Error fetching vendor profile:', e);
          store.setFirebaseUser(firebaseUser.uid, 'Vendor', '');
        }
        setInitialRoute('MainTabs');
      } else {
        setInitialRoute('Login');
      }
      setCheckingAuth(false);
    });

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.midnightNavy, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
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
        <Stack.Screen name="EditProfile"   component={EditProfileScreen} />
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
