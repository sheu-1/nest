import React, { useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Animated,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '../../types';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Text } from '../ui/Typography';

const { width } = Dimensions.get('window');

export const formatFriendlyLocation = (locationStr: string) => {
  if (!locationStr) return "Nairobi";
  
  const coordRegex = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
  if (coordRegex.test(locationStr.trim())) {
    const [latStr, lngStr] = locationStr.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    
    const suburbs = [
      { name: "Westlands, Nairobi", lat: -1.2682, lng: 36.8081 },
      { name: "Kilimani, Nairobi", lat: -1.2901, lng: 36.7829 },
      { name: "Kileleshwa, Nairobi", lat: -1.2789, lng: 36.7915 },
      { name: "Lavington, Nairobi", lat: -1.2882, lng: 36.7681 },
      { name: "Karen, Nairobi", lat: -1.3200, lng: 36.7024 },
      { name: "South B, Nairobi", lat: -1.3117, lng: 36.8374 },
      { name: "South C, Nairobi", lat: -1.3217, lng: 36.8274 },
      { name: "Lang'ata, Nairobi", lat: -1.3324, lng: 36.8024 },
      { name: "Runda, Nairobi", lat: -1.2182, lng: 36.8081 },
      { name: "Gigiri, Nairobi", lat: -1.2382, lng: 36.8281 },
      { name: "Syokimau, Nairobi", lat: -1.3482, lng: 36.9281 },
      { name: "Ngong Road, Nairobi", lat: -1.3000, lng: 36.7600 },
      { name: "Parklands, Nairobi", lat: -1.2612, lng: 36.8190 }
    ];
    
    let closest = suburbs[0];
    let minDist = Infinity;
    for (const sub of suburbs) {
      const dist = Math.pow(sub.lat - lat, 2) + Math.pow(sub.lng - lng, 2);
      if (dist < minDist) {
        minDist = dist;
        closest = sub;
      }
    }
    return closest.name;
  }
  return locationStr;
};

interface Props {
  listing: Listing;
  onPress: (listing: Listing) => void;
  onToggleSave?: (id: string) => void;
  onLongPress?: (listing: Listing) => void;
}

export const ListingCard: React.FC<Props> = ({ listing, onPress, onToggleSave, onLongPress }) => {
  const [showMap, setShowMap] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.99,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const handleWhatsAppPress = () => {
    let cleanPhone = listing.phone ? listing.phone.trim() : '';
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '+254' + cleanPhone.substring(1);
      } else {
        cleanPhone = '+254' + cleanPhone;
      }
    }
    const message = `Hello, I'm interested in your property "${listing.title}" listed on Nest!`;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`);
      }
    });
  };

  const mockCoords = {
    latitude: -1.2921 + (listing.id.length % 10) / 1000,
    longitude: 36.8219 + (listing.id.length % 8) / 1000,
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      {/* 1. Instagram Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: listing.landlord.avatar }} style={styles.avatar} />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="body" bold style={styles.landlordName}>
                {listing.landlord.name}
              </Text>
              {listing.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={COLORS.brand} style={{ marginLeft: 4 }} />
              )}
            </View>
            <TouchableOpacity onPress={() => setShowMap(!showMap)}>
              <Text variant="small" style={styles.locationGeotag}>
                📍 {formatFriendlyLocation(listing.location)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.emojiBadge}>
            <Text style={{ fontSize: 18 }}>{listing.emoji}</Text>
          </View>
        </View>
      </View>

      {/* 2. Edge-to-Edge Media Post Container */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(listing)}
        onLongPress={() => onLongPress?.(listing)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.imageContainer}
      >
        {showMap ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.image}
            initialRegion={{
              ...mockCoords,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={mockCoords} pinColor={COLORS.brand} />
          </MapView>
        ) : (
          <Image 
            source={{ uri: listing.images[0] || 'https://via.placeholder.com/400x300?text=No+Image' }} 
            style={styles.image} 
          />
        )}
      </TouchableOpacity>

      {/* 3. Action Buttons Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={() => onToggleSave?.(listing.id)}
          >
            <Ionicons 
              name={listing.isSaved ? "heart" : "heart-outline"} 
              size={26} 
              color={listing.isSaved ? "#FF3040" : COLORS.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={handleWhatsAppPress}
          >
            <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={() => setShowMap(!showMap)}
          >
            <Ionicons 
              name={showMap ? "image-outline" : "map-outline"} 
              size={26} 
              color={COLORS.text} 
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.actionIcon}
          onPress={() => onPress(listing)}
        >
          <Ionicons name="bookmark-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* 4. Instagram Caption & Insights */}
      <View style={styles.captionSection}>
        {/* Price display styled as Likes count */}
        <Text variant="body" bold style={{ color: COLORS.text, fontSize: 15 }}>
          KSh {listing.price.toLocaleString()} / month
        </Text>

        {/* Title and description formatted as user name and caption text */}
        <View style={{ marginTop: SPACING.xs }}>
          <Text variant="body" style={{ lineHeight: 20, fontSize: 14 }}>
            <Text bold style={{ color: COLORS.text }}>{listing.title} </Text>
            <Text style={{ color: COLORS.secondaryText }}>
              {listing.description.length > 120 
                ? `${listing.description.substring(0, 120)}...` 
                : listing.description || "Beautiful property located in the heart of Nairobi."}
            </Text>
          </Text>
        </View>

        {/* Beds/Baths specs display styled as Comments meta tag */}
        <TouchableOpacity onPress={() => onPress(listing)} style={{ marginTop: 6 }}>
          <Text variant="small" style={styles.specsComment}>
            View specs details: {listing.beds} beds • {listing.baths} baths • {listing.sqft} sqft
          </Text>
        </TouchableOpacity>

        {/* Posted time */}
        <Text variant="small" style={styles.postTime}>
          {listing.postedAt || "2 days ago"}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: '#FF6F00',
  },
  landlordName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  locationGeotag: {
    fontSize: 12,
    color: COLORS.brand,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 111, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: width, // Perfect 1:1 square media ratio!
    backgroundColor: COLORS.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 4,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionIcon: {
    padding: 4,
  },
  captionSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingTop: 4,
  },
  specsComment: {
    fontSize: 13,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
  postTime: {
    fontSize: 10,
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
