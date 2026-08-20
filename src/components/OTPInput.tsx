import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '../theme';

interface Props {
  value: string[];
  onChange: (val: string[]) => void;
  hasError?: boolean;
}

export default function OTPInput({ value, onChange, hasError }: Props) {
  const refs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[index] = cleaned;
    onChange(next);
    if (cleaned && index < 3) refs[index + 1].current?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {[0, 1, 2, 3].map(i => (
        <TextInput
          key={i}
          ref={refs[i]}
          style={[
            styles.box,
            hasError && styles.boxError,
            value[i] ? styles.boxFilled : {},
          ]}
          value={value[i] || ''}
          onChangeText={t => handleChange(t, i)}
          onKeyPress={e => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
          returnKeyType={i < 3 ? 'next' : 'done'}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  box: {
    width: 64, height: 72, backgroundColor: Colors.deepBlue,
    borderRadius: Radius.DEFAULT, borderWidth: 2, borderColor: 'transparent',
    ...Typography.displayLg, color: Colors.onSurface, textAlign: 'center',
  },
  boxFilled: { borderColor: '#3b82f6' },
  boxError: { borderColor: Colors.error },
});
