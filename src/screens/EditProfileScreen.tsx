import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../store/AppStore';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function EditProfileScreen({ navigation }: any) {
  const { vendor } = store;
  const [name, setName] = useState(vendor.name);
  const [mobile, setMobile] = useState(vendor.mobile);
  const [avatar, setAvatar] = useState(vendor.avatar);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Error", "Name is required.");
    setSaving(true);
    try {
      if (store.vendorId) {
        // Save to Firestore vendors collection
        const vendorRef = doc(db, 'vendors', store.vendorId);
        await updateDoc(vendorRef, {
          name: name.trim(),
          mobile: mobile.trim(),
          avatar: avatar.trim()
        });
      }
      
      // Update local store
      store.vendor.name = name.trim();
      store.vendor.mobile = mobile.trim();
      store.vendor.avatar = avatar.trim();
      
      // Force update UI
      store.setCurrentJob(store.currentJobId || '');
      
      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", "Failed to update profile: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={Colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profile Image URL</Text>
            <TextInput
              style={styles.input}
              value={avatar}
              onChangeText={setAvatar}
              placeholder="https://..."
              placeholderTextColor={Colors.onSurfaceVariant}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
            onPress={handleSave} 
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.midnightNavy },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...Typography.headlineMd, color: '#fff' },
  scroll: { padding: Spacing.containerPadding },
  inputGroup: { marginBottom: 20 },
  label: { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.md,
    padding: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '40',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20
  },
  saveBtnText: { ...Typography.titleMd, color: '#fff', fontWeight: 'bold' }
});
