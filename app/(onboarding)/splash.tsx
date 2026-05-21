import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import SplashScreen from '../../src/components/ui/SplashScreen';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function SplashPage() {
  const router = useRouter();
  const { user, onboardingCompleted, role } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!onboardingCompleted) {
        router.replace('/(onboarding)/welcome');
      } else if (!user) {
        router.replace('/(auth)/sign-in');
      } else {
        if (role === 'landlord') {
          router.replace('/(landlord-tabs)/dashboard');
        } else {
          router.replace('/(tenant-tabs)/browse');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, onboardingCompleted, role]);

  return (
    <View style={styles.container}>
      <SplashScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
