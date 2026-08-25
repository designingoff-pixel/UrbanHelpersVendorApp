import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import OTPInput from '../components/OTPInput';
import { store } from '../store/AppStore';
import { verifyOTP } from '../services/firestoreService';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

export default function OTPScreen({ route, navigation }: any) {
  const { jobId } = route.params;
  const [otp, setOtp]           = useState(['', '', '', '']);
  const [hasError, setHasError] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading]   = useState(false);

  const job = store.getJob(jobId);
  if (!job) return null;

  const handleVerify = async () => {
    const entered = otp.join('');
    if (entered.length < 4) {
      Alert.alert('Incomplete', 'Please enter all 4 digits.');
      return;
    }

    setLoading(true);
    setHasError(false);

    try {
      // verifyOTP checks Firestore booking.otp and updates status → in_progress
      const correct = await verifyOTP(job.bookingId, entered);

      if (!correct) {
        setHasError(true);
        Alert.alert(
          'Incorrect OTP',
          'The code you entered is wrong. Ask the customer to check their app.',
        );
        return;
      }

      // Sync local store
      store.updateJobStatus(jobId, 'CUSTOMER_VERIFIED');
      setVerified(true);

    } catch (e: any) {
      // Fallback: if Firestore unreachable, allow demo OTP "1234"
      if (entered === '1234' || entered === job.otp) {
        store.updateJobStatus(jobId, 'CUSTOMER_VERIFIED');
        setVerified(true);
      } else {
        setHasError(true);
        Alert.alert('Verification Error', e.message ?? 'Could not verify OTP. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = () => {
    store.startRecording(jobId);
    navigation.navigate('Service', { jobId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        {!verified ? (
          <>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={52} color={Colors.primary} />
              <View style={styles.iconBadge}>
                <Ionicons name="keypad" size={18} color={Colors.primary} />
              </View>
            </View>

            <Text style={styles.title}>Verify Customer</Text>
            <Text style={styles.subtitle}>
              Ask the customer for the OTP displayed in their Urban Helpers app.
            </Text>

            <OTPInput
              value={otp}
              onChange={v => { setOtp(v); setHasError(false); }}
              hasError={hasError}
            />

            {hasError && (
              <Text style={styles.errorText}>
                Incorrect OTP. Ask the customer to check their app.
              </Text>
            )}

            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={0.85}
              disabled={loading}
              style={styles.verifyTouch}
            >
              <LinearGradient colors={['#2563eb', '#06b6d4']} style={styles.verifyBtn}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.verifyBtnText}>Verify OTP</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setOtp(['', '', '', '']); setHasError(false); }}
              style={styles.resend}
            >
              <Text style={styles.resendText}>Clear & Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Success */}
            <View style={styles.successCircle}>
              <LinearGradient
                colors={['rgba(16,185,129,0.2)', 'rgba(20,184,166,0.2)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 64 }]}
              />
              <Ionicons name="checkmark-circle" size={64} color="#34d399" />
            </View>
            <Text style={styles.title}>Customer Verified ✓</Text>
            <Text style={styles.subtitle}>
              Service request authorised. You can now begin the job.
            </Text>

            <TouchableOpacity
              onPress={handleStartService}
              activeOpacity={0.85}
              style={styles.verifyTouch}
            >
              <LinearGradient
                colors={[Colors.gradientEmeraldStart, Colors.gradientEmeraldEnd]}
                style={styles.verifyBtn}
              >
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={styles.verifyBtnText}>Start Service</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.midnightNavy },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter, height: 56, paddingTop: 40,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle:  { ...Typography.headlineMd, color: Colors.onSurface },
  body: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.containerPadding, gap: 20,
  },
  iconCircle: {
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: Colors.deepBlue,
    justifyContent: 'center', alignItems: 'center', ...Shadows.cardSoft,
  },
  iconBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: Colors.midnightNavy,
  },
  title:       { ...Typography.headlineLgMobile, color: Colors.onSurface, textAlign: 'center' },
  subtitle:    { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 280 },
  errorText:   { ...Typography.labelMd, color: Colors.error, textAlign: 'center' },
  verifyTouch: { width: '100%', borderRadius: Radius.full, overflow: 'hidden' },
  verifyBtn: {
    height: 56, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    gap: 8, borderRadius: Radius.full,
  },
  verifyBtnText: { ...Typography.labelMd, color: '#fff', fontSize: 16 },
  resend:        { marginTop: 8 },
  resendText:    { ...Typography.labelMd, color: Colors.primary },
  successCircle: {
    width: 128, height: 128, borderRadius: 64,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.deepBlue, overflow: 'hidden',
  },
});
