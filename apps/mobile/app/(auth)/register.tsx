import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button, Card, Screen, Spacer, T } from '@/components/primitives';
import { colors, radius, space, type } from '@/theme/tokens';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signUp(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen testID="register-screen">
      <Spacer h={space.xxxl} />
      <T v="h1">Hesap oluştur</T>
      <T v="body" color={colors.inkMuted}>Yerel test ortamında e-posta doğrulaması kapalıdır.</T>
      <Card>
        <T v="caption" color={colors.inkMuted}>E-posta</T>
        <TextInput accessibilityLabel="E-posta" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} placeholderTextColor={colors.inkFaint} placeholder="sen@ornek.com" testID="register-email" />
        <T v="caption" color={colors.inkMuted}>Şifre (en az 8 karakter)</T>
        <TextInput accessibilityLabel="Şifre" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} placeholderTextColor={colors.inkFaint} placeholder="••••••••" testID="register-password" />
        {error ? <T v="small" color={colors.danger}>{error}</T> : null}
        <Button title="Kaydol" onPress={submit} loading={busy} testID="register-submit" />
        <Link href="/(auth)/login" asChild>
          <Button title="Zaten hesabım var" tone="ghost" />
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { ...type.body, color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.md, backgroundColor: colors.surface, minHeight: 48 },
});
