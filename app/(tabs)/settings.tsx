import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Text } from '../../src/components/ui/Typography';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import { useToast } from '../../src/context/ToastContext';
import { storage } from '../../src/utils/storage';
import { supabase } from '../../src/lib/supabase';

// ─── Change Password Modal ───────────────────────────────────
function ChangePasswordModal({ visible, onClose, accentColor }: { visible: boolean; onClose: () => void; accentColor: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { showToast } = useToast();

  const handleChange = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.'); return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Too Short', 'Password must be at least 6 characters.'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.'); return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={cpModal.overlay}>
        <View style={cpModal.sheet}>
          <View style={cpModal.header}>
            <Text variant="h2" bold>Change Password</Text>
            <TouchableOpacity onPress={handleClose} style={cpModal.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text variant="small" bold style={cpModal.label}>New Password</Text>
          <View style={cpModal.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.secondaryText} />
            <TextInput
              style={cpModal.input}
              placeholder="Minimum 6 characters"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowNew(v => !v)}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.secondaryText} />
            </TouchableOpacity>
          </View>

          <Text variant="small" bold style={[cpModal.label, { marginTop: SPACING.md }]}>Confirm New Password</Text>
          <View style={cpModal.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.secondaryText} />
            <TextInput
              style={cpModal.input}
              placeholder="Repeat new password"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showCurrent}
            />
            <TouchableOpacity onPress={() => setShowCurrent(v => !v)}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.secondaryText} />
            </TouchableOpacity>
          </View>

          <Button
            label={isLoading ? 'Saving...' : 'Update Password'}
            onPress={handleChange}
            loading={isLoading}
            size="lg"
            style={{ width: '100%', marginTop: SPACING.xl, backgroundColor: accentColor }}
          />
        </View>
      </View>
    </Modal>
  );
}

const cpModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.card, // Set to dark chocolate!
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  closeBtn: { padding: SPACING.xs, backgroundColor: COLORS.background, borderRadius: RADIUS.full },
  label: { marginBottom: SPACING.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  input: { flex: 1, marginLeft: SPACING.sm, fontSize: 16, color: COLORS.text },
});

export default function ProfileScreen() {
  const { user, signOut, role } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const isLandlord = role === 'landlord';
  const accentColor = COLORS.brand; // Removed all blue accents! Replaced with orange.

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'N/A';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      isLandlord
        ? 'You will be logged out. To switch to a Tenant account, sign up with a different email.'
        : 'You will be logged out. To switch to a Landlord account, sign up with a different email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App Data',
      'This will clear all local data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await storage.clearAllData();
            showToast('App data reset', 'success');
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" bold>Profile</Text>
        <View style={[styles.roleTag, { backgroundColor: 'rgba(255, 111, 0, 0.15)', borderColor: 'rgba(255, 111, 0, 0.3)' }]}>
          <Ionicons
            name={isLandlord ? 'home' : 'search'}
            size={13}
            color={accentColor}
          />
          <Text variant="small" bold style={{ color: accentColor, marginLeft: 4 }}>
            {isLandlord ? 'Landlord' : 'Tenant'}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: accentColor }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text variant="h2" bold style={{ marginTop: SPACING.md }}>{displayName}</Text>
          <View style={[styles.badge, { backgroundColor: 'rgba(255, 111, 0, 0.15)' }]}>
            <Ionicons name={isLandlord ? 'home' : 'search'} size={12} color={accentColor} />
            <Text variant="small" bold style={{ color: accentColor, marginLeft: 4 }}>
              {isLandlord ? 'Property Landlord' : 'House Hunter'}
            </Text>
          </View>
          <Text variant="small" color={COLORS.secondaryText} style={{ marginTop: SPACING.xs }}>
            Member since {memberSince}
          </Text>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text variant="h3" bold style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '—'} />
            <InfoRow icon="calendar-outline" label="Joined" value={memberSince} />
            <InfoRow icon={isLandlord ? 'home-outline' : 'search-outline'} label="Role" value={isLandlord ? 'Landlord' : 'Tenant'} accent={accentColor} />
          </View>
        </View>

        {/* Permanent Role Notice */}
        <View style={styles.section}>
          <View style={styles.noticeBox}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.secondaryText} />
            <Text variant="small" color={COLORS.secondaryText} style={{ flex: 1, marginLeft: SPACING.sm }}>
              Your role is <Text variant="small" bold>permanently set as {isLandlord ? 'Landlord' : 'Tenant'}</Text>. To use a different role, sign up with a new account.
            </Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text variant="h3" bold style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.infoCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
                <Text variant="body" style={{ marginLeft: SPACING.sm }}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: COLORS.border, true: accentColor }}
              />
            </View>
            <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <View style={styles.toggleLeft}>
                <Ionicons name="call-outline" size={20} color={COLORS.text} />
                <Text variant="body" style={{ marginLeft: SPACING.sm }}>Show Phone Number</Text>
              </View>
              <Switch
                value={showPhone}
                onValueChange={setShowPhone}
                trackColor={{ false: COLORS.border, true: accentColor }}
              />
            </View>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text variant="h3" bold style={styles.sectionTitle}>Security</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={[infoStyles.row, { borderBottomWidth: 0 }]}
              onPress={() => setShowChangePassword(true)}
            >
              <Ionicons name="key-outline" size={18} color={accentColor} style={{ width: 24 }} />
              <Text variant="small" color={COLORS.secondaryText} style={{ width: 80 }}>Password</Text>
              <Text variant="body" style={{ flex: 1, color: accentColor }}>Change Password</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text variant="h3" bold style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <TouchableOpacity style={styles.dangerRow} onPress={handleResetApp}>
              <Ionicons name="refresh-outline" size={20} color="#C62828" />
              <Text variant="body" style={{ color: '#C62828', marginLeft: SPACING.sm }}>Reset All App Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dangerRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#C62828" />
              <Text variant="body" bold style={{ color: '#C62828', marginLeft: SPACING.sm }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text variant="small" color={COLORS.secondaryText} style={styles.version}>
          Nest v1.0.0
        </Text>
      </ScrollView>

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        accentColor={accentColor}
      />
    </SafeAreaView>
  );
}

const InfoRow = ({ icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) => (
  <View style={infoStyles.row}>
    <Ionicons name={icon} size={18} color={accent ?? COLORS.secondaryText} style={{ width: 24 }} />
    <Text variant="small" color={COLORS.secondaryText} style={{ width: 80 }}>{label}</Text>
    <Text variant="body" style={{ flex: 1, color: accent ?? COLORS.text }}>{value}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
    color: COLORS.secondaryText,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: COLORS.card, // Set to dark chocolate!
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card, // Set to dark chocolate!
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerCard: {
    backgroundColor: 'rgba(198, 40, 40, 0.1)', // Sleek dark translucent red danger card!
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.25)',
    overflow: 'hidden',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(198, 40, 40, 0.25)',
  },
  version: {
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
});
