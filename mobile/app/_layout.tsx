import { Tabs } from 'expo-router';

const tabBarStyle = { backgroundColor: '#0a1512', borderTopColor: '#20352e' };

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: '#0a1512' }, headerTintColor: '#e9f5ef', tabBarStyle, tabBarActiveTintColor: '#c9f670', tabBarInactiveTintColor: '#829e94' }}>
      <Tabs.Screen name="index" options={{ title: 'Chat' }} />
      <Tabs.Screen name="memory" options={{ title: 'Memory' }} />
      <Tabs.Screen name="voice" options={{ title: 'Voice' }} />
      <Tabs.Screen name="vision" options={{ title: 'Vision' }} />
    </Tabs>
  );
}
