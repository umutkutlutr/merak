import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text as RNText, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, space, touch, type } from '@/theme/tokens';

type Variant = keyof typeof type;
export function T({ v = 'body', color = colors.ink, style, children, ...rest }: PropsWithChildren<{ v?: Variant; color?: string; style?: StyleProp<TextStyle> } & TextProps>) {
  return (
    <RNText {...rest} style={[type[v], { color }, style]} maxFontSizeMultiplier={1.6}>
      {children}
    </RNText>
  );
}

export function Screen({ children, scroll = true, padded = true, style, testID }: PropsWithChildren<{ scroll?: boolean; padded?: boolean; style?: StyleProp<ViewStyle>; testID?: string }>) {
  const inner = <View style={[padded && styles.padded, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']} testID={testID}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{inner}</ScrollView> : <View style={styles.scroll}>{inner}</View>}
    </SafeAreaView>
  );
}

export function Card({ children, style, tone = 'surface', testID }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; tone?: 'surface' | 'muted' | 'accent' | 'live'; testID?: string }>) {
  const bg = { surface: colors.surface, muted: colors.surfaceMuted, accent: colors.accentSoft, live: colors.liveSoft }[tone];
  return <View style={[styles.card, { backgroundColor: bg }, style]} testID={testID}>{children}</View>;
}

export function Button({
  title,
  onPress,
  tone = 'primary',
  loading = false,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}: { title: string; onPress?: () => void; tone?: 'primary' | 'secondary' | 'live' | 'ghost' | 'danger'; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; testID?: string; accessibilityLabel?: string } & Pick<PressableProps, 'hitSlop'>) {
  const bg = { primary: colors.accent, secondary: colors.surfaceMuted, live: colors.live, ghost: 'transparent', danger: colors.dangerSoft }[tone];
  const fg = { primary: '#fff', secondary: colors.ink, live: '#fff', ghost: colors.accent, danger: colors.danger }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <T v="bodyStrong" color={fg}>{title}</T>}
    </Pressable>
  );
}

export function Badge({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'accent' | 'live' | 'success' | 'danger' | 'warning' }) {
  const bg = { muted: colors.surfaceMuted, accent: colors.accentSoft, live: colors.liveSoft, success: colors.successSoft, danger: colors.dangerSoft, warning: colors.warningSoft }[tone];
  const fg = { muted: colors.inkMuted, accent: colors.accent, live: colors.live, success: colors.success, danger: colors.danger, warning: colors.warning }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <T v="caption" color={fg}>{label}</T>
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; gap?: number }>) {
  return <View style={[styles.row, { gap }, style]}>{children}</View>;
}

export function Spacer({ h = space.lg }: { h?: number }) {
  return <View style={{ height: h }} />;
}

export function ProgressBar({ value, tone = 'accent', label }: { value: number; tone?: 'accent' | 'live'; label?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }} style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: tone === 'live' ? colors.live : colors.accent }]} />
    </View>
  );
}

/** Loading / empty / error / offline states share one component so every screen handles them the same way. */
export function StateView({ kind, title, message, onRetry, children }: { kind: 'loading' | 'empty' | 'error' | 'offline'; title?: string; message?: string; onRetry?: () => void; children?: ReactNode }) {
  const defaults = {
    loading: { title: 'Yükleniyor…', message: '' },
    empty: { title: 'Henüz bir şey yok', message: 'Burası yakında dolacak.' },
    error: { title: 'Bir sorun oldu', message: 'Tekrar denemek ister misin?' },
    offline: { title: 'Bağlantı yok', message: 'İnternete bağlanınca kaldığın yerden devam edebilirsin.' },
  }[kind];
  return (
    <View style={styles.state} accessibilityLiveRegion="polite">
      {kind === 'loading' ? <ActivityIndicator color={colors.accent} /> : null}
      <T v="h3" style={{ textAlign: 'center' }}>{title ?? defaults.title}</T>
      {(message ?? defaults.message) ? <T v="small" color={colors.inkMuted} style={{ textAlign: 'center' }}>{message ?? defaults.message}</T> : null}
      {onRetry ? <Button title="Tekrar dene" tone="secondary" onPress={onRetry} style={{ marginTop: space.md }} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingBottom: space.xxl },
  padded: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.lg },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.sm, ...shadow.card },
  button: { minHeight: touch.min, paddingHorizontal: space.xl, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.sm },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.line, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill },
  state: { alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.sm, minHeight: 160 },
});
