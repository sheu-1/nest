import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../src/components/ui/Typography';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import NestLogo from '../../src/components/ui/NestLogo';
import { supabase } from '../../src/lib/supabase';
import { evaluatePasswordStrength } from '../../src/utils/authValidation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Focus states
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const router = useRouter();

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

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      triggerShake();
      Alert.alert('Required Fields', 'Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      triggerShake();
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerShake();
      Alert.alert('Passwords Do Not Match', 'Please ensure both passwords are identical.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        triggerShake();
        Alert.alert('Update Failed', error.message);
      } else {
        Alert.alert(
          'Password Updated',
          'Your password has been successfully updated. Please sign in with your new credentials.',
          [
            {
              text: 'Sign In',
              onPress: () => {
                setIsLoading(true);
                // Ensure signOut doesn't block navigation forever
                Promise.race([
                  supabase.auth.signOut(),
                  new Promise(resolve => setTimeout(resolve, 2000))
                ]).finally(() => {
                  router.replace('/(auth)/sign-in');
                });
              },
            },
          ]
        );
      }
    } catch (e: any) {
      console.error(e);
      triggerShake();
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Evaluate password strength
  const strength = evaluatePasswordStrength(newPassword);

  const isMobile = SCREEN_WIDTH < 600;

  const renderFormContent = () => (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
      <Text style={styles.label}>New Password</Text>
      <View style={[styles.inputWrapper, isPassFocused && styles.inputWrapperFocused]}>
        <Ionicons name="lock-closed-outline" size={18} color={isPassFocused ? '#0a0501' : '#888888'} />
        <TextInput
          style={styles.input}
          placeholder="Min. 6 characters"
          placeholderTextColor="#888888"
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          onFocus={() => setIsPassFocused(true)}
          onBlur={() => setIsPassFocused(false)}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#888888" />
        </TouchableOpacity>
      </View>

      {/* Real-time Password Strength Indicator */}
      {newPassword.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBarWrapper}>
            {[1, 2, 3, 4].map((step) => (
              <View
                key={step}
                style={[
                  styles.strengthBar,
                  step <= strength.score ? { backgroundColor: strength.color } : null,
                ]}
              />
            ))}
          </View>
          <View style={styles.strengthTextRow}>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>
              {strength.label}
            </Text>
            <Text style={styles.strengthFeedback}>{strength.feedback}</Text>
          </View>
        </View>
      )}

      <Text style={styles.label}>Confirm New Password</Text>
      <View style={[styles.inputWrapper, isConfirmFocused && styles.inputWrapperFocused]}>
        <Ionicons name="checkmark-circle-outline" size={18} color={isConfirmFocused ? '#0a0501' : '#888888'} />
        <TextInput
          style={styles.input}
          placeholder="Repeat your password"
          placeholderTextColor="#888888"
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onFocus={() => setIsConfirmFocused(true)}
          onBlur={() => setIsConfirmFocused(false)}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#888888" />
        </TouchableOpacity>
      </View>

      <Pressable
        onPress={handleUpdatePassword}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.submitBtn,
          pressed && { transform: [{ scale: 0.98 }] },
          isLoading && { opacity: 0.8 },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>Update Password</Text>
        )}
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {isMobile ? (
        // MOBILE STACKED LAYOUT
        <ScrollView style={styles.mobileScrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.mobileTopHeader}>
            <TouchableOpacity style={styles.mobileBackBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <NestLogo width={180} textColor="#FFFFFF" />
          </View>

          <View style={styles.mobileFormSection}>
            <View style={styles.headerBlock}>
              <Text style={styles.heading}>Reset Password</Text>
              <Text style={styles.subheading}>Enter your brand new password below</Text>
            </View>

            {renderFormContent()}
          </View>
        </ScrollView>
      ) : (
        // DESKTOP/TABLET SIDE-BY-SIDE SPLIT LAYOUT
        <View style={styles.splitScreenContainer}>
          {/* Left Decorative Orange Panel */}
          <View style={styles.leftOrangePanel}>
            <NestLogo width={220} textColor="#FFFFFF" />
            <Text style={styles.leftTagline}>Secure account password recovery</Text>
          </View>

          {/* Right White Form Panel */}
          <View style={styles.rightContentPanel}>
            <ScrollView contentContainerStyle={styles.desktopScrollViewContent} keyboardShouldPersistTaps="handled">
              <View style={styles.headerBlock}>
                <Text style={styles.heading}>Reset Password</Text>
                <Text style={styles.subheading}>Set a strong password for your account</Text>
              </View>

              {renderFormContent()}
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
  // Split Layout (Desktop/Tablet)
  splitScreenContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftOrangePanel: {
    width: '40%',
    backgroundColor: '#0a0501',
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
    paddingHorizontal: 60,
    paddingVertical: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },

  // Stacked Layout (Mobile)
  mobileScrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileTopHeader: {
    height: 160,
    backgroundColor: '#0a0501',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mobileBackBtn: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 8,
  },
  mobileFormSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },

  // Typography & Headers
  headerBlock: {
    marginBottom: 28,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subheading: {
    fontSize: 14,
    color: '#888888',
    marginTop: 6,
  },

  // Input styles
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0a0501',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E0D8',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  inputWrapperFocused: {
    borderColor: '#0a0501',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 10,
  },
  eyeIcon: {
    padding: 4,
  },

  // Password strength
  strengthContainer: {
    marginTop: -12,
    marginBottom: 16,
    width: '100%',
  },
  strengthBarWrapper: {
    flexDirection: 'row',
    gap: 4,
    height: 4,
    width: '100%',
  },
  strengthBar: {
    flex: 1,
    backgroundColor: '#E8E0D8',
    borderRadius: 2,
  },
  strengthTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  strengthFeedback: {
    fontSize: 11,
    color: '#888888',
  },

  // Button styles
  submitBtn: {
    backgroundColor: '#0a0501',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0a0501',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
