import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import type { CurrentQuizResponse } from '@merak/contracts';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { QuizSessionCard } from '@/features/quiz/QuizSessionCard';
import { Card, Screen, StateView, T } from '@/components/primitives';
import { colors } from '@/theme/tokens';

export default function PlayScreen() {
  const current = useAsync(() => api<CurrentQuizResponse>('GET', '/quiz/current'), []);
  useFocusEffect(
    useCallback(() => {
      if (current.data) void current.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );
  return (
    <Screen testID="play-screen">
      <T v="h1">Yarış</T>
      <T v="body" color={colors.inkMuted}>Herkes aynı anda, aynı beş soru. Doğru ve hızlı cevap daha çok puan; yanlış cevap elemez.</T>
      {current.loading && !current.data ? <StateView kind="loading" /> : null}
      {current.error && !current.data ? <StateView kind={current.offline ? 'offline' : 'error'} message={current.error} onRetry={current.reload} /> : null}
      {current.data ? <QuizSessionCard session={current.data.session} joined={!!current.data.myParticipation} /> : null}
      <Card tone="muted">
        <T v="caption" color={colors.inkMuted}>Kurallar (M0 deneme ayarı)</T>
        <T v="small" color={colors.inkMuted}>• Soru başına 12 saniye; puan 60–100 arası, hız sunucu saatine göre hesaplanır.</T>
        <T v="small" color={colors.inkMuted}>• İlk kabul edilen cevap geçerlidir; değiştirilemez.</T>
        <T v="small" color={colors.inkMuted}>• Geç katılırsan henüz açılmamış sorulardan itibaren yarışırsın.</T>
        <T v="small" color={colors.inkMuted}>• Bu sürümde oturumlar ödülsüz yerel testtir.</T>
      </Card>
    </Screen>
  );
}
