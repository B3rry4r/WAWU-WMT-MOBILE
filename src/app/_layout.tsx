import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { fontFiles, useWawu } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Root of the route graph. Fenced: only a flow-pass task edits routing
 * (docs/WORKFLOW.md, "Shared files"). The tab shell arrives in task A-01.
 */
export default function RootLayout() {
  const [loaded, error] = useFonts(fontFiles);
  const { dark, colors } = useWawu();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfacePage } }} />
    </QueryClientProvider>
  );
}
