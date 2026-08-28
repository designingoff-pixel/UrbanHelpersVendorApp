import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

// ── Error Boundary — catches JS errors and shows message instead of blank crash ──
interface State { hasError: boolean; error: string }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message ?? String(error) };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Something went wrong</Text>
          <Text style={eb.msg}>{this.state.error}</Text>
          <TouchableOpacity
            style={eb.btn}
            onPress={() => this.setState({ hasError: false, error: '' })}
          >
            <Text style={eb.btnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071522', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title:     { color: '#ef4444', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  msg:       { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  btn:       { backgroundColor: '#2563eb', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  btnText:   { color: 'white', fontWeight: '700', fontSize: 15 },
});

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#071522" />
        <AppNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
