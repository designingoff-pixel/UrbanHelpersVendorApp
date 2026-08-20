import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JobStatus } from '../data/types';
import { Typography, Radius } from '../theme';

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  NEW_REQUEST:       { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  ACCEPTED:          { bg: '#14532d', border: '#22c55e', text: '#86efac' },
  ADMIN_ASSIGNED:    { bg: '#164e63', border: '#06b6d4', text: '#67e8f9' },
  UPCOMING:          { bg: '#713f12', border: '#f59e0b', text: '#fcd34d' },
  NAVIGATING:        { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  ARRIVED:           { bg: '#14532d', border: '#22c55e', text: '#86efac' },
  OTP_PENDING:       { bg: '#164e63', border: '#06b6d4', text: '#67e8f9' },
  CUSTOMER_VERIFIED: { bg: '#064e3b', border: '#10b981', text: '#6ee7b7' },
  SERVICE_STARTED:   { bg: '#164e63', border: '#06b6d4', text: '#67e8f9' },
  RECORDING_ACTIVE:  { bg: '#450a0a', border: '#ef4444', text: '#fca5a5' },
  RECORDING_STOPPED: { bg: '#064e3b', border: '#10b981', text: '#6ee7b7' },
  COMPLETED:         { bg: '#064e3b', border: '#10b981', text: '#6ee7b7' },
  REJECTED:          { bg: '#1c1c1e', border: '#6b7280', text: '#9ca3af' },
  CANCELLED:         { bg: '#1c1c1e', border: '#6b7280', text: '#9ca3af' },
};

interface Props { status: JobStatus; }

export default function StatusBadge({ status }: Props) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.NEW_REQUEST;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[styles.dot, { backgroundColor: c.text }]} />
      <Text style={[styles.text, { color: c.text }]}>{status.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...Typography.labelMd, fontSize: 11 },
});
