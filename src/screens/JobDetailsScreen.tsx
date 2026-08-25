import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import StatusBadge from '../components/StatusBadge';
import { Job } from '../data/types';
import { SERVICE_ICONS } from '../data/mockData';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';
import {
  updateBookingStatus,
  acceptJob,
  rejectJob,
  BookingStatus,
} from '../services/firestoreService';

function getPrimaryAction(job: Job): { label: string; icon: string; action: () => void; colors: [string,string] } | null {
  const nav = (screen: string, params?: any) => ({ screen, params });
  const actions: Record<string, any> = {
    NEW_REQUEST:       { label: 'Accept Job', icon: 'checkmark-circle', colors: [Colors.gradientPrimaryStart, Colors.gradientPrimaryEnd] },
    ACCEPTED:          { label: 'Navigate to Customer', icon: 'navigate', colors: [Colors.gradientBlueStart, Colors.gradientBlueEnd] },
    ADMIN_ASSIGNED:    { label: 'Acknowledge & Accept', icon: 'checkmark-circle', colors: [Colors.gradientCyanStart, Colors.gradientCyanEnd] },
    UPCOMING:          { label: 'Navigate to Customer', icon: 'navigate', colors: [Colors.gradientBlueStart, Colors.gradientBlueEnd] },
    NAVIGATING:        { label: "I've Arrived", icon: 'location', colors: [Colors.gradientGreenStart, Colors.gradientGreenEnd] },
    ARRIVED:           { label: 'Verify Customer OTP', icon: 'shield-checkmark', colors: [Colors.gradientBlueStart, Colors.gradientBlueEnd] },
    OTP_PENDING:       { label: 'Verify Customer OTP', icon: 'shield-checkmark', colors: [Colors.gradientBlueStart, Colors.gradientBlueEnd] },
    CUSTOMER_VERIFIED: { label: 'Start Service', icon: 'play-circle', colors: [Colors.gradientEmeraldStart, Colors.gradientEmeraldEnd] },
    SERVICE_STARTED:   { label: 'Open Active Service', icon: 'radio-button-on', colors: [Colors.gradientSOSStart, Colors.gradientSOSEnd] },
    RECORDING_ACTIVE:  { label: 'Open Active Service', icon: 'radio-button-on', colors: [Colors.gradientSOSStart, Colors.gradientSOSEnd] },
    COMPLETED:         { label: 'View Summary', icon: 'trophy', colors: [Colors.gradientGoldEarnStart, Colors.gradientGoldEarnEnd] },
  };
  return actions[job.status] || null;
}

function getSecondaryLabel(job: Job): string | null {
  if (['NEW_REQUEST'].includes(job.status)) return 'Reject';
  return null;
}

