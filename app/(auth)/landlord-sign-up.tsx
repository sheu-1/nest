import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Text } from '../../src/components/ui/Typography';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import NestLogo from '../../src/components/ui/NestLogo';
import { validateEmail, formatKenyanPhoneNumber } from '../../src/utils/authValidation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Privacy Policy Modal ────────────────────────────────────────
function PrivacyPolicyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.header}>
            <Text variant="h2" bold style={{ color: '#7a480d' }}>Privacy Policy</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={22} color="#7a480d" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="body" bold style={modal.sectionTitle}>Your Data, Our Promise</Text>
            <Text variant="body" style={modal.policyText}>
              At Nest, we take your privacy very seriously. When you register as a Property Owner, we collect certain personal information including your name, email address, phone number, and National ID or Passport Number.
            </Text>

            <Text variant="body" bold style={modal.sectionTitle}>What We Collect</Text>
            <Text variant="body" style={modal.policyText}>
              • Full name and contact details{'\n'}
              • Email address for account management{'\n'}
              • Phone number for tenant communication{'\n'}
              • National ID or Passport Number for identity verification only
            </Text>

            <Text variant="body" bold style={modal.sectionTitle}>How We Use Your Data</Text>
            <Text variant="body" style={modal.policyText}>
              Your personal data is used exclusively for the purpose of running the Nest platform. This includes verifying your identity as a property owner, enabling tenants to contact you about listings, and ensuring the safety and trust of our community.
            </Text>

            <Text variant="body" bold style={[modal.sectionTitle, { color: '#C8511B' }]}>
              🔒 We Do NOT Share or Sell Your Data
            </Text>
            <Text variant="body" style={modal.policyText}>
              We do not sell, rent, trade, or share your personal data with any third parties for marketing or commercial purposes. Your National ID number is encrypted and used solely for identity verification — it is never displayed publicly or shared with tenants.
            </Text>

            <Text variant="body" bold style={modal.sectionTitle}>Data Security</Text>
            <Text variant="body" style={modal.policyText}>
              All data is stored securely using industry-standard encryption (Supabase with Row-Level Security). Only you can access and manage your own data. We continuously monitor and update our security practices to protect your information.
            </Text>

            <Text variant="body" bold style={modal.sectionTitle}>Your Rights</Text>
            <Text variant="body" style={[modal.policyText, { marginBottom: 24 }]}>
              You have the right to access, correct, or delete your personal data at any time by contacting us through the app settings. You may also request account deletion, upon which all your data will be permanently removed from our systems.
            </Text>

            <TouchableOpacity
              onPress={onClose}
              style={[modal.primaryBtn, { backgroundColor: '#7a480d' }]}
            >
              <Text style={modal.primaryBtnText}>I Understand</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Landlord Sign Up Screen ──────────────────────────────────────
