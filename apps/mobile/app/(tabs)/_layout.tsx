import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { colors } from '@/theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;
const tab = (title: string, icon: IconName, iconActive: IconName) => ({
  title,
  tabBarIcon: ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => <Ionicons name={focused ? iconActive : icon} color={color as string} size={size} />,
});

/** Five sections — an M0 design assumption, revisable with usability findings. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={tab('Ana Sayfa', 'home-outline', 'home')} />
      <Tabs.Screen name="discover" options={tab('Keşfet', 'compass-outline', 'compass')} />
      <Tabs.Screen name="play" options={tab('Yarış', 'flash-outline', 'flash')} />
      <Tabs.Screen name="culture" options={tab('Kültür', 'library-outline', 'library')} />
      <Tabs.Screen name="profile" options={tab('Profil', 'person-outline', 'person')} />
    </Tabs>
  );
}
