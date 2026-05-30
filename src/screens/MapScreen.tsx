import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput, Dimensions, Alert, ScrollView } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '../types';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Text } from '../components/ui/Typography';

const { width } = Dimensions.get('window');

interface Props {
  listings: Listing[];
  onMarkerPress: (listing: Listing) => void;
  savedIds: string[];
}

const parseCoordinates = (listing: Listing) => {
  if (listing?.latitude && listing?.longitude) {
    return { latitude: Number(listing.latitude), longitude: Number(listing.longitude) };
  }
  const hash = (listing?.location ?? '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
  return {
    latitude: -1.2921 + (hash % 100) / 1000,
    longitude: 36.8219 + (hash % 80) / 1000,
  };
};

export const MapScreen: React.FC<Props> = ({ listings, onMarkerPress, savedIds }) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState({
    latitude: -1.2921,
    longitude: 36.8219,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [searchText, setSearchText] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  const filteredListings = useMemo(() => {
    if (!searchText.trim()) return listings;
    return listings.filter(l =>
      l.title.toLowerCase().includes(searchText.toLowerCase()) ||
      l.location.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, listings]);

  const handleMyLocation = () => {
    if (userLocation) {
      const newRegion = {
        ...userLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      mapRef.current?.animateToRegion(newRegion, 600);
      setRegion(newRegion);
    } else {
      Alert.alert('Location not available', 'Please enable location permissions in your settings.');
    }
  };

  // When a suggestion (listing) is tapped, animate the map to its coordinates
  const handleSuggestionSelect = (listing: Listing) => {
    const coords = parseCoordinates(listing);
    const newRegion = {
      ...coords,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    mapRef.current?.animateToRegion(newRegion, 600);
    setRegion(newRegion);
    setSearchText(''); // clear search bar
  };
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={COLORS.secondaryText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close" size={18} color={COLORS.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Scrollable suggestions list */}
      {searchText.length > 0 && (
        <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="handled">
          {filteredListings.map((listing) => (
            <TouchableOpacity key={listing.id} style={styles.suggestionItem} onPress={() => handleSuggestionSelect(listing)}>
              <Text variant="body" color={COLORS.text}>{listing.title} — {listing.location}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="My Location"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Listing markers */}
        {filteredListings.map(listing => (
          <Marker
            key={listing.id}
            coordinate={parseCoordinates(listing)}
            pinColor={COLORS.brand}
            onPress={() => onMarkerPress(listing)}
          >
            <Callout tooltip onPress={() => onMarkerPress(listing)}>
              <View style={styles.callout}>
                <Text variant="h3" bold>{listing.title}</Text>
                <Text variant="h2" color={COLORS.brand}>KSh {listing.price.toLocaleString()}</Text>
                <Text variant="caption" color={COLORS.secondaryText}>{listing.location}</Text>
                <View style={styles.calloutFooter}>
                  <View style={styles.stat}>
                    <Ionicons name="bed-outline" size={12} color={COLORS.secondaryText} />
                    <Text variant="small" style={{ marginLeft: 4 }}>{listing.beds} Bed</Text>
                  </View>
                  {savedIds.includes(listing.id) && (
                    <Ionicons name="heart" size={14} color={COLORS.brand} />
                  )}
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocation}>
        <Ionicons name="locate" size={24} color={COLORS.brand} />
      </TouchableOpacity>

      {/* Results Count */}
      <View style={styles.resultsBar}>
        <Text variant="small" bold color={COLORS.secondaryText}>
          {filteredListings.length} listings found in this area
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.text,
  },
  map: {
    flex: 1,
  },
  callout: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 102, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0066FF',
    borderWidth: 2,
    borderColor: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 72,
    left: 12,
    right: 12,
    maxHeight: 200,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 5,
    paddingVertical: 4,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 56,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  resultsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
});