export default function LandlordSignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Focus states
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isIdFocused, setIsIdFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const router = useRouter();
  const { signUp, setRole, completeOnboarding } = useAuth();

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
    if (!name.trim() || !email.trim() || !phone.trim() || !idNumber.trim() || !password) {
      triggerShake();
      Alert.alert('Required Fields', 'Please fill in all fields including your National ID / Passport Number.');
      return;
    }
    if (!validateEmail(email)) {
      triggerShake();
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (idNumber.trim().length < 6) {
      triggerShake();
      Alert.alert('Invalid ID', 'Please enter a valid National ID or Passport Number.');
      return;
    }
    if (password.length < 6) {
      triggerShake();
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (!agreeTerms) {
      triggerShake();
      Alert.alert('Privacy Policy', 'You must agree to the Privacy Policy & Terms to continue.');
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
            role: 'landlord',
            id_number: idNumber.trim(),
          },
        },
      });

      if (error) {
        triggerShake();
        Alert.alert('Sign Up Failed', error.message);
      } else {
        await setRole('landlord');
        await completeOnboarding();
        router.replace('/(landlord-tabs)/dashboard');
      }
    } catch (e) {
      console.error(e);
      triggerShake();
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const isMobile = SCREEN_WIDTH < 600;

  return (
    <View style={styles.container}>
      {isMobile ? (
        // ── MOBILE STACKED LAYOUT ──
        <ScrollView style={styles.mobileScrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.mobileTopHeader}>
            <TouchableOpacity style={styles.mobileBackBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <NestLogo width={180} textColor="#FFFFFF" centered />
          </View>

          <View style={styles.mobileFormSection}>
            {/* Header */}
            <View style={styles.headerBlock}>
              <View style={styles.landlordBadge}>
                <Ionicons name="business" size={18} color="#7a480d" />
                <Text style={styles.landlordBadgeText}>Property Owner Registration</Text>
              </View>
              <Text style={styles.heading}>Create Owner Account</Text>
              <Text style={styles.subheading}>List your properties and connect with tenants</Text>
            </View>

            {/* Privacy notice banner */}
            <View style={styles.privacyBanner}>
              <Ionicons name="shield-checkmark" size={20} color="#7a480d" />
              <Text style={styles.privacyBannerText}>
                Your data is encrypted and never sold.{' '}
                <Text style={styles.privacyBannerLink} onPress={() => setShowPrivacyPolicy(true)}>
                  Read our Privacy Policy
                </Text>
              </Text>
            </View>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputWrapper, isNameFocused && styles.inputWrapperFocused]}>
                <Ionicons name="person-outline" size={18} color={isNameFocused ? '#C8511B' : '#888888'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="John Doe"
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

              {/* ID Number — unique to landlord flow */}
              <Text style={styles.label}>National ID / Passport Number</Text>
              <View style={styles.idHint}>
                <Ionicons name="lock-closed" size={12} color="#7a480d" />
                <Text style={styles.idHintText}>Encrypted & used for identity verification only</Text>
              </View>
              <View style={[styles.inputWrapper, isIdFocused && styles.inputWrapperFocused, styles.inputWrapperHighlight]}>
                <Ionicons name="card-outline" size={18} color={isIdFocused ? '#7a480d' : '#7a480d'} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 12345678 or A12345678"
                  placeholderTextColor="#CCCCCC"
                  value={idNumber}
                  onChangeText={setIdNumber}
                  onFocus={() => setIsIdFocused(true)}
                  onBlur={() => setIsIdFocused(false)}
                  autoCapitalize="characters"
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

              {/* Privacy Policy Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxText}>
                  I agree to the{' '}
                  <Text style={styles.linkText} onPress={() => setShowPrivacyPolicy(true)}>
                    Privacy Policy & Terms of Service
                  </Text>
                  {'\n'}
                  <Text style={styles.checkboxSubText}>
                    We do not share or sell your data. Your ID is used strictly for verification.
                  </Text>
                </Text>
              </TouchableOpacity>

              <Pressable
                onPress={handleSignUp}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { transform: [{ scale: 0.98 }] }
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Property Owner Account</Text>
                )}
              </Pressable>

              <View style={styles.footerLinkRow}>
                <Text style={styles.footerMutedText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          </View>
        </ScrollView>
      ) : (
        // ── DESKTOP SPLIT LAYOUT ──
        <View style={styles.splitScreenContainer}>
          {/* Left Panel */}
          <View style={styles.leftPanel}>
            <NestLogo width={240} textColor="#FFFFFF" centered />
            <Text style={styles.leftTagline}>List Your Properties</Text>
            <Text style={styles.leftSubTagline}>Connect with thousands of tenants across Kenya</Text>

            <View style={styles.featureList}>
              {[
                { icon: 'home', text: 'Post unlimited listings' },
                { icon: 'chatbubbles', text: 'Chat directly with tenants' },
                { icon: 'stats-chart', text: 'Track listing performance' },
                { icon: 'shield-checkmark', text: 'Verified landlord badge' },
              ].map((item, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name={item.icon as any} size={18} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Right White Form Panel */}
          <View style={styles.rightFormPanel}>
            <ScrollView contentContainerStyle={styles.desktopScrollViewContent} keyboardShouldPersistTaps="handled">
              <View style={{ width: '100%', maxWidth: 480 }}>
                <View style={styles.landlordBadge}>
                  <Ionicons name="business" size={18} color="#7a480d" />
                  <Text style={styles.landlordBadgeText}>Property Owner Registration</Text>
                </View>
                <View style={styles.headerBlock}>
                  <Text style={styles.heading}>Create Owner Account</Text>
                  <Text style={styles.subheading}>List your properties and connect with tenants</Text>
                </View>

                <View style={styles.privacyBanner}>
                  <Ionicons name="shield-checkmark" size={20} color="#7a480d" />
                  <Text style={styles.privacyBannerText}>
                    Your data is encrypted and never sold.{' '}
                    <Text style={styles.privacyBannerLink} onPress={() => setShowPrivacyPolicy(true)}>
                      Read our Privacy Policy
                    </Text>
                  </Text>
                </View>

                <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={[styles.inputWrapper, isNameFocused && styles.inputWrapperFocused]}>
                    <Ionicons name="person-outline" size={18} color={isNameFocused ? '#C8511B' : '#888888'} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="John Doe"
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

                  <Text style={styles.label}>National ID / Passport Number</Text>
                  <View style={styles.idHint}>
                    <Ionicons name="lock-closed" size={12} color="#7a480d" />
                    <Text style={styles.idHintText}>Encrypted & used for identity verification only</Text>
                  </View>
                  <View style={[styles.inputWrapper, isIdFocused && styles.inputWrapperFocused, styles.inputWrapperHighlight]}>
                    <Ionicons name="card-outline" size={18} color="#7a480d" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 12345678 or A12345678"
                      placeholderTextColor="#CCCCCC"
                      value={idNumber}
                      onChangeText={setIdNumber}
                      onFocus={() => setIsIdFocused(true)}
                      onBlur={() => setIsIdFocused(false)}
                      autoCapitalize="characters"
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
                    <Text style={styles.checkboxText}>
                      I agree to the{' '}
                      <Text style={styles.linkText} onPress={() => setShowPrivacyPolicy(true)}>
                        Privacy Policy & Terms of Service
                      </Text>
                      {'\n'}
                      <Text style={styles.checkboxSubText}>
                        We do not share or sell your data. Your ID is used strictly for verification.
                      </Text>
                    </Text>
                  </TouchableOpacity>

                  <Pressable
                    onPress={handleSignUp}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && { transform: [{ scale: 0.98 }] }
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Create Property Owner Account</Text>
                    )}
                  </Pressable>

                  <View style={styles.footerLinkRow}>
                    <Text style={styles.footerMutedText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                      <Text style={styles.linkText}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      <PrivacyPolicyModal visible={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  splitScreenContainer: { flex: 1, flexDirection: 'row' },
  leftPanel: {
    width: '45%',
    backgroundColor: '#7a480d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  leftTagline: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  leftSubTagline: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 8, textAlign: 'center' },
  featureList: { marginTop: 32, width: '100%', gap: 14 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  rightFormPanel: { flex: 1, backgroundColor: '#FFFFFF' },
  desktopScrollViewContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 60 },

  mobileScrollView: { flex: 1, backgroundColor: '#FFFFFF' },
  mobileTopHeader: {
    height: 200,
    backgroundColor: '#7a480d',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mobileBackBtn: { position: 'absolute', left: 20, top: 40, padding: 8 },
  mobileFormSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 24,
    paddingBottom: 40,
  },

  landlordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(141, 110, 99, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(141, 110, 99, 0.25)',
  },
  landlordBadgeText: { fontSize: 12, fontWeight: '600', color: '#7a480d' },

  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(141, 110, 99, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(141, 110, 99, 0.2)',
    marginBottom: 16,
  },
  privacyBannerText: { flex: 1, fontSize: 12, color: '#555555', lineHeight: 18 },
  privacyBannerLink: { color: '#7a480d', fontWeight: 'bold', textDecorationLine: 'underline' },

  idHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  idHintText: { fontSize: 11, color: '#7a480d' },
  inputWrapperHighlight: { borderColor: 'rgba(141,110,99,0.4)', backgroundColor: 'rgba(141,110,99,0.04)' },

  headerBlock: { marginBottom: 16 },
  heading: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A' },
  subheading: { fontSize: 14, color: '#888888', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginTop: 14, marginBottom: 6 },
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
  inputWrapperFocused: { borderColor: '#C8511B', backgroundColor: '#FFFFFF' },
  textInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1A1A1A' },
  eyeBtn: { padding: SPACING.xs },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 18, marginBottom: 24 },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#E8E0D8',
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#7a480d', borderColor: '#7a480d' },
  checkboxText: { flex: 1, fontSize: 12, color: '#555555', lineHeight: 18 },
  checkboxSubText: { fontSize: 11, color: '#888888', fontStyle: 'italic' },
  linkText: { fontSize: 12, color: '#C8511B', fontWeight: 'bold' },
  primaryButton: {
    width: '100%',
    backgroundColor: '#7a480d',
    height: 54,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7a480d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  footerLinkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  footerMutedText: { fontSize: 12, color: '#888888' },
});

// Modal Styles
const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  closeBtn: {
    padding: SPACING.xs,
    backgroundColor: '#FAFAFA',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  sectionTitle: { color: '#7a480d', marginTop: 16, marginBottom: 4 },
  policyText: { fontSize: 14, color: '#555555', lineHeight: 22 },
  primaryBtn: { width: '100%', height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});
