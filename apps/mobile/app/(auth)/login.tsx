import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button, Card, Screen, Spacer, T } from '@/components/primitives';
import { colors, radius, space, type } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen testID="login-screen">
      <Spacer h={space.xxxl} />
      <T v="display">Merak</T>
      <T v="body" color={colors.inkMuted}>Her akşam beş soru. Her gün biraz kültür.</T>
      <Card>
        <T v="caption" color={colors.inkMuted}>E-posta</T>
        <TextInput testID="login-email" accessibilityLabel="E-posta" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} placeholder="sen@ornek.com" placeholderTextColor={colors.inkFaint} />
        <T v="caption" color={colors.inkMuted}>Şifre</T>
        <TextInput testID="login-password" accessibilityLabel="Şifre" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} placeholder="••••••••" placeholderTextColor={colors.inkFaint} onSubmitEditing={submit} />
        {error ? <T v="small" color={colors.danger} accessibilityLiveRegion="assertive">{error}</T> : null}
        <Button title="Giriş yap" onPress={submit} loading={busy} testID="login-submit" />
        <Link href="/(auth)/register" asChild>
          <Button title="Hesap oluştur" tone="ghost" />
        </Link>
      </Card>
      <View style={styles.note}>
        <T v="small" color={colors.inkFaint}>M0 yerel test sürümü. Yarışmalar ödülsüzdür; katılım ücretsizdir.</T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { ...type.body, color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.md, backgroundColor: colors.surface, minHeight: 48 },
  note: { paddingHorizontal: space.sm },
});
