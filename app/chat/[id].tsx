import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MOCK_LISTINGS } from '../../src/constants/mockData';
import { ChatBox } from '../../src/components/ChatBox';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Typography';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const listing = MOCK_LISTINGS.find(l => l.id === id);

  if (!listing) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text variant="h3" bold>Inquiry: {listing.title}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ChatBox 
        title={listing.landlord.name}
        subtitle="Active now"
        avatar={listing.landlord.avatar}
        context={`${listing.beds} beds, ${listing.baths} baths, ${listing.sqft} sqft in ${listing.location}`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
