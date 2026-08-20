import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Radius } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  colors: [string, string, ...string[]];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function GradientButton({ label, onPress, colors, style, textStyle, disabled }: Props) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85} style={[styles.touch, style]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: { borderRadius: Radius.full, overflow: 'hidden' },
  gradient: { height: 56, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  label: { ...Typography.labelMd, color: '#FFFFFF', letterSpacing: 0.7 },
});
