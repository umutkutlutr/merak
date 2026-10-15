import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import type { QuizSessionSummary } from '@merak/contracts';
import { Badge, Button, Card, Row, T } from '@/components/primitives';
import { colors } from '@/theme/tokens';
import { serverNow } from '@/lib/clock';

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'şimdi';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} sa ${m} dk`;
  if (m > 0) return `${m} dk ${sec} sn`;
  return `${sec} sn`;
}

const statusLabel: Record<QuizSessionSummary['status'], string> = {
  draft: 'Taslak',
  scheduled: 'Planlandı',
  lobby: 'Bekleme salonu açık',
  live: 'Canlı',
  completed: 'Tamamlandı',
  cancelled: 'İptal edildi',
};

export function QuizSessionCard({ session, joined }: { session: QuizSessionSummary | null; joined: boolean }) {
  const router = useRouter();
  const [now, setNow] = useState(serverNow());
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!session) {
    return (
      <Card tone="muted">
        <T v="caption" color={colors.inkMuted}>Günün 5’i</T>
        <T v="h3">Planlanmış test oturumu yok</T>
        <T v="small" color={colors.inkMuted}>Yönetim panelinden ödülsüz bir test oturumu planlandığında burada görünür.</T>
      </Card>
    );
  }
  const startsIn = Date.parse(session.scheduledStartAt) - now;
  const active = session.status === 'lobby' || session.status === 'live';
  const terminal = session.status === 'completed' || session.status === 'cancelled';
  return (
    <Card tone={active ? 'live' : 'surface'} testID="quiz-session-card">
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="caption" color={colors.live}>Günün 5’i · ödülsüz test</T>
        <Badge label={statusLabel[session.status]} tone={active ? 'live' : terminal ? 'muted' : 'accent'} />
      </Row>
      <T v="h2">{session.title}</T>
      {session.status === 'scheduled' ? <T v="body" color={colors.inkMuted}>Başlangıç: {formatCountdown(startsIn)} sonra · {session.questionCount} soru · {Math.round(session.rules.questionDurationMs / 1000)} sn/soru</T> : null}
      {session.status === 'lobby' ? <T v="body" color={colors.inkMuted}>{formatCountdown(startsIn)} sonra başlıyor · {session.participantCount} katılımcı</T> : null}
      {session.status === 'live' ? <T v="body" color={colors.inkMuted}>Şu an canlı · {session.currentQuestionPosition}/{session.questionCount}. soru</T> : null}
      {session.status === 'completed' ? <T v="body" color={colors.inkMuted}>Sonuçlar hazır.</T> : null}
      {session.status === 'cancelled' ? <T v="body" color={colors.inkMuted}>İptal edildi{session.cancelledReason ? ` (${cancelReasonTr(session.cancelledReason)})` : ''}.</T> : null}
      <Button
        title={terminal ? (joined ? 'Sonucu gör' : 'Detay') : joined ? (active ? 'Oturuma dön' : 'Bekleme salonu') : 'Katıl'}
        tone={active ? 'live' : 'primary'}
        onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: session.id } })}
        testID="quiz-open"
      />
    </Card>
  );
}

export function cancelReasonTr(reason: NonNullable<QuizSessionSummary['cancelledReason']>): string {
  return {
    admin_cancelled: 'yönetici iptal etti',
    server_restart: 'sunucu yeniden başladı',
    missed_start: 'başlangıç kaçırıldı',
    question_approval_withdrawn: 'bir sorunun onayı geri çekildi',
    question_revision_changed: 'bir soru değiştirildi',
  }[reason];
}
