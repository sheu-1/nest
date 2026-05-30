import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const SCREEN = Dimensions.get('window');
const MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Text } from '../ui/Typography';
import { Button } from '../ui/Button';
import { useVideoPlayer, VideoView } from 'expo-video';

export const isVideoUri = (uri: string) => {
  if (!uri) return false;
  const cleanUri = uri.toLowerCase();
  return cleanUri.endsWith('.mp4') ||
    cleanUri.endsWith('.mov') ||
    cleanUri.endsWith('.m4v') ||
    cleanUri.endsWith('.3gp') ||
    cleanUri.endsWith('.avi') ||
    cleanUri.includes('video');
};

const VideoItem = ({ uri, style }: { uri: string; style: any }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.pause();
  });

  return (
    <VideoView
      style={style}
      player={player}
      allowsFullscreen
      nativeControls
      contentFit="cover"
    />
  );
};

interface Props {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const PostListingForm: React.FC<Props> = ({ onClose, onSubmit, initialData }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: '',
    type: 'Apartment',
    beds: '',
    baths: '',
    phone: '',
    description: '',
    amenities: [] as string[],
    images: [] as string[],
    category: '',
    coords: {
      latitude: -1.2921,
      longitude: 36.8219,
    }
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        location: initialData.location || '',
        price: initialData.price?.toString() || '',
        type: initialData.property_type || initialData.type || 'Apartment',
        beds: initialData.beds?.toString() || '',
        baths: initialData.baths?.toString() || '',
        phone: initialData.phone || '',
        description: initialData.description || '',
        amenities: initialData.amenities || [],
        images: initialData.images || [],
        category: initialData.category || '',
        coords: initialData.latitude ? { latitude: initialData.latitude, longitude: initialData.longitude } : { latitude: -1.2921, longitude: 36.8219 }
      });
    }
  }, [initialData]);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const autocompleteTimer = useRef<any>(null);

  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActivePreviewIndex(viewableItems[0].index || 0);
    }
  }).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // ── Google Places Autocomplete ────────────────────────────────
  const fetchPlaceSuggestions = async (text: string) => {
    if (!MAPS_API_KEY || text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsFetchingSuggestions(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${MAPS_API_KEY}&components=country:ke&language=en`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.predictions) {
        setSuggestions(json.predictions.map((p: any) => ({ description: p.description, placeId: p.place_id })));
        setShowSuggestions(true);
      }
    } catch (e) {
      console.warn('Autocomplete fetch error:', e);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  // ── Fetch place coords from placeId ──────────────────────────
  const fetchPlaceCoords = async (placeId: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${MAPS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const loc = json.result?.geometry?.location;
      if (loc) return { lat: loc.lat, lng: loc.lng };
    } catch (e) {
      console.warn('Place details error:', e);
    }
    return null;
  };

  // ── Google Reverse Geocoding ──────────────────────────────────
  const getReverseGeocode = async (lat: number, lng: number): Promise<string> => {
    if (MAPS_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}&language=en`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          return json.results[0].formatted_address;
        }
      } catch (e) {
        console.warn('Google reverse geocode error:', e);
      }
    }
    // Fallback to expo-location
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const res = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (res && res.length > 0) {
          const loc = res[0];
          const parts = [loc.name || loc.street, loc.subregion || loc.city || loc.region].filter(Boolean);
          return parts.join(', ');
        }
      }
    } catch (e) {
      console.warn('Expo reverse geocode error:', e);
    }
    return '';
  };

  const handleLocationChange = (text: string) => {
    handleInputChange('location', text);
    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    if (text.trim().length > 1) {
      autocompleteTimer.current = setTimeout(() => fetchPlaceSuggestions(text), 350);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (item: { description: string; placeId: string }) => {
    handleInputChange('location', item.description);
    setShowSuggestions(false);
    setSuggestions([]);
    const coords = await fetchPlaceCoords(item.placeId);
    if (coords) {
      setFormData(prev => ({
        ...prev,
        location: item.description,
        coords: { latitude: coords.lat, longitude: coords.lng },
      }));
    }
  };

  const handleMapTap = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setIsReverseGeocoding(true);
    setFormData(prev => ({
      ...prev,
      coords: { latitude, longitude },
      location: 'Locating…',
    }));
    const name = await getReverseGeocode(latitude, longitude);
    setFormData(prev => ({
      ...prev,
      coords: { latitude, longitude },
      location: name || prev.location,
    }));
    setIsReverseGeocoding(false);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // handleMapTap is defined above near handleSelectSuggestion

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const amenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities };
    });
  };

  const pickImages = async () => {
    if (formData.images.length >= 10) {
      Alert.alert('Limit Reached', 'You can upload up to 10 items.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery to upload media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - formData.images.length,
      videoMaxDuration: 60,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => {
        if (asset.type === 'video' && asset.duration && asset.duration > 60 * 1000) {
          Alert.alert(
            'Video Too Long',
            `"${asset.fileName || 'Selected video'}" exceeds the 1-minute limit. Please choose a shorter video.`
          );
          return null;
        }
        return asset.uri;
      }).filter(Boolean) as string[];

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newMedia].slice(0, 10)
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.progressStep}>
          <View
            style={[
              styles.progressCircle,
              step >= s && styles.progressCircleActive,
              step > s && styles.progressCircleCompleted
            ]}
          >
            {step > s ? (
              <Ionicons name="checkmark" size={14} color={COLORS.white} />
            ) : (
              <Text
                variant="small"
                bold
                style={{
                  color: step >= s ? COLORS.white : 'rgba(255, 255, 255, 0.4)',
                  fontSize: 12
                }}
              >
                {s}
              </Text>
            )}
          </View>
          {s < 3 && (
            <View
              style={[
                styles.progressLine,
                step > s && styles.progressLineActive
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderFormButtons = () => (
    <View style={styles.formButtonsRow}>
      {step > 1 && (
        <TouchableOpacity
          style={styles.backBtnMinimal}
          onPress={prevStep}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} style={{ marginRight: 6 }} />
          <Text variant="body" bold>Back</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.continueBtnMinimal}
        onPress={step === 3 ? () => onSubmit(formData) : nextStep}
      >
        <Text variant="body" bold color={COLORS.white}>
          {step === 3 ? (initialData ? "🚀 Update Listing" : "🚀 Post Listing") : "Continue"}
        </Text>
        {step < 3 && <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 6 }} />}
      </TouchableOpacity>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.formCard}>
      <Text variant="h2" style={{ marginBottom: SPACING.md, color: COLORS.brand }}>Basic Information</Text>

      <InputLabel label="Property Title" />
      <TextInput
        style={styles.input}
        placeholder="e.g. Modern Sunset Apartment"
        placeholderTextColor="#999"
        value={formData.title}
        onChangeText={(v) => handleInputChange('title', v)}
      />

      <InputLabel label="Location" />
      <View style={{ zIndex: 999 }}>
        <View style={styles.locationInputRow}>
          <Ionicons name="search-outline" size={16} color={COLORS.secondaryText} style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.locationInput}
            placeholder="Search any location…"
            placeholderTextColor="#999"
            value={formData.location}
            onChangeText={handleLocationChange}
          />
          {isFetchingSuggestions && (
            <ActivityIndicator size="small" color={COLORS.brand} style={{ marginRight: 12 }} />
          )}
        </View>
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionRow}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons name="location-outline" size={16} color={COLORS.brand} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, color: COLORS.secondaryText, flex: 1 }} numberOfLines={2}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ── Inline Map Picker ── */}
      <View style={[styles.mapPickerContainer, { height: isMapExpanded ? 420 : 200 }]}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.mapPicker}
          region={{
            latitude: formData.coords.latitude,
            longitude: formData.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          onPress={handleMapTap}
          onRegionChangeComplete={(region) => {
            setFormData(prev => ({
              ...prev,
              coords: { latitude: region.latitude, longitude: region.longitude },
            }));
          }}
        >
          <Marker
            coordinate={formData.coords}
            pinColor={COLORS.brand}
          />
        </MapView>

        {/* Expand / Collapse button */}
        <TouchableOpacity
          style={styles.mapExpandBtn}
          onPress={() => setIsMapExpanded(v => !v)}
        >
          <Ionicons name={isMapExpanded ? 'contract-outline' : 'expand-outline'} size={18} color={COLORS.white} />
          <Text style={{ color: COLORS.white, fontSize: 11, marginLeft: 4, fontWeight: '600' }}>
            {isMapExpanded ? 'Collapse' : 'Expand Map'}
          </Text>
        </TouchableOpacity>

        {/* Reverse geocoding spinner */}
        {isReverseGeocoding && (
          <View style={styles.mapGeocodingOverlay}>
            <ActivityIndicator size="small" color={COLORS.brand} />
            <Text style={{ color: COLORS.white, fontSize: 12, marginLeft: 8 }}>Detecting location…</Text>
          </View>
        )}

        <View style={styles.mapPickerOverlay}>
          <Ionicons name="locate-outline" size={14} color={COLORS.brand} style={{ marginRight: 4 }} />
          <Text variant="small" color={COLORS.brand} bold>Tap the map to pin a location</Text>
        </View>
      </View>

      <View style={[styles.row, { zIndex: 100, marginTop: SPACING.md }]}>
        <View style={{ flex: 1, marginRight: SPACING.md }}>
          <InputLabel label="Rent (KSh / month)" />
          <TextInput
            style={styles.input}
            placeholder="e.g. 85000"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(v) => handleInputChange('price', v)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputLabel label="Property Type" />
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            onPress={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            <Text style={{ color: COLORS.text }}>{formData.type}</Text>
            <Ionicons name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={18} color={COLORS.brand} />
          </TouchableOpacity>

          {showTypeDropdown && (
            <View style={styles.dropdownContainer}>
              {['Apartment', 'House', 'Studio', 'Villa', 'Bedsitter'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleInputChange('type', type);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={{
                    color: formData.type === type ? COLORS.brand : COLORS.text,
                    fontWeight: formData.type === type ? 'bold' : 'normal',
                    fontSize: 14
                  }}>
                    {type}
                  </Text>
                  {formData.type === type && (
                    <Ionicons name="checkmark" size={16} color={COLORS.brand} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {formData.type === 'Apartment' && (
        <View style={{ marginTop: SPACING.md }}>
          <InputLabel label="Apartment Category" />
          <View style={styles.amenitiesContainer}>
            {['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', 'Penthouse'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.amenityChip,
                  formData.category === cat && styles.amenityChipActive
                ]}
                onPress={() => handleInputChange('category', cat)}
              >
                <Text
                  variant="small"
                  bold
                  color={formData.category === cat ? COLORS.brand : COLORS.secondaryText}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {renderFormButtons()}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formCard}>
      <Text variant="h2" style={{ marginBottom: SPACING.md, color: COLORS.brand }}>Property Details</Text>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: SPACING.md }}>
          <InputLabel label="Bedrooms" />
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={formData.beds}
            onChangeText={(v) => handleInputChange('beds', v)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputLabel label="Bathrooms" />
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={formData.baths}
            onChangeText={(v) => handleInputChange('baths', v)}
          />
        </View>
      </View>

      <InputLabel label="Contact Phone Number (WhatsApp connect)" />
      <TextInput
        style={styles.input}
        placeholder="e.g. +254712345678"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(v) => handleInputChange('phone', v)}
      />

      <InputLabel label="Description" />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your property details..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        value={formData.description}
        onChangeText={(v) => handleInputChange('description', v)}
      />

      <InputLabel label="Images & Videos (Max 10, Videos max 1m)" />
      <View style={styles.imageGrid}>
        {formData.images.map((uri, index) => {
          const isVideo = isVideoUri(uri);
          return (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.thumbnail} />
              {isVideo && (
                <View style={styles.videoBadgeOverlay}>
                  <Ionicons name="play-circle" size={24} color={COLORS.white} />
                </View>
              )}
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.brand} />
              </TouchableOpacity>
            </View>
          );
        })}
        {formData.images.length < 10 && (
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImages}>
            <Ionicons name="camera-outline" size={32} color={COLORS.secondaryText} />
            <Text variant="caption" color={COLORS.secondaryText}>
              {formData.images.length}/10
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <InputLabel label="Amenities" />
      <View style={styles.amenitiesContainer}>
        {['WiFi', 'Parking', 'Gym', 'Pool', 'Security', 'Water 24/7', 'Generator', 'Garden', 'Furnished'].map((amenity) => (
          <TouchableOpacity
            key={amenity}
            style={[
              styles.amenityChip,
              formData.amenities.includes(amenity) && styles.amenityChipActive
            ]}
            onPress={() => toggleAmenity(amenity)}
          >
            <Text
              variant="small"
              bold
              color={formData.amenities.includes(amenity) ? COLORS.brand : COLORS.secondaryText}
            >
              {amenity}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {renderFormButtons()}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formCard}>
      <Text variant="h2" style={{ marginBottom: SPACING.md, color: COLORS.brand }}>Preview Listing</Text>

      <View style={styles.previewCard}>
        {formData.images.length > 0 ? (
          <View>
            <FlatList
              data={formData.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => {
                const isVideo = isVideoUri(item);
                if (isVideo) {
                  return <VideoItem uri={item} style={styles.previewImage} />;
                }
                return <Image source={{ uri: item }} style={styles.previewImage} />;
              }}
              style={{ height: 200 }}
            />
            {formData.images.length > 1 && (
              <View style={styles.paginationContainer}>
                {formData.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === activePreviewIndex && styles.paginationDotActive
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.previewImagePlaceholder}>
            <Ionicons name="image-outline" size={48} color={COLORS.border} />
            <Text color={COLORS.secondaryText}>No image uploaded</Text>
          </View>
        )}
        <View style={{ padding: SPACING.md }}>
          <Text variant="h3">{formData.title || 'Property Title'}</Text>
          <Text color={COLORS.secondaryText}>{formData.location || 'Location'}</Text>
          <Text variant="h2" color={COLORS.brand} style={{ marginTop: SPACING.sm }}>
            KSh {Number(formData.price).toLocaleString() || '0'}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text variant="body" bold style={{ color: COLORS.brand }}>Ready to post?</Text>
        <Text variant="caption" style={{ marginTop: SPACING.xs, color: COLORS.secondaryText }}>
          Your listing will be visible to all tenants instantly. You can edit or remove it later from your profile.
        </Text>
      </View>
      {renderFormButtons()}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProgress()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const InputLabel = ({ label }: { label: string }) => (
  <Text variant="small" bold style={{ marginBottom: SPACING.xs, marginTop: SPACING.md }}>
    {label}
  </Text>
);

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressCircleActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  progressCircleCompleted: {
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
    borderColor: '#4CAF50',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  progressLineActive: {
    backgroundColor: COLORS.brand,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.sm, // Shrinked padding to maximize card width on screen!
    paddingVertical: SPACING.md,
    backgroundColor: 'transparent',
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  stepContainer: {
    flex: 1,
  },
  input: {
    height: 48,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: SPACING.sm,
    color: '#FFF',
    fontSize: 14,
  },
  mapPickerContainer: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  mapPicker: {
    flex: 1,
  },
  mapExpandBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24,14,9,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  mapGeocodingOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24,14,9,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  mapPickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(24, 14, 9, 0.85)',
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  imageWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  videoBadgeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  amenityChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amenityChipActive: {
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(255, 111, 0, 0.15)',
  },
  previewCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  previewImage: {
    width: 360,
    height: 200,
  },
  previewImagePlaceholder: {
    height: 200,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: 'rgba(0,102,255,0.05)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,102,255,0.1)',
    marginBottom: SPACING.xl,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  formButtonsRow: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  backBtnMinimal: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnMinimal: {
    flex: 2,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    maxHeight: 180,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});
