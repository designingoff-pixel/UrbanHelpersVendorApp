import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

export default function ProfileScreen({ navigation }: any) {
  const [sosVisible, setSosVisible] = useState(false);
  const { vendor } = store;

  const menuItems = [
    { icon: 'create-outline', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') },
    { icon: 'document-text-outline', label: 'Documents', onPress: () => Alert.alert('Coming Soon', 'Document management coming soon.') },
    { icon: 'help-circle-outline', label: 'Support', onPress: () => Alert.alert('Support', 'Call us: 1800-XXX-XXXX\nEmail: support@urbancaptain.com') },
    { icon: 'settings-outline', label: 'Settings', onPress: () => Alert.alert('Coming Soon', 'Settings will be available in the next release.') },
    { icon: 'log-out-outline', label: 'Logout', onPress: () => { Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') }]); }, danger: true },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <LinearGradient colors={[Colors.gradientPurpleStart, Colors.gradientPurpleEnd]} style={styles.profileCard}>
          <View style={styles.glowBg} />
          <Image source={{ uri: vendor.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{vendor.name}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.badgeText}>{vendor.rating} Rating</Text>
            </View>
            {vendor.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
                <Text style={[styles.badgeText, { color: '#4ade80' }]}>Verified Partner</Text>
              </View>
            )}
          </View>
          <Text style={styles.completedText}>{store.completedJobsCount} Completed Services</Text>
        </LinearGradient>

        {/* Info Cards */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="construct" size={16} color={Colors.primary} />
              <Text style={styles.infoCardLabel}>SERVICES</Text>
            </View>
            <Text style={styles.infoCardValue}>{vendor.services.join(', ')}</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <Text style={styles.infoCardLabel}>AREA</Text>
            </View>
            <Text style={styles.infoCardValue}>{vendor.serviceArea}, {vendor.serviceRadius} km</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Jobs', value: store.completedJobsCount.toString() },
            { label: 'This Month', value: '₹' + store.totalEarnings.toLocaleString('en-IN') },
            { label: 'Rating', value: vendor.rating.toString() + ' ⭐' },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
              activeOpacity={0.8}>
              <View style={[styles.menuIconBox, item.danger && { backgroundColor: Colors.errorContainer + '40' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.danger ? Colors.error : Colors.onSecondaryContainer} />
              </View>
              <Text style={[styles.menuLabel, item.danger && { color: Colors.error }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={item.danger ? Colors.error : Colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </View>

        {/* SOS Button */}
        <View style={styles.sosSection}>
          <TouchableOpacity onPress={() => setSosVisible(true)} activeOpacity={0.85} style={styles.sosBtnWrap}>
            <LinearGradient colors={[Colors.gradientSOSStart, Colors.gradientSOSEnd]} style={styles.sosBtn}>
              <Ionicons name="warning" size={28} color="#fff" />
              <Text style={styles.sosBtnText}>EMERGENCY SOS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SOS Modal */}
      <Modal visible={sosVisible} animationType="slide" transparent>
        <View style={styles.sosOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSosVisible(false)} />
          <View style={styles.sosSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sosTitle}>Emergency Help</Text>
            <View style={styles.sosOptions}>
              <TouchableOpacity style={styles.sosOption} onPress={() => Linking.openURL('tel:18001234567')}>
                <View style={[styles.sosOptionIcon, { backgroundColor: Colors.errorContainer }]}>
                  <Ionicons name="headset" size={22} color={Colors.onErrorContainer} />
                </View>
                <Text style={styles.sosOptionLabel}>Call Urban Captain</Text>
                <Ionicons name="call-outline" size={18} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sosOption, { borderColor: Colors.error, backgroundColor: Colors.errorContainer + '20' }]} onPress={() => Linking.openURL('tel:100')}>
                <View style={[styles.sosOptionIcon, { backgroundColor: Colors.error }]}>
                  <Ionicons name="shield" size={22} color="#fff" />
                </View>
                <Text style={[styles.sosOptionLabel, { color: Colors.error }]}>Call Police (100)</Text>
                <Ionicons name="call" size={18} color={Colors.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sosOption} onPress={() => Alert.alert('Location Shared', 'Your live location has been shared with Urban Captain support.')}>
                <View style={[styles.sosOptionIcon, { backgroundColor: Colors.secondaryContainer }]}>
                  <Ionicons name="location" size={22} color={Colors.onSecondaryContainer} />
                </View>
                <Text style={styles.sosOptionLabel}>Share Live Location</Text>
                <Ionicons name="share-outline" size={18} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setSosVisible(false)} style={styles.sosCancelBtn}>
              <Text style={styles.sosCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.midnightNavy },
  scroll: { padding: Spacing.containerPadding, paddingBottom: 100 },
  profileCard: {
    borderRadius: Radius.xl, padding: Spacing.containerPadding, alignItems: 'center',
    marginBottom: Spacing.cardGap, overflow: 'hidden', ...Shadows.cardSoft,
  },
  glowBg: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: Colors.surface, marginBottom: 14 },
  name: { ...Typography.headlineLg, color: '#fff', marginBottom: 10 },
  badgesRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { ...Typography.labelMd, color: '#fff' },
  completedText: { ...Typography.bodyMd, color: 'rgba(255,255,255,0.8)' },
  infoRow: { flexDirection: 'row', gap: Spacing.cardGap, marginBottom: Spacing.cardGap },
  infoCard: { flex: 1, backgroundColor: Colors.darkNavy, borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: Colors.outlineVariant },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoCardLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, fontSize: 11 },
  infoCardValue: { ...Typography.bodyLg, color: Colors.onSurface },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.darkNavy, borderRadius: Radius.lg, marginBottom: Spacing.cardGap, borderWidth: 1, borderColor: Colors.outlineVariant + '30' },
  statBox: { flex: 1, alignItems: 'center', padding: 14 },
  statValue: { ...Typography.headlineMd, color: Colors.onSurface },
  statLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginTop: 4 },
  menuCard: { backgroundColor: Colors.surfaceContainer, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.cardGap, borderWidth: 1, borderColor: Colors.outlineVariant + '30' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '40' },
  menuIconBox: { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: Colors.secondaryContainer, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { ...Typography.bodyLg, color: Colors.onSurface, flex: 1 },
  sosSection: { alignItems: 'center', paddingVertical: Spacing.sectionMargin },
  sosBtnWrap: { borderRadius: Radius.full, overflow: 'hidden' },
  sosBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 36, paddingVertical: 18 },
  sosBtnText: { ...Typography.headlineMd, color: '#fff' },
  sosOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sosSheet: {
    backgroundColor: Colors.surfaceContainerLow, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.containerPadding, paddingBottom: 48,
  },
  sheetHandle: { width: 48, height: 5, borderRadius: 3, backgroundColor: Colors.outlineVariant, alignSelf: 'center', marginBottom: 20 },
  sosTitle: { ...Typography.headlineLgMobile, color: Colors.error, textAlign: 'center', marginBottom: 20 },
  sosOptions: { gap: 12 },
  sosOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  sosOptionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sosOptionLabel: { ...Typography.bodyLg, color: Colors.onSurface, flex: 1 },
  sosCancelBtn: { marginTop: 20, height: 52, justifyContent: 'center', alignItems: 'center' },
  sosCancelText: { ...Typography.bodyLg, color: Colors.onSurfaceVariant },
});
