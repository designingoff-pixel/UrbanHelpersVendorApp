// Urban Captain Design System — exact colours from Stitch/DESIGN.md
export const Colors = {
  // Base surfaces
  midnightNavy: '#071522',
  darkNavy: '#0B1D2A',
  deepBlue: '#102A3D',
  surface: '#131314',
  surfaceContainer: '#1f2021',
  surfaceContainerLow: '#1b1b1d',
  surfaceContainerHigh: '#2a2a2b',
  surfaceContainerLowest: '#0e0e0f',
  surfaceVariant: '#343536',
  surfaceBright: '#39393a',

  // Text
  onSurface: '#e4e2e3',
  onSurfaceVariant: '#c4c6cc',
  onBackground: '#e4e2e3',

  // Primary palette
  primary: '#bac8da',
  primaryContainer: '#071522',
  primaryFixed: '#d6e4f6',
  primaryFixedDim: '#bac8da',
  onPrimary: '#243240',
  onPrimaryFixed: '#0f1d2a',

  // Secondary
  secondary: '#b7c9da',
  secondaryContainer: '#3a4b5a',
  onSecondary: '#213240',
  onSecondaryContainer: '#a9bacc',

  // Tertiary
  tertiary: '#b0c9e2',
  tertiaryFixed: '#cce5ff',
  tertiaryFixedDim: '#b0c9e2',

  // Error
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',
  onErrorContainer: '#ffdad6',

  // Outline
  outline: '#8e9196',
  outlineVariant: '#44474c',

  // Gradients (start/end)
  gradientBlueStart: '#007BFF',
  gradientBlueEnd: '#00B4DB',
  gradientGoldStart: '#FFAF7B',
  gradientGoldEnd: '#D76D77',
  gradientPurpleStart: '#8E2DE2',
  gradientPurpleEnd: '#4A00E0',
  gradientGreenStart: '#28A745',
  gradientGreenEnd: '#1e7e34',
  gradientCyanStart: '#00d2ff',
  gradientCyanEnd: '#3a7bd5',
  gradientPrimaryStart: '#0055FF',
  gradientPrimaryEnd: '#00E5FF',
  gradientSOSStart: '#ef4444',
  gradientSOSEnd: '#f43f5e',
  gradientGoldEarnStart: '#F59E0B',
  gradientGoldEarnEnd: '#D97706',
  gradientEmeraldStart: '#10B981',
  gradientEmeraldEnd: '#059669',

  // Functional
  greenActive: '#28A745',
  mutedGrey: '#4A6072',
  accentCyan: '#00E5FF',
  accentBlue: '#0055FF',
  accentGreen: '#00E676',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Typography = {
  displayLg: { fontFamily: 'System', fontSize: 36, fontWeight: '800' as const, lineHeight: 44, letterSpacing: -0.72 },
  headlineLg: { fontFamily: 'System', fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  headlineLgMobile: { fontFamily: 'System', fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  headlineMd: { fontFamily: 'System', fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  bodyLg: { fontFamily: 'System', fontSize: 18, fontWeight: '500' as const, lineHeight: 26 },
  bodyMd: { fontFamily: 'System', fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  labelMd: { fontFamily: 'System', fontSize: 14, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.7 },
};

export const Spacing = {
  unit: 8, gutter: 16, containerPadding: 24,
  cardGap: 20, sectionMargin: 32,
};

export const Radius = {
  sm: 8, md: 12, DEFAULT: 16, lg: 24, xl: 32, full: 999,
};

export const Shadows = {
  cardSoft: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 10,
  },
  glowActive: {
    shadowColor: '#00B4DB', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
};
