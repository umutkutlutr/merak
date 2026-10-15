import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RevealView, SessionResultView } from '@merak/contracts';
import { useQuizSession, type AnswerState } from '@/features/quiz/useQuizSession';
import { cancelReasonTr, formatCountdown } from '@/features/quiz/QuizSessionCard';
import { Badge, Button, Card, ProgressBar, Row, Screen, Spacer, StateView, T } from '@/components/primitives';
import { colors, radius, space, touch } from '@/theme/tokens';
import { serverNow } from '@/lib/clock';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, join, submit, retryUnknown, resync, remainingMs } = useQuizSession(id);
  const s = state;
  const conn = s.connection;
  return (
    <Screen testID="quiz-screen" scroll={s.phase !== 'question'}>
      {conn === 'reconnecting' || conn === 'offline' ? (
        <View style={styles.banner} accessibilityLiveRegion="polite">
          <T v="small" color={colors.warning}>{conn === 'offline' ? 'Bağlantı yok. Son bilinen durum gösteriliyor; cevap gönderemezsin.' : 'Yeniden bağlanılıyor… durum sunucudan yenilenecek.'}</T>
        </View>
      ) : null}
      {s.session ? (
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="caption" color={colors.live}>Ödülsüz test oturumu</T>
          <Badge label={`v${s.session.stateVersion}`} tone="muted" />
        </Row>
      ) : null}
      {s.phase === 'loading' ? <StateView kind="loading" /> : null}
      {s.phase === 'error' ? <StateView kind="error" message={s.error ?? undefined} onRetry={() => join()} /> : null}
      {s.phase === 'preview' && s.session ? (
        <Card>
          <T v="h1">{s.session.title}</T>
          <T v="body" color={colors.inkMuted}>{s.session.questionCount} soru · soru başına {Math.round(s.session.rules.questionDurationMs / 1000)} sn · {s.session.participantCount} katılımcı</T>
          <T v="small" color={colors.inkMuted}>Başlangıç: {new Date(s.session.scheduledStartAt).toLocaleString('tr-TR')}</T>
          {s.error ? <T v="small" color={colors.danger}>{s.error}</T> : null}
          <Button title="Katıl" tone="live" onPress={() => void join()} testID="quiz-join" />
          <T v="caption" color={colors.inkFaint}>Katılım ücretsizdir. Bu sürümde ödül yoktur.</T>
        </Card>
      ) : null}
      {s.phase === 'joining' ? <StateView kind="loading" title="Katılınıyor…" /> : null}
      {s.phase === 'scheduled' && s.session ? <Waiting title="Katıldın" subtitle={`Bekleme salonu ${formatCountdown(Date.parse(s.session.lobbyOpensAt) - serverNow())} sonra açılır.`} count={s.session.participantCount} /> : null}
      {s.phase === 'lobby' && s.session ? <Waiting title="Bekleme salonu" subtitle={`İlk soru ${formatCountdown(Date.parse(s.session.scheduledStartAt) - serverNow())} sonra açılır. Hazır ol.`} count={s.session.participantCount} /> : null}
      {s.phase === 'question' && s.question && s.session ? (
        <QuestionPane
          position={s.question.position}
          total={s.session.questionCount}
          prompt={s.question.prompt}
          options={s.question.options}
          remainingMs={remainingMs}
          durationMs={s.question.durationMs}
          answer={s.answer}
          eligible={s.question.position >= s.eligibleFromPosition}
          onPick={(optionId) => void submit(optionId)}
          onRetry={retryUnknown}
        />
      ) : null}
      {s.phase === 'expired' ? (
        <Card tone="muted">
          <T v="h2">Süre doldu</T>
          <T v="body" color={colors.inkMuted}>Doğru cevap sunucudan geliyor… Yeni cevap kabul edilmez.</T>
          <Button title="Durumu yenile" tone="ghost" onPress={resync} />
        </Card>
      ) : null}
      {s.phase === 'reveal' && s.reveal && s.session ? <RevealPane reveal={s.reveal} total={s.session.questionCount} answer={s.answer} /> : null}
      {s.phase === 'completed' ? (s.result ? <ResultPane result={s.result} sessionId={id} /> : <StateView kind="loading" title="Sonuç hesaplanıyor…" />) : null}
      {s.phase === 'cancelled' && s.session ? (
        <Card tone="muted">
          <T v="h2">Oturum iptal edildi</T>
          <T v="body" color={colors.inkMuted}>{s.cancelMessage || (s.session.cancelledReason ? `Sebep: ${cancelReasonTr(s.session.cancelledReason)}.` : '')}</T>
          <T v="small" color={colors.inkFaint}>Verdiğin cevaplar denetim için saklanır; bu oturum sıralamaya girmez.</T>
        </Card>
      ) : null}
    </Screen>
  );
}

