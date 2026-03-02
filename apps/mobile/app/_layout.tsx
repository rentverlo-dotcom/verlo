import { Stack } from 'expo-router';
import { AuthProvider } from '../components/AuthProvider'


export default function Layout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0B0B0F' },
          headerTintColor: '#ffffff',
          contentStyle: { backgroundColor: '#0B0B0F' },
        }}
      />
    </AuthProvider>
  );
}