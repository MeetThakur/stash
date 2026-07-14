import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { Inter_400Regular, Inter_300Light } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { ShareIntentProvider, useShareIntent } from 'expo-share-intent';
import Toast from 'react-native-toast-message';
import { ShareConfirmationSheet } from '../components/ShareConfirmationSheet';
import { GlobalErrorBoundary } from '../components/GlobalErrorBoundary';
import { useStashStore } from '../store/useStashStore';
import { processItemEnrichment } from '../services/coordinator';
import { COLORS } from '../styles/theme';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigator() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const storeTheme = useStashStore((state) => state.theme);
  const systemScheme = useColorScheme();
  
  const activeScheme = storeTheme === 'system' ? (systemScheme || 'dark') : storeTheme;
  const isDark = activeScheme === 'dark';

  // Offline queue retry logic
  useEffect(() => {
    const pendingItems = useStashStore.getState().items.filter(i => i.status === 'pending');
    if (pendingItems.length > 0) {
      console.log(`[Offline Queue] Retrying enrichment for ${pendingItems.length} items`);
      pendingItems.forEach(item => {
        processItemEnrichment(item.id).catch(console.error);
      });
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>

      {/* Intercept UI and render bottom sheet if app woke up from external share intent */}
      {hasShareIntent && shareIntent.text && (
        <ShareConfirmationSheet
          sharedValue={shareIntent.text}
          onDismiss={resetShareIntent}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_600SemiBold,
    Inter_400Regular,
    Inter_300Light,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GlobalErrorBoundary>
      <ShareIntentProvider>
        <AppNavigator />
        <Toast />
      </ShareIntentProvider>
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
