import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

export default function CompleteScreen({ route, navigation }: any) {
  const { jobId } = route.params;
  const job = store.getJob(jobId);
  if (!job) return null;

  const secs = store.recordingSeconds;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Success Icon */}
        <View style={styles.iconWrap}>
          <LinearGradient colors={['#34d399', '#0d9488']} style={styles.iconCircle}>
            <Ionicons name="trophy" size={52} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Service Completed!</Text>
        <Text style={styles.subtitle}>Great job! Your earnings have been updated.</Text>

        {/* Summary Card */}
        <View style={styles.card}>
          {[
            { label: 'Customer', value: job.customerName },
            { label: 'Service', value: job.serviceName },
            { label: 'Duration', value: durationStr },
          ].map(({ label, value }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Recording</Text>
            <View style={styles.recordingStatus}>
              <Ionicons name="checkmark-circle" size={14} color="#34d399" />
              <Text style={styles.recordingText}>Saved</Text>
            </View>
          </View>

          <View style={[styles.row, styles.bordered]}>
            <Text style={styles.rowLabel}>Payment Status</Text>
            <View style={styles.paidBadge}>
              <View style={styles.paidDot} />
              <Text style={styles.paidText}>🟢 PAID</Text>
            </View>
          </View>

          <View style={[styles.row, styles.bordered]}>
            <Text style={styles.rowLabel}>Your Earnings</Text>
            <Text style={styles.earningsValue}>₹{job.vendorEarnings}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Earnings' })} activeOpacity={0.85} style={{ borderRadius: Radius.full, overflow: 'hidden' }}>
            <LinearGradient colors={[Colors.gradientBlueStart, Colors.gradientBlueEnd]} style={styles.actionBtn}>
              <Ionicons name="wallet" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>View Earnings</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })} style={styles.secondaryBtn} activeOpacity={0.85}>
            <Ionicons name="home" size={20} color={Colors.onSurface} />
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.midnightNavy },
  scroll: { flexGrow: 1, alignItems: 'center', padding: Spacing.containerPadding, paddingTop: 80, paddingBottom: 60 },
  iconWrap: { marginBottom: 24 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', ...Shadows.cardSoft },
  title: { ...Typography.displayLg, color: Colors.onSurface, textAlign: 'center', marginBottom: 8 },
  subtitle: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', marginBottom: 32 },
  card: {
    width: '100%', backgroundColor: Colors.darkNavy, borderRadius: Radius.xl,
    padding: Spacing.containerPadding, borderWidth: 1, borderColor: Colors.outlineVariant + '30',
    ...Shadows.cardSoft, gap: 12, marginBottom: 32,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  rowValue: { ...Typography.bodyLg, color: Colors.onSurface, fontWeight: '600' },
  recordingStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recordingText: { ...Typography.labelMd, color: '#34d399' },
  bordered: { paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.outlineVariant + '30' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paidDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  paidText: { ...Typography.labelMd, color: '#4ade80' },
  earningsValue: { ...Typography.displayLg, color: '#4ade80', fontSize: 32 },
  actions: { width: '100%', gap: 14 },
  actionBtn: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionBtnText: { ...Typography.headlineMd, color: '#fff' },
  secondaryBtn: {
    height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: Colors.darkNavy, borderWidth: 1, borderColor: Colors.outlineVariant,
    borderRadius: Radius.full,
  },
  secondaryBtnText: { ...Typography.headlineMd, color: Colors.onSurface },
});
