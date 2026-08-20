import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

const SERVICE_EMOJI: Record<string, string> = {
  'Home Cleaning': '🏠', 'Plumbing': '🔧', 'RO Service': '💧',
  'Electrical': '⚡', 'Appliance Repair': '🔌', 'Pest Control': '🐛', 'Carpentry': '🪚',
};
const BORDER_COLORS = ['#3B82F6', '#F59E0B', '#06B6D4', '#8B5CF6', '#10B981'];

export default function EarningsScreen({ navigation }: any) {
  const [, forceUpdate] = useState(0);
  useEffect(() => store.subscribe(() => forceUpdate(n => n + 1)), []);

  const { vendor } = store;
  const completed = store.jobs.filter(j => j.status === 'COMPLETED');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero Card */}
        <LinearGradient colors={[Colors.gradientGoldEarnStart, Colors.gradientGoldEarnEnd]} style={styles.heroCard}>
          <View style={styles.heroPattern} />
          <Text style={styles.heroLabel}>TODAY</Text>
          <Text style={styles.heroAmount}>₹{vendor.todayEarnings.toLocaleString('en-IN')}</Text>
          <View style={styles.heroTrend}>
            <Ionicons name="trending-up" size={14} color="#fff" />
            <Text style={styles.heroTrendText}>12% vs yesterday</Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Jobs Completed</Text>
              <Text style={styles.heroStatValue}>{completed.length}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Time Online</Text>
              <Text style={styles.heroStatValue}>6h 15m</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>THIS WEEK</Text>
            <Text style={styles.statAmount}>₹{vendor.weekEarnings.toLocaleString('en-IN')}</Text>
            <View style={styles.trend}><Ionicons name="trending-up" size={14} color="#4ade80" /><Text style={styles.trendText}>+5.2%</Text></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>THIS MONTH</Text>
            <Text style={[styles.statAmount, styles.goldText]}>₹{vendor.monthEarnings.toLocaleString('en-IN')}</Text>
            <View style={styles.trend}><Ionicons name="trending-up" size={14} color="#4ade80" /><Text style={styles.trendText}>+12.8%</Text></View>
          </View>
        </View>

        {/* Sparkline Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Last 7 Days</Text>
          <View style={styles.chartBars}>
            {[800, 1100, 950, 1400, 1200, 1600, vendor.todayEarnings].map((v, i) => {
              const pct = v / 1800;
              const isToday = i === 6;
              return (
                <View key={i} style={styles.barWrap}>
                  <View style={[styles.bar, { height: `${Math.max(pct * 100, 8)}%` as any, backgroundColor: isToday ? Colors.gradientGoldEarnStart : Colors.deepBlue }]} />
                  <Text style={[styles.barLabel, isToday && { color: Colors.onSurface, fontWeight: '700' }]}>
                    {['M','T','W','T','F','S','S'][i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Jobs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Jobs</Text>
          {completed.length === 0 ? (
            <Text style={styles.emptyText}>No completed jobs yet.</Text>
          ) : (
            completed.map((job, i) => (
              <View key={job.jobId} style={[styles.jobItem, { borderLeftColor: BORDER_COLORS[i % BORDER_COLORS.length] }]}>
                <View style={styles.jobEmoji}><Text style={{ fontSize: 22 }}>{SERVICE_EMOJI[job.serviceType] || '🔨'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobName}>{job.serviceName}</Text>
                  <Text style={styles.jobCustomer}>{job.customerName} • {job.time}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.jobAmount}>₹{job.vendorEarnings}</Text>
                  <View style={styles.paidRow}>
                    <View style={styles.paidDot} />
                    <Text style={styles.paidText}>PAID</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
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
  headerTitle: { ...Typography.headlineLgMobile, color: Colors.onSurface },
  scroll: { padding: Spacing.containerPadding, paddingBottom: 100 },
  heroCard: {
    borderRadius: Radius.xl, padding: Spacing.containerPadding, marginBottom: Spacing.cardGap,
    overflow: 'hidden', ...Shadows.cardSoft,
  },
  heroPattern: { position: 'absolute', inset: 0, opacity: 0.08 },
  heroLabel: { ...Typography.labelMd, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginBottom: 6 },
  heroAmount: { fontSize: 40, fontWeight: '800', color: '#fff', marginBottom: 8 },
  heroTrend: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start', marginBottom: 16 },
  heroTrendText: { ...Typography.labelMd, color: '#fff' },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: Radius.DEFAULT, padding: 12 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroStatLabel: { ...Typography.labelMd, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  heroStatValue: { ...Typography.headlineMd, color: '#fff' },
  statsGrid: { flexDirection: 'row', gap: Spacing.cardGap, marginBottom: Spacing.cardGap },
  statCard: { flex: 1, backgroundColor: Colors.darkNavy, borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  statLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, fontSize: 11, marginBottom: 8 },
  statAmount: { ...Typography.headlineLg, color: Colors.onSurface, fontWeight: '700' },
  goldText: { color: Colors.gradientGoldEarnStart },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  trendText: { ...Typography.labelMd, color: '#4ade80' },
  chartCard: { backgroundColor: Colors.darkNavy, borderRadius: Radius.lg, padding: Spacing.containerPadding, marginBottom: Spacing.cardGap, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  chartTitle: { ...Typography.headlineMd, color: Colors.onSurface, marginBottom: 20 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100 },
  barWrap: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { ...Typography.labelMd, fontSize: 10, color: Colors.onSurfaceVariant },
  section: { marginBottom: Spacing.sectionMargin },
  sectionTitle: { ...Typography.headlineMd, color: Colors.onSurface, marginBottom: 14 },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  jobItem: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.md, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderLeftWidth: 4, marginBottom: 10,
  },
  jobEmoji: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.deepBlue, justifyContent: 'center', alignItems: 'center' },
  jobName: { ...Typography.bodyLg, color: Colors.onSurface, fontWeight: '600' },
  jobCustomer: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  jobAmount: { ...Typography.headlineMd, color: Colors.onSurface, fontWeight: '700' },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paidDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  paidText: { ...Typography.labelMd, fontSize: 11, color: '#4ade80' },
});
