import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import { Colors, Typography, Spacing, Radius } from '../theme';

export default function NotificationsScreen({ navigation }: any) {
  const [, forceUpdate] = useState(0);
  useEffect(() => store.subscribe(() => forceUpdate(n => n + 1)), []);

  const handleTap = (n: any) => {
    store.markNotificationRead(n.id);
    if (n.jobId) {
      store.setCurrentJob(n.jobId);
      navigation.navigate('JobDetails', { jobId: n.jobId });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {store.notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        ) : (
          store.notifications.map(n => (
            <TouchableOpacity
              key={n.id}
              onPress={() => handleTap(n)}
              activeOpacity={0.85}
              style={[styles.card, { borderLeftColor: n.accentColor, opacity: n.read ? 0.65 : 1 }]}>
              <View style={[styles.iconBox, { backgroundColor: n.accentColor + '22' }]}>
                <Ionicons name={n.icon as any} size={20} color={n.accentColor} />
              </View>
              <View style={styles.content}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  {!n.read && <View style={[styles.unreadDot, { backgroundColor: n.accentColor }]} />}
                </View>
                <Text style={styles.cardBody}>{n.body}</Text>
                <Text style={styles.cardTime}>{n.time}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  title: { ...Typography.headlineLgMobile, color: Colors.onSurface },
  scroll: { padding: Spacing.gutter, paddingBottom: 40, gap: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  card: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.lg, padding: 14,
    flexDirection: 'row', gap: 12, borderLeftWidth: 4,
    borderWidth: 1, borderColor: Colors.outlineVariant + '30',
  },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  content: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...Typography.bodyLg, color: Colors.onSurface, fontWeight: '600', flex: 1 },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
  cardBody: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginTop: 4 },
  cardTime: { ...Typography.labelMd, color: Colors.onSurfaceVariant, opacity: 0.6, marginTop: 6 },
});
