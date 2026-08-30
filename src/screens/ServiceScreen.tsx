import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';
import { updateBookingStatus, updateBookingAudio } from '../services/firestoreService';
import { updateDoc, doc } from "firebase/firestore";
import { ref, getDownloadURL, uploadString } from "firebase/storage";
import * as FileSystem from "expo-file-system";
import { db, storage } from "../services/firebase";
import { Audio } from 'expo-av';

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function ServiceScreen({ route, navigation }: any) {
  const { jobId } = route.params;
  const [, forceUpdate] = useState(0);
  const [showStopSheet, setShowStopSheet] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => forceUpdate(n => n + 1));

    // Notify customer: service started
    const job = store.getJob(jobId);
    if (job) updateBookingStatus(job.bookingId, 'in_progress');

    // Start timer and recording
    const startRecording = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
      } catch (err: any) {
        Alert.alert('Microphone Error', `Failed to start recording: ${err.message}`);
        console.error('Failed to start recording', err);
      }
    };
    startRecording();

    timerRef.current = setInterval(() => { if (!paused) store.tickRecording(); }, 1000);
    return () => {
      unsub();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!paused) {
      timerRef.current = setInterval(() => store.tickRecording(), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused]);

  const job = store.getJob(jobId);
  if (!job) return null;

  const done = job.checklistDone.length;
  const total = job.checklist.length;
  const progress = total > 0 ? done / total : 0;

  const handleComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowStopSheet(false);
    
    // Stop recording and upload
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri && job) {
          // Read file as Base64 string to completely bypass React Native blob corruption
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const audioRef = ref(storage, `recordings/${job.bookingId}_${Date.now()}.m4a`);
          await uploadString(audioRef, base64, 'base64', { contentType: 'audio/m4a' });
          const downloadUrl = await getDownloadURL(audioRef);
          await updateBookingAudio(job.bookingId, downloadUrl);
          Alert.alert("Success", "Audio recording uploaded successfully!");
        }
      } catch (err: any) {
        Alert.alert("Upload Failed", `Could not upload recording: ${err.message}`);
        console.error("Failed to upload recording", err);
      }
    } else {
      Alert.alert("Warning", "No recording was found to upload.");
    }

    store.completeJob(jobId);
    
    // Notify customer: service completed
    if (job) updateBookingStatus(job.bookingId, 'completed');
    navigation.navigate('Complete', { jobId });
  };

  const h = Math.floor(store.recordingSeconds / 3600);
  const m = Math.floor((store.recordingSeconds % 3600) / 60);

  return (
    <View style={styles.container}>
      {/* Recording Bar */}
      <LinearGradient colors={[Colors.errorContainer, '#7f1d1d']} style={styles.recordingBar}>
        <Ionicons name="radio-button-on" size={14} color={Colors.error} />
        <Text style={styles.recordingText}>RECORDING {formatTime(store.recordingSeconds)}</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: Spacing.containerPadding, paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTss08NY0-E1aiTA6TwY7vuRIUB-UZOEgPYgA2gDts3DgdHX__oW151jHP8qKocMPn44S6yehBzc4KJpylrMK2nJdQ5T_0IIb0RueFonL2YDBdN70abxkiPxbPF1OGCwpx1PNsq2BR2Npf_0soICCzwmh9NlCX4YrQQ7TZqHoY5vzjbcflto2dvUusyH8lMfAl1zMAqUicoUHAPgOUH36Q6t5Djf5npArb8RpFpt9JZUKtMtel3taK' }}
              style={styles.avatar}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inProgressTitle}>In Progress: {job.serviceName}</Text>
            <View style={styles.withRow}>
              <Ionicons name="person" size={16} color={Colors.onSurfaceVariant} />
              <Text style={styles.withText}>with {job.customerName}</Text>
            </View>
          </View>
        </View>

        {/* Safety Card */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyIcon}>
            <Ionicons name="shield-checkmark" size={22} color={Colors.onSecondaryContainer} />
          </View>
          <Text style={styles.safetyText}>Service recording is active for transparency and safety.</Text>
        </View>

        {/* Checklist */}
        <View style={styles.checklistCard}>
          <View style={styles.checklistHeader}>
            <Text style={styles.checklistTitle}>Service Checklist</Text>
            <Text style={styles.checklistProgress}>{done}/{total}</Text>
          </View>
          {/* Progress bar */}
          <View style={styles.progressBg}>
            <LinearGradient
              colors={[Colors.primary, Colors.gradientBlueEnd]}
              style={[styles.progressFill, { width: `${progress * 100}%` as any }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </View>
          {/* Items */}
          {job.checklist.map(item => {
            const isDone = job.checklistDone.includes(item);
            return (
              <TouchableOpacity
                key={item}
                onPress={() => store.toggleChecklist(jobId, item)}
                style={[styles.checkItem, isDone && styles.checkItemDone]}
                activeOpacity={0.8}>
                <Ionicons
                  name={isDone ? 'checkmark-circle' : 'radio-button-off'}
                  size={24}
                  color={isDone ? Colors.primary : Colors.outline}
                />
                <Text style={[styles.checkLabel, isDone && styles.checkLabelDone]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => { setPaused(p => !p); }}
          style={[styles.pauseBtn, paused && { borderColor: '#fbbf24' }]}>
          <Text style={[styles.pauseText, paused && { color: '#fbbf24' }]}>{paused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowStopSheet(true)} activeOpacity={0.85} style={{ flex: 2, borderRadius: Radius.full, overflow: 'hidden' }}>
          <LinearGradient colors={[Colors.gradientSOSStart, Colors.gradientSOSEnd]} style={styles.stopBtn}>
            <Ionicons name="stop-circle" size={20} color="#fff" />
            <Text style={styles.stopBtnText}>Stop Recording</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stop Sheet Modal */}
      <Modal visible={showStopSheet} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Stop Recording?</Text>
            <Text style={styles.sheetSubtitle}>Are you sure you want to end this service session?</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Recording Duration</Text>
                <Text style={styles.summaryValue}>{h}h {m}m</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Earnings</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.summaryValue}>₹{job.vendorEarnings}</Text>
                  <View style={styles.paidBadge}><Text style={styles.paidText}>PAID</Text></View>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={handleComplete} activeOpacity={0.85} style={{ borderRadius: Radius.full, overflow: 'hidden', marginTop: 12 }}>
              <LinearGradient colors={[Colors.primary, Colors.gradientBlueEnd]} style={styles.completeBtn}>
                <Ionicons name="trophy" size={20} color={Colors.onPrimary} />
                <Text style={[styles.stopBtnText, { color: Colors.onPrimary }]}>Complete Service</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowStopSheet(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.midnightNavy },
  recordingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 48, paddingTop: 8,
  },
  recordingText: { ...Typography.labelMd, color: Colors.error, letterSpacing: 2 },
  scroll: { flex: 1 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: Spacing.sectionMargin, marginTop: Spacing.gutter,
  },
  avatarWrap: { borderWidth: 2, borderColor: Colors.surfaceVariant, borderRadius: 36 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  inProgressTitle: { ...Typography.headlineMd, color: Colors.onSurface },
  withRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  withText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  safetyCard: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.lg, padding: 14,
    flexDirection: 'row', gap: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant + '30', marginBottom: Spacing.sectionMargin,
  },
  safetyIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  safetyText: { ...Typography.bodyMd, color: Colors.onSurface, flex: 1 },
  checklistCard: {
    backgroundColor: Colors.darkNavy, borderRadius: Radius.xl, padding: Spacing.containerPadding,
    ...Shadows.cardSoft, gap: 12,
  },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checklistTitle: { ...Typography.headlineMd, color: Colors.onSurface },
  checklistProgress: { ...Typography.labelMd, color: Colors.primary },
  progressBg: { height: 8, backgroundColor: Colors.surfaceVariant, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12,
    borderRadius: Radius.md, backgroundColor: Colors.darkNavy,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  checkItemDone: { backgroundColor: '#0B2A1F', borderColor: '#065f4680' },
  checkLabel: { ...Typography.bodyLg, color: Colors.onSurface },
  checkLabelDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  bottomBar: {
    flexDirection: 'row', gap: 14,
    padding: Spacing.gutter, paddingBottom: 36,
    backgroundColor: Colors.midnightNavy, borderTopWidth: 1, borderTopColor: Colors.outlineVariant + '30',
  },
  pauseBtn: {
    flex: 1, height: 56, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.outlineVariant,
  },
  pauseText: { ...Typography.labelMd, color: Colors.onSurface },
  stopBtn: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  stopBtnText: { ...Typography.labelMd, color: '#fff', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surfaceContainer, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.containerPadding, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant + '50',
  },
  sheetHandle: { width: 48, height: 5, borderRadius: 3, backgroundColor: Colors.outlineVariant, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { ...Typography.displayLg, color: Colors.onSurface, textAlign: 'center', fontSize: 28 },
  sheetSubtitle: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', marginTop: 6 },
  summaryBox: {
    backgroundColor: Colors.deepBlue, borderRadius: Radius.lg,
    padding: Spacing.containerPadding, gap: 12, marginTop: 16,
    borderWidth: 1, borderColor: Colors.outlineVariant + '30',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  summaryValue: { ...Typography.headlineMd, color: Colors.onSurface, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.surfaceVariant },
  paidBadge: { backgroundColor: Colors.primary + '33', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  paidText: { ...Typography.labelMd, fontSize: 10, color: Colors.primary },
  completeBtn: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  cancelBtn: { height: 56, justifyContent: 'center', alignItems: 'center' },
  cancelText: { ...Typography.bodyLg, color: Colors.onSurfaceVariant },
});