function Waiting({ title, subtitle, count }: { title: string; subtitle: string; count: number }) {
  return (
    <Card tone="live" testID="quiz-waiting">
      <T v="h1">{title}</T>
      <T v="body" color={colors.inkMuted}>{subtitle}</T>
      <T v="small" color={colors.inkMuted}>{count} katılımcı bekliyor. Sorular herkese aynı anda, sunucu saatine göre açılır.</T>
    </Card>
  );
}

function QuestionPane({ position, total, prompt, options, remainingMs, durationMs, answer, eligible, onPick, onRetry }: {
  position: number; total: number; prompt: string; options: Array<{ optionId: string; label: string }>; remainingMs: number; durationMs: number; answer: AnswerState | null; eligible: boolean; onPick: (id: string) => void; onRetry: () => void;
}) {
  const seconds = Math.ceil(remainingMs / 1000);
  const locked = !eligible || !!answer && answer.status !== 'idle' && answer.status !== 'rejected';
  return (
    <View style={{ gap: space.lg }} testID="quiz-question">
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="caption" color={colors.inkMuted}>Soru {position}/{total}</T>
        <T v="h2" color={seconds <= 3 ? colors.live : colors.ink} accessibilityLabel={`${seconds} saniye kaldı`} testID="quiz-timer">{seconds} sn</T>
      </Row>
      <ProgressBar value={remainingMs / durationMs} tone="live" label="Kalan süre" />
      <T v="h1" testID="quiz-prompt">{prompt}</T>
      {!eligible ? <T v="small" color={colors.warning}>Bu soru sen katılmadan önce açıldı; bir sonraki sorudan itibaren yarışacaksın.</T> : null}
      <View style={{ gap: space.sm }}>
        {options.map((o, i) => {
          const picked = answer?.optionId === o.optionId;
          return (
            <Pressable
              key={o.optionId}
              testID={`quiz-option-${i}`}
              accessibilityRole="button"
              accessibilityLabel={`Seçenek ${i + 1}: ${o.label}`}
              accessibilityState={{ disabled: locked, selected: picked }}
              disabled={locked}
              onPress={() => onPick(o.optionId)}
              style={({ pressed }) => [styles.option, picked && styles.optionPicked, locked && !picked && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
            >
              <T v="bodyStrong" color={picked ? '#fff' : colors.ink}>{o.label}</T>
            </Pressable>
          );
        })}
      </View>
      <AnswerStatus answer={answer} onRetry={onRetry} />
    </View>
  );
}

function AnswerStatus({ answer, onRetry }: { answer: AnswerState | null; onRetry: () => void }) {
  if (!answer || answer.status === 'idle') return <T v="small" color={colors.inkFaint}>Bir seçenek seç. İlk kabul edilen cevap geçerlidir.</T>;
  if (answer.status === 'submitting') return <T v="small" color={colors.inkMuted} accessibilityLiveRegion="polite">Gönderiliyor…</T>;
  if (answer.status === 'accepted') return <Badge label="Cevabın kabul edildi" tone="success" />;
  if (answer.status === 'rejected') return <T v="small" color={colors.danger} accessibilityLiveRegion="assertive">{answer.message}</T>;
  return (
    <Row>
      <T v="small" color={colors.warning}>{answer.message}</T>
      <Button title="Tekrar gönder" tone="secondary" onPress={onRetry} />
    </Row>
  );
}

function RevealPane({ reveal, total, answer }: { reveal: RevealView; total: number; answer: AnswerState | null }) {
  const mine = reveal.myAnswer;
  const [now, setNow] = useState(serverNow());
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), 500);
    return () => clearInterval(t);
  }, []);
  const next = reveal.nextOpensAt ? Math.max(0, Date.parse(reveal.nextOpensAt) - now) : null;
  return (
    <View style={{ gap: space.lg }} testID="quiz-reveal">
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="caption" color={colors.inkMuted}>Soru {reveal.position}/{total} · sonuç</T>
        {mine ? <Badge label={mine.isCorrect ? `Doğru · +${mine.points} puan` : 'Yanlış · 0 puan'} tone={mine.isCorrect ? 'success' : 'danger'} /> : <Badge label="Cevapsız · 0 puan" tone="muted" />}
      </Row>
      <T v="h2">{reveal.prompt}</T>
      <View style={{ gap: space.sm }}>
        {reveal.options.map((o) => {
          const isCorrect = o.optionId === reveal.correctOptionId;
          const isMine = (mine?.optionId ?? answer?.optionId) === o.optionId;
          return (
            <View key={o.optionId} style={[styles.option, isCorrect && styles.optionCorrect, isMine && !isCorrect && styles.optionWrong]} accessibilityLabel={`${o.label}${isCorrect ? ', doğru cevap' : ''}${isMine ? ', senin cevabın' : ''}`}>
              <T v="bodyStrong" color={isCorrect ? colors.success : isMine ? colors.danger : colors.ink}>{o.label}{isCorrect ? ' ✓' : isMine ? ' ✗' : ''}</T>
            </View>
          );
        })}
      </View>
      <Card tone="accent">
        <T v="caption" color={colors.accent}>Açıklama</T>
        <T v="body">{reveal.explanation}</T>
      </Card>
      {next !== null ? <T v="small" color={colors.inkMuted}>Sonraki soru {Math.ceil(next / 1000)} sn içinde.</T> : <T v="small" color={colors.inkMuted}>Son soruydu. Sonuçlar hesaplanıyor…</T>}
    </View>
  );
}

