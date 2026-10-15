import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ContentCardSummary } from '@merak/contracts';
import { colors, radius, shadow, space } from '@/theme/tokens';
import { Badge, Row, T } from './primitives';

export function ContentCardView({ item, from }: { item: ContentCardSummary; from?: 'quiz' | 'feed' | 'home' | 'radar' }) {
  const router = useRouter();
  const subtitle = item.kind === 'radar_pick' ? [item.mediaType === 'book' ? 'Kitap' : 'Film', item.creator, item.year].filter(Boolean).join(' · ') : item.topic.name;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${subtitle}`}
      onPress={() => router.push({ pathname: '/content/[id]', params: { id: item.id, from: from ?? 'feed', sessionId: '' } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      testID={`content-card-${item.slug}`}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="caption" color={colors.accent}>{subtitle}</T>
        <Row gap={space.xs}>
          {item.isCompleted ? <Badge label="Tamamlandı" tone="success" /> : null}
          {item.isSaved ? <Badge label="Kayıtlı" tone="accent" /> : null}
        </Row>
      </Row>
      <T v="h3">{item.title}</T>
      <T v="small" color={colors.inkMuted} numberOfLines={3}>{item.summary}</T>
      {item.readingMinutes ? <T v="caption" color={colors.inkFaint}>{item.readingMinutes} dk okuma</T> : null}
      <View />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.xs, ...shadow.card },
});
