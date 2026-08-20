import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.onSecondaryContainer,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: { ...Typography.labelMd, fontSize: 11, marginBottom: 4 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:     ['home', 'home-outline'],
            Jobs:     ['briefcase', 'briefcase-outline'],
            Map:      ['map', 'map-outline'],
            Earnings: ['wallet', 'wallet-outline'],
            Profile:  ['person', 'person-outline'],
          };
          const [filled, outline] = icons[route.name] || ['ellipse', 'ellipse-outline'];
          return (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Ionicons name={(focused ? filled : outline) as any} size={22} color={color} />
            </View>
          );
        },
        tabBarBackground: () => (
          <View style={styles.tabBackground} />
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Map"
        component={MapScreen}
        initialParams={{ jobId: 'JOB001' }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            // Navigate to map only if there's an active job
            const { store } = require('../store/AppStore');
            const activeJob = store.jobs.find((j: any) =>
              ['ACCEPTED','NAVIGATING','ARRIVED','OTP_PENDING','CUSTOMER_VERIFIED','SERVICE_STARTED','RECORDING_ACTIVE'].includes(j.status)
            );
            if (activeJob) navigation.navigate('Map', { jobId: activeJob.jobId });
            else navigation.navigate('Jobs');
          }
        })}
      />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
        <Stack.Screen name="Map" component={MapScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="OTP" component={OTPScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Service" component={ServiceScreen} options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="Complete" component={CompleteScreen} options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
    height: 76, paddingBottom: 10, paddingTop: 6,
  },
  tabBackground: {
    flex: 1, backgroundColor: Colors.surfaceContainerLowest,
  },
  tabIcon: {
    padding: 6, borderRadius: Radius.md,
  },
  tabIconActive: {
    backgroundColor: Colors.secondaryContainer,
  },
});
