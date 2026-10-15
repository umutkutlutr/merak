import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/tokens';

function Gate() {
  const { ready, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) router.replace('/(auth)/login');
    if (session && inAuth) router.replace('/(tabs)');
  }, [ready, session, segments, router]);
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="content/[id]" options={{ headerShown: true, title: '', headerBackTitle: 'Geri', headerTintColor: colors.accent, headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false }} />
      <Stack.Screen name="quiz/[id]" options={{ headerShown: true, title: 'Günün 5’i · Test', headerBackTitle: 'Geri', headerTintColor: colors.live, headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Gate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
