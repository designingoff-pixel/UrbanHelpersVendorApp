import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Job } from '../data/types';
import { SERVICE_ICONS } from '../data/mockData';
import StatusBadge from './StatusBadge';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

interface Props {
  job: Job;
  onPress: (job: Job) => void;
}

export default function JobCard({ job, onPress }: Props) {
  const iconName = (SERVICE_ICONS[job.serviceType] || 'construct') as any;
  const isAdmin = job.assignmentType === 'ADMIN_ASSIGNED';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(job)} style={styles.card}>
      {/* Left accent strip */}
      <LinearGradient
        colors={[Colors.gradientCyanStart, Colors.gradientCyanEnd]}
        style={styles.accentStrip}
      />
      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.row}>
          <LinearGradient colors={[Colors.gradientCyanStart, Colors.gradientCyanEnd]} style={styles.iconCircle}>
            <Ionicons name={iconName} size={22} color="#fff" />
          </LinearGradient>
          <View style={styles.titleBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.serviceName}>{job.serviceName}</Text>
              {isAdmin && (
                <View style={styles.adminPill}>
                  <Text style={styles.adminPillText}>Admin</Text>
                </View>
              )}
            </View>
            <View style={styles.customerRow}>
              <Ionicons name="person" size={12} color={Colors.onSurfaceVariant} />
              <Text style={styles.customerName}>{job.customerName}</Text>
            </View>
          </View>
          <StatusBadge status={job.status} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SCHEDULE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time" size={14} color={Colors.primary} />
              <Text style={styles.statValue}>{job.date} • {job.time}</Text>
            </View>
          </View>
          <View style={styles.statItemRight}>
            <Text style={styles.statLabel}>EARNINGS</Text>
            <Text style={[styles.statValue, { color: '#4ade80', ...Typography.headlineMd }]}>₹{job.vendorEarnings}</Text>
          </View>
        </View>

        {/* Distance */}
        <View style={styles.distanceRow}>
          <Ionicons name="location" size={14} color={Colors.primary} />
          <Text style={styles.distanceText}>{job.distance} away</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.lg,
    marginBottom: Spacing.cardGap, flexDirection: 'row',
    overflow: 'hidden', ...Shadows.cardSoft,
  },
  accentStrip: { width: 5 },
  body: { flex: 1, padding: Spacing.gutter },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  titleBlock: { flex: 1 },
  serviceName: { ...Typography.headlineMd, color: Colors.onSurface },
  adminPill: {
    backgroundColor: 'rgba(37,99,235,0.3)', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#3b82f670',
  },
  adminPillText: { ...Typography.labelMd, fontSize: 10, color: '#93c5fd' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  customerName: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.surfaceVariant + '80',
    marginBottom: 10,
  },
  statItem: {},
  statItemRight: { alignItems: 'flex-end' },
  statLabel: { ...Typography.labelMd, fontSize: 10, color: Colors.onSurfaceVariant, marginBottom: 4 },
  statValue: { ...Typography.bodyLg, color: Colors.onSurface },
  distanceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  distanceText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
});
