import { RefreshControl } from 'react-native';
import type { ContentCardSummary, CurrentQuizResponse, LearningProgress } from '@merak/contracts';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/features/auth/AuthProvider';
import { QuizSessionCard } from '@/features/quiz/QuizSessionCard';
import { ContentCardView } from '@/components/ContentCard';
import { Card, ProgressBar, Row, Screen, StateView, T } from '@/components/primitives';
import { colors } from '@/theme/tokens';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

interface HomeResponse {
  quiz: CurrentQuizResponse;
  cards: ContentCardSummary[];
  progress: LearningProgress;
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const home = useAsync(() => api<HomeResponse>('GET', '/home'), []);
  useFocusEffect(
    useCallback(() => {
      if (home.data) void home.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );
  return (
    <Screen testID="home-screen">
      <T v="caption" color={colors.inkMuted}>Merhaba{profile ? `, ${profile.displayName}` : ''}</T>
      <T v="h1">Bugün ne öğreniyoruz?</T>
      {home.loading && !home.data ? <StateView kind="loading" /> : null}
      {home.error && !home.data ? <StateView kind={home.offline ? 'offline' : 'error'} message={home.error} onRetry={home.reload} /> : null}
      {home.data ? (
        <>
          <QuizSessionCard session={home.data.quiz.session} joined={!!home.data.quiz.myParticipation} />
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="caption" color={colors.inkMuted}>Günlük görev</T>
              <T v="caption" color={colors.accent}>{home.data.progress.learningXpTotal} XP</T>
            </Row>
            <T v="h3">{home.data.progress.dailyTask.title}</T>
            <ProgressBar value={home.data.progress.dailyTask.progress / home.data.progress.dailyTask.target} label="Günlük görev ilerlemesi" />
            <T v="small" color={colors.inkMuted}>
              {home.data.progress.dailyTask.completed ? 'Bugünkü görev tamam.' : `${home.data.progress.dailyTask.progress}/${home.data.progress.dailyTask.target} içerik · Europe/Istanbul gününe göre`}
            </T>
          </Card>
          <T v="h2">Keşif kartları</T>
          {home.data.cards.length === 0 ? <StateView kind="empty" message="Yayınlanmış kart yok." /> : home.data.cards.map((c) => <ContentCardView key={c.id} item={c} from="home" />)}
        </>
      ) : null}
      <RefreshControl refreshing={false} onRefresh={home.reload} />
    </Screen>
  );
}
