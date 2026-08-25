import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Linking, Platform, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { store } from '../store/AppStore';
import {
  updateVendorLocation,
  updateBookingStatus,
} from '../services/firestoreService';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

const GPS_INTERVAL_MS = 5000;

export default function MapScreen({ route, navigation }: any) {
  const { jobId } = route.params ?? {};

  const [, forceUpdate] = useState(0);
  useEffect(() => store.subscribe(() => forceUpdate(n => n + 1)), []);

  const job = store.getJob(jobId);

  // ── Vendor live location ──────────────────────────────────────────────
  const [vendorCoords, setVendorCoords] = useState<{
    latitude: number; longitude: number; heading: number;
  } | null>(null);

  // ── Customer location from Firestore booking ──────────────────────────
  const [customerCoords, setCustomerCoords] = useState<{
    latitude: number; longitude: number;
  } | null>(null);

  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [navigating, setNavigating]           = useState(false);
  const [arrived, setArrived]                 = useState(false);
  const locationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef        = useRef<MapView>(null);

  // ── Read customer coords from Firestore booking ───────────────────────
  useEffect(() => {
    if (!job?.bookingId) return;
    const unsub = onSnapshot(doc(db, 'bookings', job.bookingId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data?.customerLat && data?.customerLng) {
        setCustomerCoords({
          latitude:  data.customerLat,
          longitude: data.customerLng,
        });
      }
    });
    return unsub;
  }, [job?.bookingId]);

  // ── Request location + start GPS broadcast ────────────────────────────
  useEffect(() => {
    if (!job || !store.vendorId) return;
    let active = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!active) return;

      if (status !== 'granted') {
        setLocationGranted(false);
        Alert.alert(
          'Location Required',
          'Please allow location access so the customer can track you.',
        );
        return;
      }
      setLocationGranted(true);

      const broadcast = async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const { latitude, longitude, heading, speed } = pos.coords;

          setVendorCoords({ latitude, longitude, heading: heading ?? 0 });

          // Animate map to vendor position
          mapRef.current?.animateCamera({
            center: { latitude, longitude },
            zoom: 16,
          });

          await updateVendorLocation(
            store.vendorId!,
            latitude,
            longitude,
            heading ?? 0,
            speed ? Math.round(speed * 3.6) : 0,
          );
        } catch {
          // silent retry next tick
        }
      };

      broadcast();
      locationTimer.current = setInterval(broadcast, GPS_INTERVAL_MS);

      // Mark en_route in Firestore
      await updateBookingStatus(job.bookingId, 'en_route').catch(() => {});
      store.updateJobStatus(jobId, 'NAVIGATING');
    })();

    return () => {
      active = false;
      if (locationTimer.current) {
        clearInterval(locationTimer.current);
        locationTimer.current = null;
      }
    };
  }, [job?.bookingId, store.vendorId]);

  // ── Fit map to show both markers when both are ready ─────────────────
  useEffect(() => {
    if (!vendorCoords || !customerCoords) return;
    mapRef.current?.fitToCoordinates(
      [vendorCoords, customerCoords],
      { edgePadding: { top: 100, right: 60, bottom: 320, left: 60 }, animated: true },
    );
  }, [!!vendorCoords, !!customerCoords]);

  if (!job) return null;

  // ── Open Google Maps navigation ───────────────────────────────────────
  const handleStartNavigation = async () => {
    setNavigating(true);
    const dest = customerCoords
      ? `${customerCoords.latitude},${customerCoords.longitude}`
      : encodeURIComponent(job.address);
    const url = Platform.OS === 'ios'
      ? `maps://app?daddr=${dest}&dirflg=d`
      : `google.navigation:q=${dest}&mode=d`;
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;

    const canOpen = await Linking.canOpenURL(url);
    Linking.openURL(canOpen ? url : fallback);
  };

  // ── I've Arrived ──────────────────────────────────────────────────────
  const handleArrived = async () => {
    try {
      await updateBookingStatus(job.bookingId, 'arrived');
      store.updateJobStatus(jobId, 'ARRIVED', { arrivedAt: Date.now() });
      setArrived(true);
      // Stop GPS broadcasting — vendor is stationary now
      if (locationTimer.current) {
        clearInterval(locationTimer.current);
        locationTimer.current = null;
      }
      Alert.alert("You've Arrived! 🎯", 'Ask the customer for their OTP.', [
        { text: 'Verify OTP', onPress: () => navigation.navigate('OTP', { jobId }) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not update status.');
    }
  };

  const handleCall = () =>
    Linking.openURL(`tel:${job.customerPhone || '+919999999999'}`).catch(() =>
      Alert.alert('Call', `Calling ${job.customerName}…`),
    );

  const gpsColor =
    locationGranted === null  ? '#facc15' :
    locationGranted           ? '#4ade80' : '#ef4444';

  const initialRegion = vendorCoords
    ? { ...vendorCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : customerCoords
      ? { ...customerCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }
      : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 10, longitudeDelta: 10 };

  return (
    <View style={styles.container}>

      {/* ── Real MapView ────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsTraffic={true}
        showsCompass={false}
      >
        {/* Vendor marker — moves every 5s */}
        {vendorCoords && (
          <Marker
            coordinate={vendorCoords}
            title="You"
            description="Your current location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.vendorMarker}>
              <LinearGradient
                colors={['#2563eb', '#06b6d4']}
                style={styles.vendorMarkerInner}
              >
                <Ionicons name="car" size={18} color="white" />
              </LinearGradient>
            </View>
          </Marker>
        )}

        {/* Customer marker */}
        {customerCoords && (
          <Marker
            coordinate={customerCoords}
            title={job.customerName}
            description={job.address}
          >
            <View style={styles.customerMarker}>
              <View style={styles.customerMarkerInner}>
                <Ionicons name="home" size={16} color="white" />
              </View>
              <View style={styles.customerMarkerPin} />
            </View>
          </Marker>
        )}

        {/* Route line between vendor and customer */}
        {vendorCoords && customerCoords && (
          <Polyline
            coordinates={[vendorCoords, customerCoords]}
            strokeColor="#3b82f6"
            strokeWidth={4}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      {/* Loading overlay while GPS is initialising */}
      {locationGranted === null && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="white" size="large" />
          <Text style={styles.loadingText}>Getting your location…</Text>
        </View>
      )}

      {/* ── Top controls ────────────────────────────────────────────── */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.floatBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>

        {navigating && (
          <View style={styles.navBanner}>
            <Ionicons name="navigate" size={16} color="#4ade80" />
            <Text style={styles.navBannerText}>Navigation active</Text>
          </View>
        )}

        {/* GPS live dot */}
        <View style={[styles.floatBtn, { backgroundColor: gpsColor + '22' }]}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: gpsColor }} />
        </View>
      </View>

      {/* ── Bottom card ─────────────────────────────────────────────── */}
      <View style={styles.bottomCard}>
        <View style={styles.handle} />

        {/* Customer row */}
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <Ionicons name="person" size={22} color={Colors.onSurfaceVariant} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{job.customerName}</Text>
            <Text style={styles.serviceLabel} numberOfLines={1}>
              {job.serviceName}
            </Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timePillText}>{job.date} • {job.time}</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <Ionicons name="location" size={14} color={Colors.accentCyan} />
          <Text style={styles.addressText} numberOfLines={2}>{job.address}</Text>
        </View>

        {/* GPS status */}
        <View style={styles.gpsRow}>
          <View style={[styles.gpsDot, { backgroundColor: gpsColor }]} />
          <Text style={[styles.gpsText, { color: gpsColor }]}>
            {locationGranted === null ? 'Getting location…'
              : locationGranted ? 'Live GPS — customer can see you'
              : 'Location denied — customer cannot track you'}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={handleCall} style={styles.callBtn}>
            <Ionicons name="call" size={22} color={Colors.onSurface} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStartNavigation}
            style={{ flex: 1, borderRadius: Radius.full, overflow: 'hidden' }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#06b6d4', '#2563eb']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.navBtn}
            >
              <Ionicons name="navigate" size={20} color="white" />
              <Text style={styles.navBtnText}>
                {navigating ? 'Navigating…' : 'Open Navigation'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Arrived button */}
        {!arrived ? (
          <TouchableOpacity
            onPress={handleArrived}
            style={styles.arrivedBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="flag" size={20} color="#4ade80" />
            <Text style={styles.arrivedBtnText}>I've Arrived at Customer</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.arrivedBtn, { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
            <Text style={styles.arrivedBtnText}>Arrived — Verifying OTP…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.midnightNavy },
  map:            { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: Colors.midnightNavy + 'CC',
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingText:    { ...Typography.bodyMd, color: 'white' },

  // Vendor marker
  vendorMarker:      { alignItems: 'center' },
  vendorMarkerInner: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'white',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },

  // Customer marker
  customerMarker:     { alignItems: 'center' },
  customerMarkerInner:{
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#ef4444',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'white',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  customerMarkerPin: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#ef4444', marginTop: -1,
  },

  // Top controls
  topRow: {
    position: 'absolute', top: 52, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.gutter, zIndex: 10,
  },
  floatBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.midnightNavy + 'EE',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.deepBlue,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  navBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.midnightNavy + 'EE',
    borderWidth: 1, borderColor: '#22c55e33',
    borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 10,
  },
  navBannerText:  { ...Typography.headlineMd, color: '#4ade80' },

  // Bottom card
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.darkNavy,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.containerPadding, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant + '20',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  handle: {
    width: 48, height: 5, borderRadius: 3,
    backgroundColor: Colors.onSurfaceVariant + '30',
    alignSelf: 'center', marginBottom: 18,
  },
  customerRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  customerAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.deepBlue,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.outlineVariant + '40',
  },
  customerName:   { ...Typography.headlineLgMobile, color: Colors.onSurface },
  serviceLabel:   { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginTop: 2 },
  timePill:       {
    backgroundColor: Colors.deepBlue, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  timePillText:   { ...Typography.labelMd, color: Colors.accentCyan, fontSize: 11 },
  addressRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  addressText:    { ...Typography.bodyMd, color: Colors.onSurfaceVariant, flex: 1 },
  gpsRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  gpsDot:         { width: 8, height: 8, borderRadius: 4 },
  gpsText:        { ...Typography.labelMd, fontSize: 12 },
  actionsRow:     { flexDirection: 'row', gap: 12, marginBottom: 12 },
  callBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.deepBlue,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant + '40',
  },
  navBtn: {
    height: 56, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    borderRadius: Radius.full,
  },
  navBtnText:     { ...Typography.headlineMd, color: 'white' },
  arrivedBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#22c55e66',
    borderRadius: Radius.full, paddingVertical: 16,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  arrivedBtnText: { ...Typography.headlineMd, color: '#4ade80' },
});
