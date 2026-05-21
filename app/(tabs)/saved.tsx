import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Text } from '../../src/components/ui/Typography';
import { COLORS, SPACING } from '../../src/constants/theme';

/** Saved tab:
 *  - Tenants: their saved/favorited listings
 *  - Landlords: Post new listing form
 */
import TenantSaved from '../(tenant)/saved';
import LandlordPost from '../(landlord)/post';

export default function SavedTab() {
  const { role } = useAuth();
  if (role === 'landlord') return <LandlordPost />;
  return <TenantSaved />;
}
