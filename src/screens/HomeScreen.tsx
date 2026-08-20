import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

export default function HomeScreen({ navigation }: any) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return store.subscribe(() => forceUpdate(n => n + 1));
  }, []);

  const vendor = store.vendor;
  const newRequest = store.jobs.find(j => j.status === 'NEW_REQUEST');
  const adminJob = store.jobs.find(j => j.status === 'ADMIN_ASSIGNED');
  const todayCompleted = store.jobs.filter(j => j.status === 'COMPLETED' && j.date === 'Today').length;

  const acceptJob = (jobId: string) => {
    store.updateJobStatus(jobId, 'ACCEPTED', { acceptedAt: Date.now() });
    Alert.alert('Job Accepted ✅', 'Navigate to the customer location.');
  };

  const rejectJob = (jobId: string) => {
    store.updateJobStatus(jobId, 'REJECTED');
    Alert.alert('Job Rejected', 'The job has been passed to the next vendor.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: vendor.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.greeting}>Good Morning, {vendor.name.split(' ')[0]} 👋</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
          <Ionicons name="notifications" size={24} color={Colors.primary} />
          {store.unreadCount > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Online Toggle */}
        <View style={styles.onlineCard}>
          <View style={styles.onlineLeft}>
            <View style={[styles.dot, { backgroundColor: vendor.isOnline ? Colors.greenActive : Colors.mutedGrey }]} />
            <Text style={[styles.onlineText, { color: vendor.isOnline ? '#4ade80' : Colors.onSurfaceVariant }]}>
              {vendor.isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
          <Switch
            value={vendor.isOnline}
            onValueChange={v => store.toggleOnline(v)}
            trackColor={{ false: Colors.mutedGrey, true: Colors.gradientGreenStart }}
            thumbColor="#fff"
          />
          <Text style={styles.onlineDesc}>
            {vendor.isOnline ? "You're ready to receive new jobs." : 'Toggle online to receive jobs.'}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <LinearGradient colors={[Colors.deepBlue, Colors.darkNavy]} style={styles.statCard}>
            <LinearGradient colors={[Colors.gradientBlueStart + '33', Colors.gradientBlueEnd + '00']} style={StyleSheet.absoluteFill} />
            <Text style={styles.statLabel}>TODAY'S JOBS</Text>
            <Text style={styles.statBig}>{todayCompleted}</Text>
          </LinearGradient>
          <LinearGradient colors={[Colors.deepBlue, Colors.darkNavy]} style={[styles.statCard, { borderTopWidth: 2, borderTopColor: Colors.gradientGoldStart }]}>
            <LinearGradient colors={[Colors.gradientGoldStart + '20', Colors.gradientGoldEnd + '00']} style={StyleSheet.absoluteFill} />
            <Text style={styles.statLabel}>EARNINGS</Text>
            <Text style={[styles.statBig, { fontSize: 22 }]}>₹{vendor.todayEarnings.toLocaleString('en-IN')}</Text>
          </LinearGradient>
          <LinearGradient colors={[Colors.deepBlue, Colors.darkNavy]} style={[styles.statCard, { borderTopWidth: 2, borderTopColor: Colors.gradientPurpleStart }]}>
            <LinearGradient colors={[Colors.gradientPurpleStart + '20', Colors.gradientPurpleEnd + '00']} style={StyleSheet.absoluteFill} />
            <Text style={styles.statLabel}>RATING</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.statBig}>{vendor.rating}</Text>
              <Text style={{ fontSize: 18 }}>⭐</Text>
            </View>
          </LinearGradient>
        </View>

        {/* New Request */}
        {vendor.isOnline && newRequest ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New Request</Text>
            <View style={styles.requestCard}>
              <LinearGradient colors={[Colors.gradientBlueStart, Colors.gradientBlueEnd]} style={styles.leftStrip} />
              <View style={styles.requestBody}>
                <View style={styles.requestTop}>
                  <View style={styles.requestBadge}>
                    <Ionicons name="notifications" size={12} color="#93c5fd" />
                    <Text style={styles.requestBadgeText}>NEW SERVICE REQUEST</Text>
                  </View>
                  <Text style={styles.requestEarnings}>₹{newRequest.vendorEarnings}</Text>
                </View>
                <Text style={styles.requestService}>
                  <Ionicons name="home" size={18} color={Colors.gradientBlueStart} />{'  '}{newRequest.serviceName}
                </Text>
                <Text style={styles.requestCustomer}>Customer: {newRequest.customerName}</Text>
                <View style={styles.requestMeta}>
                  <View style={styles.metaPill}><Text style={styles.metaText}>📍 {newRequest.distance} away</Text></View>
                  <View style={styles.metaPill}><Text style={styles.metaText}>⏰ {newRequest.date} • {newRequest.time}</Text></View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => { acceptJob(newRequest.jobId); navigation.navigate('JobDetails', { jobId: newRequest.jobId }); }}
                    activeOpacity={0.85}>
                    <LinearGradient colors={[Colors.gradientBlueStart, Colors.gradientBlueEnd]} style={styles.acceptGradient}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.acceptText}>Accept</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectJob(newRequest.jobId)} activeOpacity={0.85}>
                    <Ionicons name="close-circle" size={18} color={Colors.onSurface} />
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.section, styles.emptySection]}>
            <Ionicons name="checkmark-done-circle" size={48} color={Colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>{vendor.isOnline ? 'No new requests right now.' : 'Go online to receive jobs.'}</Text>
          </View>
        )}

        {/* Admin Assigned */}
        {adminJob && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned to You</Text>
            <View style={[styles.adminCard, { borderColor: '#164e6380', borderWidth: 1 }]}>
              <View style={styles.adminBadge}>
                <Ionicons name="person-add" size={12} color={Colors.accentCyan} />
                <Text style={styles.adminBadgeText}>ASSIGNED BY URBAN CAPTAIN</Text>
              </View>
              <Text style={styles.adminService}>
                <Ionicons name="water" size={18} color={Colors.accentCyan} />{'  '}{adminJob.serviceName}
              </Text>
              <Text style={styles.adminCustomer}>Customer: {adminJob.customerName}</Text>
              <Text style={styles.adminDist}>📍 {adminJob.distance} away</Text>
              <TouchableOpacity
                onPress={() => { store.setCurrentJob(adminJob.jobId); navigation.navigate('JobDetails', { jobId: adminJob.jobId }); }}
                style={styles.viewDetailsBtn}
                activeOpacity={0.85}>
                <Text style={styles.viewDetailsText}>View Job Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.midnightNavy },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.gutter, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '40',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.deepBlue },
  greeting: { ...Typography.headlineLgMobile, color: Colors.onSurface },
  notifBtn: { padding: 8, position: 'relative' },
  badge: {
    position: 'absolute', top: 6, right: 6, width: 10, height: 10,
    backgroundColor: '#ef4444', borderRadius: 5, borderWidth: 2, borderColor: Colors.surface,
  },
  scroll: { flex: 1, paddingHorizontal: Spacing.gutter },
  onlineCard: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.DEFAULT,
    padding: Spacing.containerPadding, marginTop: Spacing.cardGap,
    ...Shadows.cardSoft, flexWrap: 'wrap', gap: 8,
  },
  onlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '80%' },
  dot: { width: 14, height: 14, borderRadius: 7 },
  onlineText: { ...Typography.headlineMd },
  onlineDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, width: '100%' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.cardGap },
  statCard: {
    flex: 1, borderRadius: Radius.DEFAULT, padding: 14,
    height: 112, justifyContent: 'space-between', ...Shadows.cardSoft, overflow: 'hidden',
  },
  statLabel: { ...Typography.labelMd, fontSize: 10, color: Colors.onSurfaceVariant },
  statBig: { ...Typography.displayLg, color: Colors.onSurface, fontSize: 28 },
  section: { marginTop: Spacing.sectionMargin },
  sectionTitle: { ...Typography.headlineMd, color: Colors.onSurface, marginBottom: 12 },
  emptySection: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  requestCard: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.DEFAULT,
    overflow: 'hidden', flexDirection: 'row', ...Shadows.cardSoft,
  },
  leftStrip: { width: 6 },
  requestBody: { flex: 1, padding: Spacing.containerPadding, gap: 8 },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(37,99,235,0.2)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: Radius.full,
  },
  requestBadgeText: { ...Typography.labelMd, fontSize: 10, color: '#93c5fd' },
  requestEarnings: { ...Typography.headlineMd, color: '#4ade80' },
  requestService: { ...Typography.headlineLgMobile, color: Colors.onSurface },
  requestCustomer: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  requestMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaPill: { backgroundColor: Colors.deepBlue, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md },
  metaText: { ...Typography.labelMd, color: Colors.onSurface },
  requestActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  acceptBtn: { flex: 1, borderRadius: Radius.md, overflow: 'hidden' },
  acceptGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14 },
  acceptText: { ...Typography.headlineMd, color: '#fff' },
  rejectBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, backgroundColor: Colors.deepBlue, borderWidth: 1,
    borderColor: Colors.mutedGrey, borderRadius: Radius.md, paddingVertical: 14,
  },
  rejectText: { ...Typography.headlineMd, color: Colors.onSurface },
  adminCard: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.DEFAULT,
    padding: Spacing.containerPadding, gap: 8, ...Shadows.cardSoft,
  },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(6,182,212,0.15)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start',
  },
  adminBadgeText: { ...Typography.labelMd, fontSize: 10, color: Colors.accentCyan },
  adminService: { ...Typography.headlineLgMobile, color: Colors.onSurface },
  adminCustomer: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  adminDist: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  viewDetailsBtn: {
    backgroundColor: Colors.deepBlue, borderWidth: 1, borderColor: '#1e4a6d',
    borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  viewDetailsText: { ...Typography.headlineMd, color: '#60a5fa' },
});
