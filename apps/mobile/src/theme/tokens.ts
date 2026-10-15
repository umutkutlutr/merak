/**
 * Swappable design tokens. Not a final brand: colors, type scale, spacing, radius and motion are
 * the only things screens reference, so a later brand pass touches this file first.
 */
export const colors = {
  bg: '#F6F3EE', // warm paper
  surface: '#FFFFFF',
  surfaceMuted: '#EFEAE2',
  ink: '#17161A',
  inkMuted: '#5E5A66',
  inkFaint: '#9A96A3',
  line: '#E2DDD4',
  // culture/learning: calm
  accent: '#1F5F5B', // deep teal
  accentSoft: '#DCEBE8',
  // live competition: energetic
  live: '#D9480F',
  liveSoft: '#FDE4D8',
  success: '#2B7A3D',
  successSoft: '#DDF1E1',
  danger: '#B42318',
  dangerSoft: '#FBE3E0',
  warning: '#A15C00',
  warningSoft: '#FDEFD8',
  overlay: 'rgba(23,22,26,0.55)',
} as const;

export const type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.4, textTransform: 'uppercase' as const },
  mono: { fontSize: 14, lineHeight: 20, fontFamily: 'monospace' as const },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const touch = { min: 48 } as const;
export const motion = {
  // Keep motion short; never delay content or answer feedback behind an animation.
  fast: 120,
  base: 200,
} as const;

export const shadow = {
  card: { shadowColor: '#17161A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
} as const;
