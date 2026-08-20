import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import OTPInput from '../components/OTPInput';
import { Colors, Typography, Spacing, Radius } from '../theme';

const DEMO_OTP = '1234';

export default function LoginScreen({ navigation }: any) {
  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState(false);

  const sendOTP = () => {
    if (mobile.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setStep('otp');
  };

  const verifyOTP = () => {
    const entered = otp.join('');
    if (entered.length < 4) { Alert.alert('Incomplete', 'Enter all 4 digits.'); return; }
    if (entered !== DEMO_OTP) { setOtpError(true); Alert.alert('Wrong OTP', 'Incorrect OTP. Demo OTP is 1234.'); return; }
    setOtpError(false);
    navigation.replace('MainTabs');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[Colors.midnightNavy, Colors.darkNavy]} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              <Ionicons name="construct" size={40} color={Colors.tertiaryFixedDim} />
            </View>
            <Text style={styles.headline}>Welcome, Partner 👋</Text>
            <Text style={styles.subtitle}>Manage your services and help customers with Urban Captain.</Text>
          </View>

          {/* Illustration */}
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr8ID1amGoP8tO3y7Q29HepQu1IEL_Yd2Xa0dVA7rMqgRvW_itXQOfP7mVNQB-KVi5AROLW3n6ED948EdZjEX68qSnMeWBQAGI2jV6Hwm2nc1CVDDrZjPORwGUOIisp3eGIw8TUfoGW8a-FpSXlgOwol1fjnuA70li_iM5O8jLXpU_U8jTbWB2lg2OFzaNCGbkC5_HRSshlWrn0sjkHSGk0eqk6aRSmH-3gSo9OqmupsxCKYY1aUEZ' }}
            style={styles.illustration}
            resizeMode="cover"
          />

          {step === 'mobile' ? (
            <View style={styles.form}>
              <View style={styles.inputRow}>
                <View style={styles.dialCode}>
                  <Text style={styles.dialCodeText}>+91</Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.onSurfaceVariant} />
                </View>
                <TextInput
                  style={styles.mobileInput}
                  placeholder="Enter Mobile Number"
                  placeholderTextColor={Colors.onSurfaceVariant + '80'}
                  keyboardType="phone-pad"
                  value={mobile}
                  onChangeText={setMobile}
                  maxLength={10}
                />
              </View>
              <TouchableOpacity onPress={sendOTP} activeOpacity={0.85}>
                <LinearGradient colors={['#007bff', '#00d2ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtn}>
                  <Text style={styles.sendBtnText}>Send OTP</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.otpInfo}>OTP sent to +91 {mobile}</Text>
              <Text style={styles.demoHint}>Demo OTP: <Text style={{ color: Colors.accentCyan, fontWeight: '700' }}>1234</Text></Text>
              <OTPInput value={otp} onChange={v => { setOtp(v); setOtpError(false); }} hasError={otpError} />
              <TouchableOpacity onPress={verifyOTP} activeOpacity={0.85} style={{ marginTop: 24 }}>
                <LinearGradient colors={['#007bff', '#00d2ff']} style={styles.sendBtn}>
                  <Text style={styles.sendBtnText}>Verify OTP</Text>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('mobile')} style={styles.back}>
                <Text style={styles.backText}>← Change Number</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        <TouchableOpacity onPress={() => navigation.navigate('Registration')} style={styles.footer}>
          <Text style={styles.footerText}>Become a Partner</Text>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', padding: Spacing.containerPadding, paddingTop: 60 },
  logoSection: { alignItems: 'center', marginBottom: Spacing.sectionMargin },
  logoBox: {
    width: 80, height: 80, backgroundColor: Colors.surfaceContainer,
    borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 20,
  },
  headline: { ...Typography.displayLg, color: Colors.onSurface, textAlign: 'center', marginBottom: 8 },
  subtitle: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 280 },
  illustration: {
    width: '100%', height: 180, borderRadius: Radius.lg,
    marginBottom: Spacing.cardGap, borderWidth: 1, borderColor: Colors.outlineVariant + '50',
  },
  form: { width: '100%', gap: 16 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.deepBlue,
    borderRadius: Radius.lg, overflow: 'hidden', height: 56,
  },
  dialCode: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    borderRightWidth: 1, borderRightColor: Colors.outlineVariant + '80', gap: 4,
  },
  dialCodeText: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  mobileInput: {
    flex: 1, paddingHorizontal: 16, ...Typography.bodyLg, color: Colors.onSurface,
  },
  sendBtn: {
    height: 56, borderRadius: Radius.full, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  sendBtnText: { ...Typography.labelMd, color: '#fff' },
  otpInfo: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
  demoHint: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
  back: { alignItems: 'center', marginTop: 16 },
  backText: { ...Typography.labelMd, color: Colors.primary },
  footer: { paddingVertical: 24, alignItems: 'center' },
  footerText: { ...Typography.labelMd, color: Colors.tertiaryFixedDim, borderBottomWidth: 1, borderBottomColor: Colors.tertiaryFixedDim, paddingBottom: 2 },
});
