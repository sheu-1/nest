import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '../../src/components/ui/Typography';
import { Button } from '../../src/components/ui/Button';
import { COLORS, SPACING } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import NestLogo from '../../src/components/ui/NestLogo';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <NestLogo width={220} textColor="#8D6E63" />
          <Text variant="h1" style={[styles.title, { marginTop: SPACING.xl }]}>Find Your Perfect Home</Text>
          <Text variant="body" color={COLORS.secondaryText} style={styles.subtitle}>
            Whether you're searching for an apartment or listing a property
          </Text>
        </View>

        <View style={styles.actions}>
          <Button 
            label="🔍 I'm Looking for an Apartment" 
            onPress={() => router.push('/(onboarding)/role-select?role=tenant')} 
            size="lg"
            style={[styles.button, { backgroundColor: '#0066FF' }]}
          />
          
          <Button 
            label="🏠 I'm Listing a Property" 
            onPress={() => router.push('/(onboarding)/role-select?role=landlord')} 
            size="lg"
            style={styles.button}
          />
        </View>
        
        <Text variant="small" color={COLORS.secondaryText} align="center" style={styles.footerText}>
          You can switch roles anytime in Settings
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: height * 0.1,
  },
  logo: {
    fontSize: 48,
    color: COLORS.brand,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  actions: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  button: {
    width: '100%',
    height: 60,
  },
  footerText: {
    marginTop: 'auto',
    marginBottom: SPACING.lg,
  }
});
