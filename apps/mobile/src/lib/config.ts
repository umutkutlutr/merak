import { Platform } from 'react-native';

const env = (key: string, fallback: string) => {
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
};

/** On Android emulators `localhost` is the emulator itself; 10.0.2.2 reaches the host machine. */
function hostFix(url: string): string {
  if (Platform.OS === 'android' && /localhost|127\.0\.0\.1/.test(url)) return url.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  return url;
}

export const config = {
  apiUrl: hostFix(env('EXPO_PUBLIC_API_URL', 'http://localhost:3000')),
  authUrl: hostFix(env('EXPO_PUBLIC_AUTH_URL', 'http://localhost:9999')),
  anonKey: env('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
};
