import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { ContentCardSummary, LearningProgress, QuizSessionSummary } from '@merak/contracts';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/features/auth/AuthProvider';
import { ContentCardView } from '@/components/ContentCard';
import { Button, Card, Row, Screen, StateView, T } from '@/components/primitives';
import { colors, radius, space, type } from '@/theme/tokens';

type Saved = { items: ContentCardSummary[] };
type History = { items: Array<{ session: QuizSessionSummary; totalPoints: number | null; rank: number | null }> };

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const progress = useAsync(() => api<LearningProgress>('GET', '/learning/progress'), []);
  const saved = useAsync(() => api<Saved>('GET', '/learning/saved'), []);
  const history = useAsync(() => api<History>('GET', '/quiz/history'), []);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [interests, setInterests] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      void progress.reload();
      void saved.reload();
      void history.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );
  const save = async () => {
    setErr(null);
    try {
      await api('PATCH', '/me', { displayName: displayName.trim() || undefined, interests: interests.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10) });
      await refreshProfile();
      setEditing(false);
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <Screen testID="profile-screen">
      <T v="h1">Profil</T>
      {profile ? (
        <Card>
          <T v="h2">{profile.displayName}</T>
          <T v="small" color={colors.inkMuted}>@{profile.username}{profile.role !== 'member' ? ` · ${profile.role}` : ''}</T>
          <Row gap={space.lg}>
            <Stat label="Öğrenme XP" value={String(profile.learningXpTotal)} />
            <Stat label="Tamamlanan" value={String(progress.data?.completedCount ?? '–')} />
            <Stat label="Kayıtlı" value={String(progress.data?.savedCount ?? '–')} />
          </Row>
          <T v="small" color={colors.inkFaint}>İlgi alanları: {profile.interests.length ? profile.interests.join(', ') : 'henüz seçilmedi'}</T>
          {editing ? (
            <View style={{ gap: space.sm }}>
              <TextInput accessibilityLabel="Görünen ad" style={styles.input} placeholder="Görünen ad" value={displayName} onChangeText={setDisplayName} placeholderTextColor={colors.inkFaint} />
              <TextInput accessibilityLabel="İlgi alanları" style={styles.input} placeholder="İlgi alanları (virgülle: sanat, tarih)" value={interests} onChangeText={setInterests} placeholderTextColor={colors.inkFaint} />
              {err ? <T v="small" color={colors.danger}>{err}</T> : null}
              <Row>
                <Button title="Kaydet" onPress={save} />
                <Button title="Vazgeç" tone="ghost" onPress={() => setEditing(false)} />
              </Row>
            </View>
          ) : (
            <Button title="Profili düzenle" tone="secondary" onPress={() => { setDisplayName(profile.displayName); setInterests(profile.interests.join(', ')); setEditing(true); }} />
          )}
        </Card>
      ) : <StateView kind="loading" />}
      <T v="h2">Yarışma geçmişi</T>
      <T v="small" color={colors.inkMuted}>Yarışma puanı ile öğrenme XP’si ayrı tutulur; bu puanlar XP’ye dönüşmez.</T>
      {history.data?.items.length === 0 ? <StateView kind="empty" message="Henüz bir oturuma katılmadın." /> : null}
      {history.data?.items.map((h) => (
        <Card key={h.session.id}>
          <T v="h3">{h.session.title}</T>
          <T v="small" color={colors.inkMuted}>{new Date(h.session.scheduledStartAt).toLocaleString('tr-TR')} · {h.session.status === 'completed' ? `${h.totalPoints ?? 0} puan · ${h.rank ? `${h.rank}. sıra` : ''}` : 'iptal edildi'}</T>
          {h.session.status === 'completed' ? <Button title="Sonucu gör" tone="ghost" onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: h.session.id } })} /> : null}
        </Card>
      ))}
      <T v="h2">Kaydettiklerim</T>
      {saved.data?.items.length === 0 ? <StateView kind="empty" message="Kaydettiğin içerik yok." /> : null}
      {saved.data?.items.map((c) => <ContentCardView key={c.id} item={c} />)}
      <Button title="Çıkış yap" tone="danger" onPress={() => void signOut()} testID="sign-out" />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <T v="h2">{value}</T>
      <T v="caption" color={colors.inkMuted}>{label}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { ...type.body, color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.md, backgroundColor: colors.surface, minHeight: 48 },
});
