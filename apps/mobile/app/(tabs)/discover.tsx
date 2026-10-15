import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { FeedResponse } from '@merak/contracts';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { ContentCardView } from '@/components/ContentCard';
import { Screen, StateView, T } from '@/components/primitives';
import { colors, radius, space } from '@/theme/tokens';

export default function DiscoverScreen() {
  const [topic, setTopic] = useState<string | null>(null);
  const feed = useAsync(() => api<FeedResponse>('GET', `/content?kind=card${topic ? `&topic=${topic}` : ''}`), [topic]);
  return (
    <Screen testID="discover-screen">
      <T v="h1">Keşfet</T>
      <T v="body" color={colors.inkMuted}>Kısa kartlar, net kaynaklar. Okuyup “tamamladım” diyerek XP kazanırsın.</T>
      {feed.data ? (
        <View style={styles.chips}>
          <Chip label="Tümü" active={topic === null} onPress={() => setTopic(null)} />
          {feed.data.topics.map((t) => (
            <Chip key={t.id} label={t.name} active={topic === t.slug} onPress={() => setTopic(t.slug)} />
          ))}
        </View>
      ) : null}
      {feed.loading && !feed.data ? <StateView kind="loading" /> : null}
      {feed.error && !feed.data ? <StateView kind={feed.offline ? 'offline' : 'error'} message={feed.error} onRetry={feed.reload} /> : null}
      {feed.data?.items.length === 0 ? <StateView kind="empty" message="Bu konuda yayınlanmış kart yok." /> : null}
      {feed.data?.items.map((c) => <ContentCardView key={c.id} item={c} from="feed" />)}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <T v="small" color={active ? '#fff' : colors.ink}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: 40, paddingHorizontal: space.md, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  chipActive: { backgroundColor: colors.accent },
});
