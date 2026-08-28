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
import { Colors, Typography, Spacing, Radius } from '../theme';

const GPS_INTERVAL_MS = 5000;

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtETA(km: number): string {
  const m = Math.max(1, Math.round((km / 25) * 60));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export default function MapScreen({ route, navigation }: any) {
  const { jobId } = route.params ?? {};

  const [, forceUpdate] = useState(0);
  useEffect(() => store.subscribe(() => forceUpdate(n => n + 1)), []);

  const job = store.getJob(jobId);

  const [vendorCoords,   setVendorCoords]   = useState<{ lat: number; lng: number } | null>(null);
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [etaText,        setEtaText]        = useState('Calculating…');
  const [distText,       setDistText]       = useState('');
  const [gpsGranted,     setGpsGranted]     = useState<boolean | null>(null);
  const [navigating,     setNavigating]     = useState(false);
  const [arrived,        setArrived]        = useState(false);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read customer coords from Firestore
  useEffect(() => {
    if (!job?.bookingId) return;
    return onSnapshot(doc(db, 'bookings', job.bookingId), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d?.customerLat && d?.customerLng)
        setCustomerCoords({ lat: d.customerLat, lng: d.customerLng });
    });
  }, [job?.bookingId]);

  // Recalculate ETA when vendor moves
  useEffect(() => {
    if (!vendorCoords || !customerCoords) return;
    const km = getDistanceKm(vendorCoords.lat, vendorCoords.lng, customerCoords.lat, customerCoords.lng);
    setEtaText(fmtETA(km));
    setDistText(fmtDist(km));
  }, [vendorCoords, customerCoords]);

  // Start GPS broadcast
  useEffect(() => {
    if (!job || !store.vendorId) return;
    let active = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!active) return;
      if (status !== 'granted') { setGpsGranted(false); return; }
      setGpsGranted(true);

      const broadcast = async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const { latitude: lat, longitude: lng, heading, speed } = pos.coords;
          setVendorCoords({ lat, lng });
          await updateVendorLocation(store.vendorId!, lat, lng, heading ?? 0, speed ? Math.round(speed * 3.6) : 0);
        } catch { /* silent retry */ }
      };

      broadcast();
      timer.current = setInterval(broadcast, GPS_INTERVAL_MS);
      await updateBookingStatus(job.bookingId, 'en_route').catch(() => {});
      store.updateJobStatus(jobId, 'NAVIGATING');
    })();

    return () => {
      active = false;
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
    };
  }, [job?.bookingId, store.vendorId]);

  if (!job) {
    return (
      <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.onSurfaceVariant} />
        <Text style={{ color: Colors.onSurfaceVariant, marginTop: 12 }}>Job not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleNavigation = async () => {
    setNavigating(true);
    const dest = customerCoords
      ? `${customerCoords.lat},${customerCoords.lng}`
      : encodeURIComponent(job.address);
    const url = Platform.OS === 'ios'
      ? `maps://app?daddr=${dest}&dirflg=d`
      : `google.navigation:q=${dest}&mode=d`;
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    Linking.openURL(await Linking.canOpenURL(url) ? url : fallback);
  };

  const handleArrived = async () => {
    try {
      await updateBookingStatus(job.bookingId, 'arrived');
      store.updateJobStatus(jobId, 'ARRIVED', { arrivedAt: Date.now() });
      setArrived(true);
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
      Alert.alert("You've Arrived! 🎯", 'Ask the customer for their OTP.', [
        { text: 'Verify OTP', onPress: () => navigation.navigate('OTP', { jobId }) },
      ]);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const gpsColor = gpsGranted === null ? '#facc15' : gpsGranted ? '#4ade80' : '#ef4444';
  const progress = vendorCoords && customerCoords
    ? Math.max(0, Math.min(100, 100 - (getDistanceKm(vendorCoords.lat, vendorCoords.lng, customerCoords.lat, customerCoords.lng) / 5) * 100))
    : 0;

  return (
    <View style={st.container}>

      {/* ── Real Google MapView ───────────────────────────────────── */}
      <MapView
        style={st.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          vendorCoords
            ? { latitude: vendorCoords.lat, longitude: vendorCoords.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
            : customerCoords
            ? { latitude: customerCoords.lat, longitude: customerCoords.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
            : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 10, longitudeDelta: 10 }
        }
        showsUserLocation={false}
        showsTraffic={true}
        showsCompass={false}
        rotateEnabled={false}
      >
        {/* Vendor marker — moves every 5s */}
        {vendorCoords && (
          <Marker
            coordinate={{ latitude: vendorCoords.lat, longitude: vendorCoords.lng }}
            title="You"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={st.vendorPin}>
              <LinearGradient colors={['#2563eb', '#06b6d4']} style={st.vendorPinInner}>
                <Ionicons name="car" size={18} color="white" />
              </LinearGradient>
            </View>
          </Marker>
        )}

        {/* Customer home marker */}
        {customerCoords && (
          <Marker
            coordinate={{ latitude: customerCoords.lat, longitude: customerCoords.lng }}
            title={job.customerName}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={st.homePin}>
              <View style={st.homePinInner}>
                <Ionicons name="home" size={16} color="white" />
              </View>
              <View style={st.homePinTail} />
            </View>
          </Marker>
        )}

        {/* Route polyline */}
        {vendorCoords && customerCoords && (
          <Polyline
            coordinates={[
              { latitude: vendorCoords.lat, longitude: vendorCoords.lng },
              { latitude: customerCoords.lat, longitude: customerCoords.lng },
            ]}
            strokeColor="#3b82f6"
            strokeWidth={4}
            lineDashPattern={[10, 6]}
          />
        )}
      </MapView>

      {/* GPS loading overlay */}
      {gpsGranted === null && (
        <View style={st.loadingOverlay}>
          <ActivityIndicator color="white" size="large" />
          <Text style={st.loadingText}>Getting your location…</Text>
        </View>
      )}
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <View style={st.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.floatBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>

        {distText ? (
          <View style={st.etaPill}>
            <Ionicons name="time-outline" size={14} color="#4ade80" />
            <Text style={st.etaPillText}>{etaText}</Text>
            <Text style={st.distPillText}>· {distText}</Text>
          </View>
        ) : (
          <View style={st.etaPill}>
            <Text style={st.etaPillText}>Locating…</Text>
          </View>
        )}

        <View style={[st.floatBtn, { backgroundColor: gpsColor + '22' }]}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: gpsColor }} />
        </View>
      </View>

      {/* ── Bottom card ──────────────────────────────────────────── */}
      <View style={st.bottomCard}>
        <View style={st.handle} />

        {/* Customer info */}
        <View style={st.customerRow}>
          <View style={st.avatar}>
            <Ionicons name="person" size={22} color={Colors.onSurfaceVariant} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.customerName}>{job.customerName}</Text>
            <Text style={st.serviceName} numberOfLines={1}>{job.serviceName}</Text>
            {distText && (
              <Text style={st.etaUnder}>📍 {distText} · ETA {etaText}</Text>
            )}
          </View>
          <View style={st.timePill}>
            <Text style={st.timeText}>{job.date}</Text>
            <Text style={st.timeText}>{job.time}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={st.actionsRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${job.customerPhone || '+919999999999'}`)}
            style={st.callBtn}
          >
            <Ionicons name="call" size={22} color={Colors.onSurface} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigation}
            style={{ flex: 1, borderRadius: Radius.full, overflow: 'hidden' }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#06b6d4', '#2563eb']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={st.navBtn}
            >
              <Ionicons name="navigate" size={20} color="white" />
              <Text style={st.navBtnText}>{navigating ? 'Navigating…' : 'Open Navigation'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Arrived */}
        {!arrived ? (
          <TouchableOpacity onPress={handleArrived} style={st.arrivedBtn} activeOpacity={0.85}>
            <Ionicons name="flag" size={20} color="#4ade80" />
            <Text style={st.arrivedText}>I've Arrived at Customer</Text>
          </TouchableOpacity>
        ) : (
          <View style={[st.arrivedBtn, { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
            <Text style={st.arrivedText}>Arrived — Verifying OTP…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.midnightNavy },
  map:          { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.midnightNavy + 'CC',
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingText:  { ...Typography.bodyMd, color: 'white' },

  vendorPin:       { alignItems: 'center' },
  vendorPinInner:  {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'white', elevation: 8,
  },
  homePin:      { alignItems: 'center' },
  homePinInner: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#ef4444',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'white', elevation: 8,
  },
  homePinTail: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 12,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#ef4444', marginTop: -1,
  },

  topBar: {
    position: 'absolute', top: 52, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.gutter, zIndex: 10,
  },
  floatBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.midnightNavy + 'EE',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.deepBlue, elevation: 6,
  },
  etaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.midnightNavy + 'EE',
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#22c55e44',
  },
  etaPillText:  { ...Typography.headlineMd, color: '#4ade80' },
  distPillText: { ...Typography.labelMd, color: Colors.onSurfaceVariant },

  bottomCard: {
    backgroundColor: Colors.darkNavy,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.containerPadding, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant + '20', elevation: 12,
  },
  handle: {
    width: 48, height: 5, borderRadius: 3,
    backgroundColor: Colors.onSurfaceVariant + '30',
    alignSelf: 'center', marginBottom: 18,
  },
  customerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.deepBlue,
    justifyContent: 'center', alignItems: 'center',
  },
  customerName: { ...Typography.headlineLgMobile, color: Colors.onSurface },
  serviceName:  { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginTop: 2 },
  etaUnder:     { ...Typography.labelMd, color: '#4ade80', marginTop: 4, fontSize: 11 },
  timePill: {
    backgroundColor: Colors.deepBlue, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center',
  },
  timeText:     { ...Typography.labelMd, color: Colors.accentCyan, fontSize: 11 },
  actionsRow:   { flexDirection: 'row', gap: 12, marginBottom: 12 },
  callBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.deepBlue,
    justifyContent: 'center', alignItems: 'center',
  },
  navBtn: {
    height: 56, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  navBtnText:   { ...Typography.headlineMd, color: 'white' },
  arrivedBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#22c55e66', borderRadius: Radius.full,
    paddingVertical: 16, backgroundColor: 'rgba(34,197,94,0.08)',
  },
  arrivedText:  { ...Typography.headlineMd, color: '#4ade80' },
});
