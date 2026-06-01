import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from '../../src/components/ui/Typography';
import { COLORS, SPACING } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text variant="h2" bold style={styles.title}>Terms & Privacy</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="body" style={styles.paragraph}>
          <Text bold>Last Updated: {new Date().toLocaleDateString()}</Text>
        </Text>
        
        <Text variant="h3" bold style={styles.sectionTitle}>1. Data Privacy</Text>
        <Text variant="body" style={styles.paragraph}>
          Your privacy is critically important to us. At Nest, we have a few fundamental principles:
          We don’t ask you for personal information unless we truly need it.
          We don’t share your personal information with anyone except to comply with the law, develop our products, or protect our rights.
          We don’t store personal information on our servers unless required for the on-going operation of one of our services.
        </Text>

        <Text variant="h3" bold style={styles.sectionTitle}>2. Terms of Service</Text>
        <Text variant="body" style={styles.paragraph}>
          By accessing or using the Nest application, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.
          We reserve the right to modify or replace these Terms at any time.
        </Text>

        <Text variant="h3" bold style={styles.sectionTitle}>3. User Accounts</Text>
        <Text variant="body" style={styles.paragraph}>
          When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </Text>
        
        <Text variant="h3" bold style={styles.sectionTitle}>4. Contact Us</Text>
        <Text variant="body" style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at support@nest.com.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  sectionTitle: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    color: COLORS.brand,
  },
  paragraph: {
    lineHeight: 24,
    color: COLORS.secondaryText,
  },
});
