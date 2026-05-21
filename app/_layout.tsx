import 'react-native-url-polyfill/auto';
import { useEffect, useState, useRef } from 'react';

import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { TabVisibilityProvider } from '../src/context/TabVisibilityContext';
import * as Linking from 'expo-linking';
import { supabase } from '../src/lib/supabase';

import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { ActivityIndicator, View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../src/constants/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from '../src/components/ui/SplashScreen';

function RootLayoutNav() {
  const { user, isLoading, onboardingCompleted, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Wait 1600ms, then fade out splash screen over 400ms (total 2000ms)
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  const extractTokensFromUrl = (url: string) => {
    let tokenPart = '';
    if (url.includes('#')) {
      tokenPart = url.split('#')[1];
    } else if (url.includes('?')) {
      tokenPart = url.split('?')[1];
    } else {
      return null;
    }

    const params: { [key: string]: string } = {};
    tokenPart.split('&').forEach((part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    if (params.access_token && params.refresh_token) {
      return {
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      };
    }
    return null;
  };

  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      
      const tokens = extractTokensFromUrl(url);
      if (tokens) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          
          if (!error) {
            // Force route to reset-password immediately
            router.replace('/(auth)/reset-password');
          }
        } catch (err) {
          console.error('Error setting deep link session:', err);
        }
      }
    };

    // Check initial URL
    Linking.getInitialURL().then((url) => handleDeepLink(url));

    // Listen for incoming URLs
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isLoading || showSplash) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTenantTabs = segments[0] === '(tenant-tabs)';
    const inLandlordTabs = segments[0] === '(landlord-tabs)';
    const isRoot = !segments[0] || segments[0] === 'index' || segments[0] === '(tabs)';
    const isResetPassword = segments[0] === '(auth)' && segments[1] === 'reset-password';

    if (isResetPassword) return;

    // 1. Not onboarded → welcome screen
    if (!onboardingCompleted && !inOnboardingGroup && !inAuthGroup) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    // 2. Onboarded but not logged in → sign in
    if (onboardingCompleted && !user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
      return;
    }

    // 3. Logged in: send to correct tab group
    if (onboardingCompleted && user) {
      if (inAuthGroup || inOnboardingGroup || isRoot) {
        // Redirect to appropriate home
        if (role === 'landlord') {
          router.replace('/(landlord-tabs)/dashboard');
        } else {
          router.replace('/(tenant-tabs)/browse');
        }
        return;
      }

      // If a tenant somehow lands in landlord tabs (or vice versa), correct them
      if (role === 'landlord' && inTenantTabs) {
        router.replace('/(landlord-tabs)/dashboard');
        return;
      }
      if (role === 'tenant' && inLandlordTabs) {
        router.replace('/(tenant-tabs)/browse');
        return;
      }
    }

  }, [user, isLoading, onboardingCompleted, role, segments, showSplash]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tenant-tabs)" />
        <Stack.Screen name="(landlord-tabs)" />
        {/* Keep (tabs) registered so existing deep links don't crash */}
        <Stack.Screen name="(tabs)" />
      </Stack>

      {(isLoading || showSplash) && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: splashOpacity, zIndex: 99999 }]}>
          <SplashScreen />
        </Animated.View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <TabVisibilityProvider>
            <ToastProvider>
              <RootLayoutNav />
            </ToastProvider>
          </TabVisibilityProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
