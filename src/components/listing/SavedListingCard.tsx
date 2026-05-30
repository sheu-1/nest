import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '../../types';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Text } from '../ui/Typography';
import { formatFriendlyLocation } from './ListingCard';

interface Props {
  listing: Listing;
  onPress: (listing: Listing) => void;
  onToggleSave?: (id: string) => void;
}

export const SavedListingCard: React.FC<Props> = ({ listing, onPress, onToggleSave }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.7} 
      onPress={() => onPress(listing)}
    >
      <Image 
        source={{ uri: listing.images[0] || 'https://via.placeholder.com/150' }} 
        style={styles.image} 
      />
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text variant="body" bold numberOfLines={1} style={styles.title}>
            {listing.title}
          </Text>
          <TouchableOpacity 
            onPress={() => onToggleSave?.(listing.id)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="heart" size={22} color="#FF3040" />
          </TouchableOpacity>
        </View>

        <Text variant="small" style={styles.location} numberOfLines={1}>
          📍 {formatFriendlyLocation(listing.location)}
        </Text>

        <Text variant="body" bold style={styles.price}>
          KSh {listing.price.toLocaleString()} / mo
        </Text>

        <Text variant="small" style={styles.specs}>
          {listing.beds} beds • {listing.baths} baths
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    marginRight: SPACING.sm,
    color: COLORS.text,
    fontSize: 15,
  },
  location: {
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  price: {
    color: COLORS.text,
    marginTop: 4,
  },
  specs: {
    color: COLORS.secondaryText,
    marginTop: 4,
  },
});