function ResultPane({ result, sessionId }: { result: SessionResultView; sessionId: string }) {
  const router = useRouter();
  const related = useMemo(() => result.questions.map((q) => q.relatedContent).find((c) => c) ?? null, [result]);
  return (
    <View style={{ gap: space.lg }} testID="quiz-result">
      <Card tone="live">
        <T v="caption" color={colors.live}>Oturum tamamlandı</T>
        <T v="display" testID="result-points">{result.totalPoints} puan</T>
        <T v="body" color={colors.inkMuted}>{result.correctCount}/{result.questions.length} doğru · {result.rank ? `${result.rank}. sıra` : 'sıralama dışı'} / {result.participantCount} katılımcı</T>
        <T v="caption" color={colors.inkFaint}>Eşit puanlar aynı sırayı paylaşır. Bu test oturumu ödülsüzdür.</T>
      </Card>
      {related ? (
        <Card tone="accent">
          <T v="caption" color={colors.accent}>Merakın devam etsin</T>
          <T v="h3">{related.title}</T>
          <T v="small" color={colors.inkMuted}>{related.summary}</T>
          <Button title="Kartı aç" onPress={() => router.push({ pathname: '/content/[id]', params: { id: related.id, from: 'quiz', sessionId } })} testID="result-related" />
        </Card>
      ) : null}
      <T v="h2">Sorular</T>
      {result.questions.map((q) => (
        <Card key={q.sessionQuestionId}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="caption" color={colors.inkMuted}>Soru {q.position}</T>
            <Badge label={q.myOptionId ? (q.isCorrect ? `+${q.points}` : '0 puan') : 'cevapsız'} tone={q.isCorrect ? 'success' : 'muted'} />
          </Row>
          <T v="bodyStrong">{q.prompt}</T>
          <T v="small" color={colors.success}>Doğru: {q.correctLabel}</T>
          {q.myLabel && !q.isCorrect ? <T v="small" color={colors.danger}>Senin cevabın: {q.myLabel}</T> : null}
          <T v="small" color={colors.inkMuted}>{q.explanation}</T>
          {q.relatedContent ? <Button title="İlgili kart" tone="ghost" onPress={() => router.push({ pathname: '/content/[id]', params: { id: q.relatedContent!.id, from: 'quiz', sessionId } })} /> : null}
        </Card>
      ))}
      <T v="h2">Sıralama</T>
      <Card>
        {result.leaderboard.map((row) => (
          <Row key={row.participantId} style={{ justifyContent: 'space-between', minHeight: touch.min }}>
            <T v={row.isMe ? 'bodyStrong' : 'body'}>{row.rank}. {row.username}{row.isMe ? ' (sen)' : ''}</T>
            <T v="bodyStrong">{row.totalPoints}</T>
          </Row>
        ))}
      </Card>
      <Spacer />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: space.md },
  option: { minHeight: 56, justifyContent: 'center', paddingHorizontal: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line },
  optionPicked: { backgroundColor: colors.live, borderColor: colors.live },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.successSoft },
  optionWrong: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
});
