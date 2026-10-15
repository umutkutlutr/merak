import type { FeedResponse } from '@merak/contracts';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { ContentCardView } from '@/components/ContentCard';
import { Screen, StateView, T } from '@/components/primitives';
import { colors } from '@/theme/tokens';

/** Culture section: only the Radar module exists in M0, so only the Radar is shown. */
export default function CultureScreen() {
  const radar = useAsync(() => api<FeedResponse>('GET', '/content?kind=radar_pick'), []);
  return (
    <Screen testID="culture-screen">
      <T v="h1">Kültür Radarı</T>
      <T v="body" color={colors.inkMuted}>Editör seçkisi: dört kitap ve film önerisi, kısa gerekçeyle. Beğendiğini kaydet.</T>
      {radar.loading && !radar.data ? <StateView kind="loading" /> : null}
      {radar.error && !radar.data ? <StateView kind={radar.offline ? 'offline' : 'error'} message={radar.error} onRetry={radar.reload} /> : null}
      {radar.data?.items.length === 0 ? <StateView kind="empty" /> : null}
      {radar.data?.items.map((c) => <ContentCardView key={c.id} item={c} from="radar" />)}
    </Screen>
  );
}
