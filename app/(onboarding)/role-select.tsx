import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '../../src/components/ui/Typography';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '../../src/context/AuthContext';
import NestLogo from '../../src/components/ui/NestLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole, completeOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = async (selectedRole: UserRole) => {
    setIsLoading(true);
    try {
      await setRole(selectedRole);
      await completeOnboarding();
      
      if (selectedRole === 'landlord') {
        router.replace('/(landlord-tabs)/dashboard');
      } else {
        router.replace('/(tenant-tabs)/browse');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save your preference.');
    } finally {
      setIsLoading(false);
    }
  };

  const isMobile = SCREEN_WIDTH < 600;

  return (
    <View style={styles.container}>
      {isMobile ? (
        // MOBILE VERTICAL STACK
        <ScrollView style={styles.mobileScrollView} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.mobileTopHeader}>
            <NestLogo width={160} textColor="#FFFFFF" />
            <Text style={styles.mobileTagline}>Choose your profile type</Text>
          </View>

          <View style={styles.mobileContentSection}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C8511B" />
                <Text style={{ marginTop: 12, color: '#888888' }}>Saving role preference...</Text>
              </View>
            ) : (
              <View style={styles.cardsStack}>
                {/* CARD 1: TENANT */}
                <View style={styles.card}>
                  <View style={styles.iconWrapper}>
                    <Text style={{ fontSize: 44 }}>🔍</Text>
                  </View>
                  <Text style={styles.cardTitle}>Tenant</Text>
                  <Text style={styles.cardDesc}>
                    Browse listings, save favorites, contact landlords
                  </Text>
                  <View style={styles.divider} />
                  <View style={styles.features}>
                    <View style={styles.featureRow}>
                      <Text style={styles.check}>✓</Text>
                      <Text style={styles.featureText}>Search & filter listings</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Text style={styles.check}>✓</Text>
                      <Text style={styles.featureText}>Save favorites</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Text style={styles.check}>✓</Text>
                      <Text style={styles.featureText}>Map discovery</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Text style={styles.check}>✓</Text>
                      <Text style={styles.featureText}>Direct messaging</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleSelectRole('tenant')}
                    style={({ pressed }) => [
                      styles.tenantBtn,
                      pressed && { transform: [{ scale: 0.98 }] }
                    ]}
                  >
                    <Text style={styles.btnText}>Get Started</Text>
                  </Pressable>
                </View>

                {/* CARD 2: LANDLORD */}
                <View style={styles.card}>
                  <View style={styles.iconWrapper}>
                    <Text style={{ fontSize: 44 }}>🏠</Text>
                  </View>
                  <Text style={styles.cardTitle}>Landlord</Text>
                  <Text style={styles.cardDesc}>
                    Post listings, manage properties, connect with tenants
                  </Text>
                  <View style={styles.divider} />
                  <View style={styles.features}>
                    <View style={styles.featureRow}>
                      <Text style={[styles.check, { color: '#C8511B' }]}>✓</Text>
                      <Text style={styles.featureText}>Post with photos</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Text style={[styles.check, { color: '#C8511B' }]}>✓</Text>
                      <Text style={styles.featureText}>Manage listings</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Text style={[styles.check, { color: '#C8511B' }]}>✓</Text>
                      <Text style={styles.featureText}>View inquiries</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Text style={[styles.check, { color: '#C8511B' }]}>✓</Text>
                      <Text style={styles.featureText}>Analytics</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleSelectRole('landlord')}
                    style={({ pressed }) => [
                      styles.landlordBtn,
                      pressed && { transform: [{ scale: 0.98 }] }
                    ]}
                  >
                    <Text style={styles.btnText}>Get Started</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        // DESKTOP/TABLET SIDE-BY-SIDE SPLIT LAYOUT
        <View style={styles.splitScreenContainer}>
          {/* Left Orange Panel */}
          <View style={styles.leftOrangePanel}>
            <NestLogo width={220} textColor="#FFFFFF" />
            <Text style={styles.leftTagline}>Choose your profile type</Text>
          </View>

          {/* Right White Cards Panel */}
          <View style={styles.rightContentPanel}>
            <ScrollView contentContainerStyle={styles.desktopScrollViewContent}>
              <View style={styles.desktopHeader}>
                <Text style={styles.desktopTitle}>How will you use Nest?</Text>
                <Text style={styles.desktopSubtitle}>Select your primary profile role below</Text>
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#C8511B" />
                  <Text style={{ marginTop: 12, color: '#888888' }}>Saving role preference...</Text>
                </View>
              ) : (
                <View style={styles.cardsRow}>
                  {/* CARD 1: TENANT */}
                  <View style={styles.card}>
                    <View style={styles.iconWrapper}>
                      <Text style={{ fontSize: 48 }}>🔍</Text>
                    </View>
                    <Text style={styles.cardTitle}>Tenant</Text>
                    <Text style={styles.cardDesc}>
                      Browse listings, save favorites, contact landlords
                    </Text>
                    <View style={styles.divider} />
                    <View style={styles.features}>
                      <View style={styles.featureRow}>
                        <Text style={styles.check}>✓</Text>
                        <Text style={styles.featureText}>Search & filter listings</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.check}>✓</Text>
                        <Text style={styles.featureText}>Save favorites</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.check}>✓</Text>
                        <Text style={styles.featureText}>Map discovery</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.check}>✓</Text>
                        <Text style={styles.featureText}>Direct messaging</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleSelectRole('tenant')}
                      style={({ pressed }) => [
                        styles.tenantBtn,
                        pressed && { transform: [{ scale: 0.98 }] }
                      ]}
                    >
                      <Text style={styles.btnText}>Get Started</Text>
                    </Pressable>
                  </View>

                  {/* CARD 2: LANDLORD */}
                  <View style={styles.card}>
                    <View style={styles.iconWrapper}>
                      <Text style={{ fontSize: 48 }}>🏠</Text>
                    </View>
                    <Text style={styles.cardTitle}>Landlord</Text>
                    <Text style={styles.cardDesc}>
                      Post listings, manage properties, connect with tenants
                    </Text>
                    <View style={styles.divider} />
                    <View style={styles.features}>
                      <View style={styles.featureRow}>
                        <Text style={[styles.check, { color: '#C8511B' }]}>✓</Text>
                        <Text style={styles.featureText}>Post with photos</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={[styles.check, { color: '#C8511B' }]}>✓</Text>
                        <Text style={styles.featureText}>Manage listings</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={[styles.check, { color: '#C8511B' }]}>✓</Text>
                        <Text style={styles.featureText}>View inquiries</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={[styles.check, { color: '#C8511B' }]}>✓</Text>
                        <Text style={styles.featureText}>Analytics</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleSelectRole('landlord')}
                      style={({ pressed }) => [
                        styles.landlordBtn,
                        pressed && { transform: [{ scale: 0.98 }] }
                      ]}
                    >
                      <Text style={styles.btnText}>Get Started</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Responsive layout: Desktop Split view
  splitScreenContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftOrangePanel: {
    width: '40%',
    backgroundColor: '#C8511B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  leftTagline: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '300',
    marginTop: 20,
    opacity: 0.8,
  },
  rightContentPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  desktopScrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 60,
  },
  desktopHeader: {
    marginBottom: 40,
    alignItems: 'center',
  },
  desktopTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  desktopSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 6,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },

  // Responsive layout: Mobile stacked view
  mobileScrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileTopHeader: {
    height: 150,
    backgroundColor: '#C8511B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileTagline: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 10,
    opacity: 0.8,
  },
  mobileContentSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  cardsStack: {
    gap: 24,
  },

  // Card styles
  card: {
    flex: 1,
    maxWidth: 380,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E8E0D8',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E8E0D8',
    marginBottom: 16,
  },
  features: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  check: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066FF', // Cobalt blue for Tenant card
    marginRight: 10,
  },
  featureText: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  tenantBtn: {
    width: '100%',
    backgroundColor: '#0066FF', // Cobalt blue button for Tenant
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landlordBtn: {
    width: '100%',
    backgroundColor: '#C8511B', // Orange button for Landlord
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
});
