import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import JobCard from '../components/JobCard';
import { Colors, Typography, Spacing, Radius } from '../theme';

const TABS = [
  { key: 'requests', label: 'Requests' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export default function JobsScreen({ navigation }: any) {
  const [tab, setTab] = useState('requests');
  const [, forceUpdate] = useState(0);

  useEffect(() => store.subscribe(() => forceUpdate(n => n + 1)), []);

  const jobs = store.getJobsForTab(tab);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: store.vendor.avatar }} style={styles.avatar} />
          <Text style={styles.title}>Urban Captain</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              {tab === t.key && <View style={styles.tabDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Jobs List */}
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: Spacing.gutter, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {jobs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={64} color={Colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>No jobs in this category.</Text>
          </View>
        ) : (
          jobs.map(job => (
            <JobCard key={job.jobId} job={job} onPress={j => {
              store.setCurrentJob(j.jobId);
              navigation.navigate('JobDetails', { jobId: j.jobId });
            }} />
          ))
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
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.surfaceVariant },
  title: { ...Typography.headlineLgMobile, color: Colors.onSurface },
  tabsWrapper: { backgroundColor: Colors.midnightNavy, paddingTop: 12 },
  tabs: { paddingHorizontal: Spacing.gutter, gap: 8, paddingBottom: 8 },
  tab: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary + '33',
    borderWidth: 1, borderColor: Colors.primary + '50',
  },
  tabText: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  tabTextActive: { color: Colors.primary },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 4 },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
});
