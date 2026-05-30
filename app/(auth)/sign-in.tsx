import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, UserRole } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { Text } from '../../src/components/ui/Typography';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import NestLogo from '../../src/components/ui/NestLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Forgot Password Modal ────────────────────────────────────
function ForgotPasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [resetEmail, setResetEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { resetPasswordForEmail } = useAuth();

  const handleSend = async () => {
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setIsSending(true);
    try {
      const { error } = await resetPasswordForEmail(resetEmail.trim());
      if (error) {
        Alert.alert('Error', error.message || 'Failed to send reset link.');
      } else {
        setSent(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send reset link.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setResetEmail('');
    setSent(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.header}>
            <Text variant="h2" bold style={{ color: '#C8511B' }}>Forgot Password</Text>
            <TouchableOpacity onPress={handleClose} style={modal.closeBtn}>
              <Ionicons name="close" size={22} color="#C8511B" />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={modal.successState}>
              <View style={modal.successIcon}>
                <Ionicons name="checkmark-circle" size={56} color="#2E7D32" />
              </View>
              <Text variant="h3" bold align="center" style={{ marginTop: SPACING.md, color: '#C8511B' }}>Email Sent!</Text>
              <Text variant="body" color="#888888" align="center" style={{ marginTop: SPACING.sm }}>
                Check your inbox at {resetEmail} for a password reset link.
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={[modal.primaryBtn, { backgroundColor: '#C8511B', marginTop: SPACING.xl }]}
              >
                <Text style={modal.primaryBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text variant="body" color="#888888" style={{ marginBottom: SPACING.xl }}>
                Enter your account email and we'll send you a link to reset your password.
              </Text>

              <Text variant="small" bold style={modal.label}>Email Address</Text>
              <View style={modal.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#888888" />
                <TextInput
                  style={modal.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#CCCCCC"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                onPress={handleSend}
                disabled={isSending}
                style={[modal.primaryBtn, { backgroundColor: '#C8511B', marginTop: SPACING.xl }]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={modal.primaryBtnText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Sign In Screen ──────────────────────────────────────
export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('tenant');

  // Focus states
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const router = useRouter();
  const { signIn, completeOnboarding, setRole, signInWithGoogle } = useAuth();

  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      triggerShake();
      Alert.alert('Required Fields', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn({ email, password });
      if (error) {
        triggerShake();
        Alert.alert('Sign In Failed', error.message);
      } else {
        // Fetch session to verify the user's registered role
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        let finalRole: UserRole = selectedRole;

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          const actualRole = (profile?.role || user.user_metadata?.role || 'tenant') as UserRole;
          finalRole = actualRole;
          await setRole(actualRole);
        } else {
          await setRole(selectedRole);
        }

        await completeOnboarding();
        
        if (finalRole === 'landlord') {
          router.replace('/(landlord-tabs)/dashboard');
        } else {
          router.replace('/(tenant-tabs)/browse');
        }
      }
    } catch (e) {
      console.error(e);
      triggerShake();
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        if (error.message !== 'Google Sign In cancelled.') {
          Alert.alert('Google Sign In Error', error.message);
        }
      } else {
        await setRole('tenant');
        await completeOnboarding();
        router.replace('/(tenant-tabs)/browse');
      }
    } catch (e: any) {
      Alert.alert('Google Sign In Failed', e?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const isMobile = SCREEN_WIDTH < 600;

  return (
    <View style={styles.container}>
      {isMobile ? (
        // MOBILE STACKED LAYOUT
        <ScrollView style={styles.mobileScrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.mobileTopHeader}>
            <NestLogo width={180} textColor="#FFFFFF" centered />
          </View>

          <View style={styles.mobileFormSection}>
            <View style={styles.headerBlock}>
              <Text style={styles.heading}>Welcome Back</Text>
              <Text style={styles.subheading}>Sign in to your Nest account</Text>
            </View>

            <View style={styles.roleToggleContainer}>
              <TouchableOpacity 
                style={[styles.roleTab, selectedRole === 'tenant' && styles.roleTabActive]} 
                onPress={() => setSelectedRole('tenant')}
              >
                <Text style={[styles.roleTabText, selectedRole === 'tenant' && styles.roleTabTextActive]}>
                  🙋‍♂️ Tenant
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.roleTab, selectedRole === 'landlord' && styles.roleTabActive]} 
                onPress={() => setSelectedRole('landlord')}
              >
                <Text style={[styles.roleTabText, selectedRole === 'landlord' && styles.roleTabTextActive]}>
                  💼 Landlord
                </Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
              {/* Form Input fields */}
              <Text style={styles.label}>Email or Phone</Text>
              <View style={[
                styles.inputWrapper,
                isEmailFocused && styles.inputWrapperFocused
              ]}>
                <Ionicons name="mail-outline" size={18} color={isEmailFocused ? '#C8511B' : '#888888'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#CCCCCC"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                isPasswordFocused && styles.inputWrapperFocused
              ]}>
                <Ionicons name="lock-closed-outline" size={18} color={isPasswordFocused ? '#C8511B' : '#888888'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#CCCCCC"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#888888" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotPasswordLink} onPress={() => setShowForgot(true)}>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Pressable
                onPress={handleSignIn}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { transform: [{ scale: 0.98 }] }
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </Pressable>



              <View style={styles.footerLinkRow}>
                <Text style={styles.footerMutedText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                  <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
              </View>


            </Animated.View>
          </View>
        </ScrollView>
      ) : (
        // DESKTOP/TABLET SIDE-BY-SIDE SPLIT LAYOUT
        <View style={styles.splitScreenContainer}>
          {/* Left Chocolate Panel */}
          <View style={styles.leftChocolatePanel}>
            <NestLogo width={240} textColor="#FFFFFF" centered />
            <Text style={styles.leftTagline}>Find Your Perfect Home</Text>
          </View>

          {/* Right White Form Panel */}
          <View style={styles.rightFormPanel}>
            <ScrollView contentContainerStyle={styles.desktopScrollViewContent} keyboardShouldPersistTaps="handled">
              <View style={{ width: '100%', maxWidth: 440 }}>
                <View style={styles.headerBlock}>
                  <Text style={styles.heading}>Welcome Back</Text>
                  <Text style={styles.subheading}>Sign in to your Nest account</Text>
                </View>

                <View style={styles.roleToggleContainer}>
                  <TouchableOpacity 
                    style={[styles.roleTab, selectedRole === 'tenant' && styles.roleTabActive]} 
                    onPress={() => setSelectedRole('tenant')}
                  >
                    <Text style={[styles.roleTabText, selectedRole === 'tenant' && styles.roleTabTextActive]}>
                      🙋‍♂️ Tenant
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.roleTab, selectedRole === 'landlord' && styles.roleTabActive]} 
                    onPress={() => setSelectedRole('landlord')}
                  >
                    <Text style={[styles.roleTabText, selectedRole === 'landlord' && styles.roleTabTextActive]}>
                      💼 Landlord
                    </Text>
                  </TouchableOpacity>
                </View>

                <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
                  <Text style={styles.label}>Email or Phone</Text>
                  <View style={[
                    styles.inputWrapper,
                    isEmailFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="mail-outline" size={18} color={isEmailFocused ? '#C8511B' : '#888888'} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="name@example.com"
                      placeholderTextColor="#CCCCCC"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  <Text style={styles.label}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    isPasswordFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="lock-closed-outline" size={18} color={isPasswordFocused ? '#C8511B' : '#888888'} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="#CCCCCC"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#888888" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.forgotPasswordLink} onPress={() => setShowForgot(true)}>
                    <Text style={styles.linkText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <Pressable
                    onPress={handleSignIn}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && { transform: [{ scale: 0.98 }] }
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Sign In</Text>
                    )}
                  </Pressable>



                  <View style={styles.footerLinkRow}>
                    <Text style={styles.footerMutedText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                      <Text style={styles.linkText}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>


                </Animated.View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Forgot Password modal */}
      <ForgotPasswordModal visible={showForgot} onClose={() => setShowForgot(false)} />
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
  leftChocolatePanel: {
    width: '45%',
    backgroundColor: '#8D6E63', // Solid chocolate brown
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
  rightFormPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  desktopScrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },

  // Responsive layout: Mobile stacked view
  mobileScrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileTopHeader: {
    height: 200,
    backgroundColor: '#8D6E63', // Solid chocolate brown on top
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileFormSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 24,
  },

  // Form Components
  headerBlock: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subheading: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 18,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E0D8',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FAFAFA',
  },
  inputWrapperFocused: {
    borderColor: '#C8511B', // Brand Orange glow on focus
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1A1A1A',
  },
  eyeBtn: {
    padding: SPACING.xs,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 24,
  },
  linkText: {
    fontSize: 12,
    color: '#C8511B', // Orange highlight links
    fontWeight: 'bold',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#8D6E63', // Chocolate brown primary button
    height: 54,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E0D8',
  },
  dividerText: {
    fontSize: 12,
    color: '#888888',
    marginHorizontal: 12,
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    height: 52,
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerMutedText: {
    fontSize: 12,
    color: '#888888',
  },
  landlordDemoLink: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E0D8',
    backgroundColor: '#FAFAFA',
  },
  landlordDemoText: {
    fontSize: 13,
    color: '#8D6E63', // Warm rich chocolate brown
    fontWeight: 'bold',
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1.5,
    borderColor: '#E8E0D8',
    marginBottom: 20,
    marginTop: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: '#C8511B', // Vibrant brand orange active tab background
    shadowColor: '#C8511B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

// Modal Styles
const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  closeBtn: {
    padding: SPACING.xs,
    backgroundColor: '#FAFAFA',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E8E0D8',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1A1A1A',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
