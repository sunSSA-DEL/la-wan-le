import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="detail"
          options={{
            presentation: 'card',
            title: '排便详情',
            headerStyle: { backgroundColor: '#FFF8F0' },
            headerTintColor: '#C8956C',
            headerTitleStyle: { color: '#4A3728' },
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
