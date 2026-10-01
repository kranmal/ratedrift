import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeOverrideProvider } from '@/hooks/use-theme-override';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <ThemeOverrideProvider>
      <RootLayoutContent />
    </ThemeOverrideProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();

  // Keep the page behind the app in step with the theme, including a manual override
  // that differs from the system setting.
  useEffect(() => {
    if (Platform.OS === 'web' && colorScheme) {
      document.documentElement.setAttribute('data-theme', colorScheme === 'dark' ? 'dark' : 'light');
    }
  }, [colorScheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