export default function JobDetailsScreen({ route, navigation }: any) {
  const { jobId } = route.params;
  const [, forceUpdate] = useState(0);
  useEffect(() => store.subscribe(() => forceUpdate(n => n + 1)), []);

  const job = store.getJob(jobId);
  if (!job) return null;

  const ic = SERVICE_ICONS[job.serviceType] || 'construct';
  const primaryAction = getPrimaryAction(job);
  const secondaryLabel = getSecondaryLabel(job);

  const handlePrimary = async () => {
    switch (job.status) {
      case 'NEW_REQUEST':
        try {
          await acceptJob(job.bookingId, store.vendorId!, store.vendor.name);
          store.updateJobStatus(jobId, 'ACCEPTED', { acceptedAt: Date.now() });
        } catch (e: any) { Alert.alert('Error', e.message); }
        break;

      case 'ACCEPTED':
      case 'UPCOMING':
        await updateBookingStatus(job.bookingId, 'en_route').catch(() => {});
        store.updateJobStatus(jobId, 'NAVIGATING');
        navigation.navigate('Map', { jobId });
        return;

      case 'ADMIN_ASSIGNED':
        try {
          await acceptJob(job.bookingId, store.vendorId!, store.vendor.name);
          store.updateJobStatus(jobId, 'ACCEPTED', { acceptedAt: Date.now() });
        } catch (e: any) { Alert.alert('Error', e.message); }
        break;

      case 'NAVIGATING':
        try {
          await updateBookingStatus(job.bookingId, 'arrived');
          store.updateJobStatus(jobId, 'ARRIVED', { arrivedAt: Date.now() });
          Alert.alert("You've Arrived!", 'Please verify the customer OTP.');
        } catch (e: any) { Alert.alert('Error', e.message); }
        break;

      case 'ARRIVED':
      case 'OTP_PENDING':
        await updateBookingStatus(job.bookingId, 'arrived').catch(() => {});
        store.updateJobStatus(jobId, 'OTP_PENDING');
        navigation.navigate('OTP', { jobId });
        return;

      case 'CUSTOMER_VERIFIED':
        // in_progress is written by OTPScreen's verifyOTP call — just navigate
        store.startRecording(jobId);
        navigation.navigate('Service', { jobId });
        return;

      case 'SERVICE_STARTED':
      case 'RECORDING_ACTIVE':
        navigation.navigate('Service', { jobId });
        return;

      case 'COMPLETED':
        navigation.navigate('Complete', { jobId });
        return;
    }
  };

  const handleSecondary = () => {
    Alert.alert('Reject Job', 'Are you sure you want to reject this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          try {
            await rejectJob(job.bookingId);
            store.updateJobStatus(jobId, 'REJECTED');
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: Spacing.containerPadding, paddingBottom: 120 }}>
        {/* Job Header Card */}
        <View style={styles.jobCard}>
          <LinearGradient colors={[Colors.accentCyan, Colors.accentBlue]} style={styles.accentStrip} />
          <View style={styles.jobCardBody}>
            {/* Assignment badge */}
            {job.assignmentType === 'ADMIN_ASSIGNED' ? (
              <View style={styles.assignBadge}>
                <Ionicons name="person-add" size={12} color={Colors.accentCyan} />
                <Text style={styles.assignBadgeText}>ASSIGNED BY URBAN CAPTAIN</Text>
              </View>
            ) : (
              <View style={[styles.assignBadge, { backgroundColor: 'rgba(37,99,235,0.15)', borderColor: '#3b82f630' }]}>
                <Ionicons name="person" size={12} color="#93c5fd" />
                <Text style={[styles.assignBadgeText, { color: '#93c5fd' }]}>CUSTOMER REQUEST</Text>
              </View>
            )}

            <View style={styles.jobTop}>
              <View>
                <View style={styles.serviceRow}>
                  <Ionicons name={ic as any} size={22} color={Colors.accentCyan} />
                  <Text style={styles.serviceName}>{job.serviceName}</Text>
                </View>
                <Text style={styles.bookingId}>Booking ID: {job.bookingId}</Text>
              </View>
              <StatusBadge status={job.status} />
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}><Ionicons name="person" size={20} color={Colors.primary} /></View>
                <View>
                  <Text style={styles.infoLabel}>Customer</Text>
                  <Text style={styles.infoValue}>{job.customerName}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}><Ionicons name="card" size={20} color={Colors.accentCyan} /></View>
                <View>
                  <Text style={styles.infoLabel}>Your Earnings</Text>
                  <Text style={[styles.infoValue, { color: Colors.accentCyan }]}>₹{job.vendorEarnings}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Detail Rows */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Ionicons name="time" size={20} color={Colors.primary} /></View>
            <View><Text style={styles.infoLabel}>Date & Time</Text><Text style={styles.infoValue}>{job.date} • {job.time}</Text></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Ionicons name="timer" size={20} color={Colors.primary} /></View>
            <View><Text style={styles.infoLabel}>Duration</Text><Text style={styles.infoValue}>{job.estimatedDuration}</Text></View>
          </View>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Ionicons name="location" size={20} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{job.address}</Text>
              <Text style={[styles.infoLabel, { color: Colors.primary, marginTop: 4 }]}>{job.distance} away</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Ionicons name="information-circle" size={20} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Customer Instructions</Text>
              <View style={styles.instructionBox}>
                <Text style={styles.instructionText}>"{job.customerInstructions}"</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Ionicons name="wallet" size={20} color="#4ade80" /></View>
            <View>
              <Text style={styles.infoLabel}>Payment Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
                <Text style={[styles.infoValue, { color: '#4ade80' }]}>🟢 PAYMENT PAID</Text>
              </View>
              <Text style={[styles.infoLabel, { marginTop: 4 }]}>Customer has paid. No cash collection needed.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        {secondaryLabel && (
          <TouchableOpacity onPress={handleSecondary} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </TouchableOpacity>
        )}
        {primaryAction && (
          <TouchableOpacity onPress={handlePrimary} activeOpacity={0.85} style={{ flex: secondaryLabel ? 2 : 1, borderRadius: Radius.full, overflow: 'hidden' }}>
            <LinearGradient colors={primaryAction.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>{primaryAction.label}</Text>
              <Ionicons name={primaryAction.icon as any} size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.midnightNavy },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter, height: 56,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '40',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...Typography.headlineLgMobile, color: Colors.onSurface },
  scroll: { flex: 1 },
  jobCard: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.lg,
    flexDirection: 'row', overflow: 'hidden', marginBottom: Spacing.cardGap,
    borderWidth: 1, borderColor: Colors.outlineVariant + '30', ...Shadows.cardSoft,
  },
  accentStrip: { width: 6 },
  jobCardBody: { flex: 1, padding: Spacing.containerPadding, gap: 12 },
  assignBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(6,182,212,0.15)', borderWidth: 1, borderColor: '#06b6d430',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
  },
  assignBadgeText: { ...Typography.labelMd, fontSize: 10, color: Colors.accentCyan },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  serviceName: { ...Typography.headlineMd, color: Colors.onSurface },
  bookingId: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  infoRow: { gap: 8 },
  infoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.deepBlue, padding: 14, borderRadius: Radius.lg,
  },
  infoIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant + '50',
  },
  infoLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginBottom: 2 },
  infoValue: { ...Typography.bodyLg, color: Colors.onSurface, fontWeight: '600' },
  detailCard: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.lg,
    padding: Spacing.containerPadding, marginBottom: Spacing.cardGap,
    borderWidth: 1, borderColor: Colors.outlineVariant + '30', ...Shadows.cardSoft, gap: 12,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  detailIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.deepBlue, justifyContent: 'center', alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: Colors.outlineVariant + '30' },
  instructionBox: {
    backgroundColor: Colors.midnightNavy + '80', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.outlineVariant + '30', padding: 10, marginTop: 6,
  },
  instructionText: { ...Typography.bodyMd, color: Colors.onSurface, fontStyle: 'italic' },
  actionBar: {
    flexDirection: 'row', gap: 14,
    padding: Spacing.gutter, paddingBottom: Spacing.containerPadding,
    backgroundColor: Colors.darkNavy, borderTopWidth: 1, borderTopColor: Colors.outlineVariant + '30',
  },
  secondaryBtn: {
    flex: 1, height: 56, justifyContent: 'center', alignItems: 'center',
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineVariant + '80',
  },
  secondaryText: { ...Typography.labelMd, color: Colors.onSurface },
  primaryBtn: {
    height: 56, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8, paddingHorizontal: 24,
  },
  primaryText: { ...Typography.headlineMd, color: '#fff', fontWeight: '700' },
});
