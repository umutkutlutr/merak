import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { CompleteResponse, ContentDetail } from '@merak/contracts';
import { api, describeError } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { track } from '@/lib/analytics';
import { Badge, Button, Card, Row, Screen, StateView, T } from '@/components/primitives';
import { colors } from '@/theme/tokens';

export default function ContentDetailScreen() {
  const { id, from, sessionId } = useLocalSearchParams<{ id: string; from?: string; sessionId?: string }>();
  const detail = useAsync(() => api<ContentDetail>('GET', `/content/${id}`), [id]);
  const [busy, setBusy] = useState<'save' | 'complete' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!detail.data) return;
    if (from === 'quiz') track('quiz_to_content_opened', { contentItemId: detail.data.id, quizSessionId: sessionId || undefined });
    else track('content_opened', { contentItemId: detail.data.id, props: { from: from ?? 'unknown' } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.data?.id]);

  const toggleSave = async () => {
    if (!detail.data) return;
    setBusy('save');
    try {
      const r = await api<{ saved: boolean }>(detail.data.isSaved ? 'DELETE' : 'POST', `/content/${detail.data.id}/save`);
      detail.setData((p) => (p ? { ...p, isSaved: r.saved } : p));
    } catch (e) {
      setToast(describeError(e));
    } finally {
      setBusy(null);
    }
  };
  const complete = async () => {
    if (!detail.data) return;
    setBusy('complete');
    try {
      const r = await api<CompleteResponse>('POST', `/content/${detail.data.id}/complete`);
      detail.setData((p) => (p ? { ...p, isCompleted: true } : p));
      setToast(r.alreadyCompleted ? 'Bu kartı daha önce tamamlamıştın; XP bir kez verilir.' : `+${r.xpAwarded} XP · toplam ${r.learningXpTotal}${r.dailyTask.completedNow ? ' · Günlük görev tamamlandı!' : ''}`);
    } catch (e) {
      setToast(describeError(e));
    } finally {
      setBusy(null);
    }
  };

  if (detail.loading && !detail.data) return <Screen><StateView kind="loading" /></Screen>;
  if (detail.error && !detail.data) return <Screen><StateView kind={detail.offline ? 'offline' : 'error'} message={detail.error} onRetry={detail.reload} /></Screen>;
  const d = detail.data!;
  return (
    <Screen testID="content-detail">
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="caption" color={colors.accent}>{d.kind === 'radar_pick' ? `Kültür Radarı · ${d.mediaType === 'book' ? 'Kitap' : 'Film'}` : d.topic.name}</T>
        {d.productionMethod === 'seed_sample' ? <Badge label="Örnek test içeriği" tone="warning" /> : null}
      </Row>
      <T v="h1">{d.title}</T>
      {d.kind === 'radar_pick' ? <T v="bodyStrong" color={colors.inkMuted}>{[d.creator, d.year].filter(Boolean).join(' · ')}</T> : null}
      <T v="body">{d.body}</T>
      {d.whyRecommended ? (
        <Card tone="accent">
          <T v="caption" color={colors.accent}>Neden öneriyoruz</T>
          <T v="body">{d.whyRecommended}</T>
        </Card>
      ) : null}
      <Card tone="muted">
        <T v="caption" color={colors.inkMuted}>Kaynak</T>
        <T v="small">{d.source.title ?? 'Belirtilmemiş'}</T>
        {d.source.url ? <Button title="Kaynağı aç" tone="ghost" onPress={() => void Linking.openURL(d.source.url!)} /> : null}
        <T v="caption" color={colors.inkFaint}>{d.source.verified ? 'Editör tarafından kontrol edildi' : 'Kaynak henüz editör tarafından doğrulanmadı'} · {d.language.toUpperCase()} · sürüm {d.revisionVersion}</T>
      </Card>
      {toast ? <T v="small" color={colors.accent} accessibilityLiveRegion="polite" testID="content-toast">{toast}</T> : null}
      <Row>
        <Button title={d.isCompleted ? 'Tamamlandı ✓' : 'Tamamladım'} onPress={complete} loading={busy === 'complete'} disabled={d.isCompleted} testID="content-complete" />
        <Button title={d.isSaved ? 'Kaydedildi ✓' : 'Kaydet'} tone="secondary" onPress={toggleSave} loading={busy === 'save'} testID="content-save" />
      </Row>
      <T v="small" color={colors.inkFaint}>“Tamamladım” bir öğrenme kanıtı değil, kendi ilerlemeni takip etmen için bir işarettir.</T>
    </Screen>
  );
}
