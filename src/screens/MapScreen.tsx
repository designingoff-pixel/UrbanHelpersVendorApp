import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Linking, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ route, navigation }: any) {
  const { jobId } = route.params;
  const [, forceUpdate] = useState(0);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => store.subscribe(() => forceUpdate(n => n + 1)), []);

  const job = store.getJob(jobId);
  if (!job) return null;

  const handleStartNavigation = () => {
    setNavigating(true);
    store.updateJobStatus(jobId, 'NAVIGATING');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}&travelmode=driving`;
    Linking.canOpenURL(url).then(can => {
      if (can) Linking.openURL(url);
      else Alert.alert('Navigation', 'Opening navigation... (Google Maps not installed)');
    });
  };

  const handleArrived = () => {
    store.updateJobStatus(jobId, 'ARRIVED', { arrivedAt: Date.now() });
    Alert.alert("You've Arrived! 🎯", 'Please verify the customer OTP to begin the service.', [
      { text: 'Verify OTP', onPress: () => navigation.navigate('OTP', { jobId }) },
    ]);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${job.customerPhone}`).catch(() =>
      Alert.alert('Call', `Calling ${job.customerName}: ${job.customerPhone}`)
    );
  };

  return (
    <View style={styles.container}>
      {/* Map background */}
      <Image
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvVwrrm0bKLAfMSbw0ScyI-lW4mYMkkxK5ZRCNvhnGysPyIvCC2PdYdO4wlHdZP26LDpY5rC_Z_VSsVzC_3P8sfMEgPNpK_T0kJ6gFBwlgh9oAwHLyH5XblEhCfdN5u-gaS9A34X3D53hjp3_jRzE9QDPFwkFt-blIz-tTc8ZpIjCEd4c7eDw78fGTB2mYoUW1gshEBOTrbOSOSs9-0nzw8dOdMfjj4yh_Ugy2CGMDhEfUH-fxUB9f' }}
        style={styles.mapBg}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[Colors.midnightNavy + '66', 'transparent', Colors.midnightNavy + 'EE']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top controls */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.floatBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        {navigating && (
          <View style={styles.arrivedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
            <Text style={styles.arrivedBannerText}>Navigating to Customer</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('SOS')} style={[styles.floatBtn, styles.sosBtnFloat]}>
          <Ionicons name="warning" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom card */}
      <View style={styles.bottomCard}>
        <View style={styles.handle} />

        {/* Customer row */}
        <View style={styles.customerRow}>
          <Image source={{ uri: job.assignmentType ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhxgiS5x6LXGONs1EpYKtgvANOgaB4ZOXEfO4DayReKarNAljqsEyMLhjdmSasndWzsA_y5bdgeRioGD4AmBmx0CwfeLmDmlhNfXsfCXrZzrG7n4HXDjWe6KWMNEBz-sxm3bgi0Ri8D45WFnIt0cudQHLDQLq_QuElVkTJizz5V-8vNwN7dDo9cZEMZF5g9KwYLoEa7D5lqzoAr4ajCgEiUwwRQERRBU8Q8BuR39YU123UNb3IoZmd' : undefined }}
          style={styles.customerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{job.customerName}</Text>
            <Text style={styles.serviceLabel}>{job.serviceName}</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timePillText}>{job.date} • {job.time}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{job.distance}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Est. Arrival</Text>
            <Text style={[styles.statValue, { color: Colors.accentCyan }]}>12 min</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={handleCall} style={styles.callBtn}>
            <Ionicons name="call" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleStartNavigation} activeOpacity={0.85} style={{ flex: 1, borderRadius: Radius.full, overflow: 'hidden' }}>
            <LinearGradient colors={[Colors.gradientCyanStart, Colors.gradientBlueEnd]} style={styles.navBtn}>
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.navBtnText}>{navigating ? 'Navigating...' : 'Start Navigation'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Arrived */}
        <TouchableOpacity onPress={handleArrived} style={styles.arrivedBtn} activeOpacity={0.85}>
          <Ionicons name="flag" size={20} color="#4ade80" />
          <Text style={styles.arrivedBtnText}>I've Arrived</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.midnightNavy },
  mapBg: { position: 'absolute', width, height, top: 0, left: 0 },
  topRow: {
    position: 'absolute', top: 60, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.gutter, zIndex: 10,
  },
  floatBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.midnightNavy,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.deepBlue, ...Shadows.cardSoft,
  },
  sosBtnFloat: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  arrivedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.midnightNavy, borderWidth: 1, borderColor: '#1e4a6d',
    borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 10,
  },
  arrivedBannerText: { ...Typography.headlineMd, color: Colors.onSurface },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.darkNavy, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.containerPadding, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant + '20', ...Shadows.cardSoft,
  },
  handle: { width: 48, height: 5, borderRadius: 3, backgroundColor: Colors.onSurfaceVariant + '30', alignSelf: 'center', marginBottom: 20 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.cardGap },
  customerAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Colors.deepBlue },
  customerName: { ...Typography.headlineLgMobile, color: Colors.onSurface },
  serviceLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginTop: 2 },
  timePill: { backgroundColor: Colors.deepBlue, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  timePillText: { ...Typography.labelMd, color: Colors.accentCyan },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.cardGap },
  statBox: { flex: 1, backgroundColor: Colors.deepBlue, borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  statLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginBottom: 4 },
  statValue: { ...Typography.headlineMd, color: Colors.onSurface },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  callBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.deepBlue,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.deepBlue,
  },
  navBtn: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  navBtnText: { ...Typography.headlineMd, color: '#fff' },
  arrivedBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#22c55e', borderRadius: Radius.full,
    paddingVertical: 16, backgroundColor: 'rgba(34,197,94,0.1)',
  },
  arrivedBtnText: { ...Typography.headlineMd, color: '#4ade80' },
});
