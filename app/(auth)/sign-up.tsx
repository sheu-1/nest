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
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, UserRole } from '../../src/context/AuthContext';
import { Text } from '../../src/components/ui/Typography';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import NestLogo from '../../src/components/ui/NestLogo';
import { validateEmail, formatKenyanPhoneNumber } from '../../src/utils/authValidation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Role is always tenant on this page
  const selectedRole: UserRole = 'tenant';

  // Focus states
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const router = useRouter();
  const { signUp, setRole, completeOnboarding, signInWithGoogle } = useAuth();

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

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      triggerShake();
      Alert.alert('Required Fields', 'Please fill in all standard signup fields.');
      return;
    }
    if (!validateEmail(email)) {
      triggerShake();
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      triggerShake();
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (!agreeTerms) {
      triggerShake();
      Alert.alert('Terms of Service', 'You must agree to the Terms of Service to continue.');
      return;
    }

    const formattedPhone = formatKenyanPhoneNumber(phone);

    setIsLoading(true);
    try {
      const { error } = await signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: formattedPhone,
            role: selectedRole,
          },
        },
      });

      if (error) {
        triggerShake();
        Alert.alert('Sign Up Failed', error.message);
      } else {
        // Successful signup: settle chosen role and skip onboarding!
        await setRole(selectedRole); 
        await completeOnboarding();
        
        router.replace('/(tenant-tabs)/browse');
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
          Alert.alert('Google Sign Up Error', error.message);
        }
      } else {
        await setRole(selectedRole);
        await completeOnboarding();
        router.replace('/(tenant-tabs)/browse');
      }
    } catch (e: any) {
      Alert.alert('Google Sign Up Failed', e?.message || 'An unexpected error occurred.');
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
            <TouchableOpacity style={styles.mobileBackBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <NestLogo width={180} textColor="#FFFFFF" centered />
          </View>

          <View style={styles.mobileFormSection}>
            <View style={styles.headerBlock}>
              <Text style={styles.heading}>Create Account</Text>
              <Text style={styles.subheading}>Join Nest to find your perfect home</Text>
            </View>

            {/* Property owner link at top */}
            <TouchableOpacity
              style={styles.ownerBanner}
              onPress={() => router.push('/(auth)/landlord-sign-up')}
            >
              <Ionicons name="business-outline" size={16} color="#7a480d" />
              <Text style={styles.ownerBannerText}>Are you a property owner? <Text style={styles.ownerBannerLink}>Sign up here →</Text></Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
              {/* Fields */}
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputWrapper, isNameFocused && styles.inputWrapperFocused]}>
                <Ionicons name="person-outline" size={18} color={isNameFocused ? '#C8511B' : '#888888'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Jane Doe"
                  placeholderTextColor="#CCCCCC"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                />
              </View>

              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperFocused]}>
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

              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputWrapper, isPhoneFocused && styles.inputWrapperFocused]}>
                <Ionicons name="call-outline" size={18} color={isPhoneFocused ? '#C8511B' : '#888888'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+254712345678"
                  placeholderTextColor="#CCCCCC"
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, isPasswordFocused && styles.inputWrapperFocused]}>
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

              {/* Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxText}>I agree to the Terms of Service</Text>
              </TouchableOpacity>

              <Pressable
                onPress={handleSignUp}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { transform: [{ scale: 0.98 }] }
                ]}
              >
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              </Pressable>



            </Animated.View>
          </View>
        </ScrollView>
      ) : (
        // DESKTOP SPLIT LAYOUT
        <View style={styles.splitScreenContainer}>
          {/* Left Orange Panel */}
          <View style={styles.leftOrangePanel}>
            <NestLogo width={240} textColor="#FFFFFF" centered />
            <Text style={styles.leftTagline}>Find Your Perfect Home</Text>
          </View>

          {/* Right White Form Panel */}
          <View style={styles.rightFormPanel}>
            <ScrollView contentContainerStyle={styles.desktopScrollViewContent} keyboardShouldPersistTaps="handled">
              <View style={{ width: '100%', maxWidth: 440 }}>
                <View style={styles.headerBlock}>
                  <Text style={styles.heading}>Create Account</Text>
                  <Text style={styles.subheading}>Join Nest to find your perfect home</Text>
                </View>

                <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={[styles.inputWrapper, isNameFocused && styles.inputWrapperFocused]}>
                    <Ionicons name="person-outline" size={18} color={isNameFocused ? '#C8511B' : '#888888'} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Jane Doe"
                      placeholderTextColor="#CCCCCC"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => setIsNameFocused(true)}
                      onBlur={() => setIsNameFocused(false)}
                    />
                  </View>

                  <Text style={styles.label}>Email Address</Text>
                  <View style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperFocused]}>
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

                  <Text style={styles.label}>Phone Number</Text>
                  <View style={[styles.inputWrapper, isPhoneFocused && styles.inputWrapperFocused]}>
                    <Ionicons name="call-outline" size={18} color={isPhoneFocused ? '#C8511B' : '#888888'} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="+254712345678"
                      placeholderTextColor="#CCCCCC"
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setIsPhoneFocused(true)}
                      onBlur={() => setIsPhoneFocused(false)}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.inputWrapper, isPasswordFocused && styles.inputWrapperFocused]}>
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

                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAgreeTerms(!agreeTerms)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                      {agreeTerms && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.checkboxText}>I agree to the Terms of Service</Text>
                  </TouchableOpacity>

                  <Pressable
                    onPress={handleSignUp}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && { transform: [{ scale: 0.98 }] }
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Sign Up</Text>
                  </Pressable>



                </Animated.View>
              </View>
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
    width: '45%',
    backgroundColor: '#C8511B', // Solid orange panel
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
    backgroundColor: '#C8511B', // Solid orange on top
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mobileBackBtn: {
    position: 'absolute',
    left: 20,
    top: 40,
    padding: 8,
  },
  mobileFormSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 24,
    paddingBottom: 40,
  },

  // Form Components
  headerBlock: {
    marginBottom: 24,
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
    marginTop: 14,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#E8E0D8',
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#C8511B',
    borderColor: '#C8511B',
  },
  checkboxText: {
    fontSize: 12,
    color: '#888888',
  },
  linkText: {
    fontSize: 12,
    color: '#C8511B', // Orange highlight links
    fontWeight: 'bold',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#C8511B', // Solid orange primary button
    height: 54,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C8511B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
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
  ownerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(122, 72, 13, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(122, 72, 13, 0.2)',
    marginBottom: 20,
  },
  ownerBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#555555',
  },
  ownerBannerLink: {
    color: '#7a480d',
    fontWeight: 'bold',
  },
});
