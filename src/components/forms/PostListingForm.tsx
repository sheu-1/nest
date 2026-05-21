import React, { useState } from 'react';
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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
}

export const PostListingForm: React.FC<Props> = ({ onClose, onSubmit }) => {
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
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const NAIROBI_SUBURBS = [
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
    { name: "Parklands, Nairobi", lat: -1.2612, lng: 36.8190 },
    { name: "Bedsitter hub, Nairobi", lat: -1.2921, lng: 36.8219 }
  ];

  const getSuburbsNearCoords = (lat: number, lng: number) => {
    let closest = NAIROBI_SUBURBS[0];
    let minDist = Infinity;
    for (const sub of NAIROBI_SUBURBS) {
      const dist = Math.pow(sub.lat - lat, 2) + Math.pow(sub.lng - lng, 2);
      if (dist < minDist) {
        minDist = dist;
        closest = sub;
      }
    }
    return closest.name;
  };

  const handleLocationChange = (text: string) => {
    handleInputChange('location', text);
    if (text.trim().length > 1) {
      const filtered = NAIROBI_SUBURBS.filter(sub => 
        sub.name.toLowerCase().includes(text.toLowerCase())
      ).map(sub => sub.name);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (name: string) => {
    const matched = NAIROBI_SUBURBS.find(sub => sub.name === name);
    if (matched) {
      setFormData(prev => ({
        ...prev,
        location: name,
        coords: { latitude: matched.lat, longitude: matched.lng }
      }));
    }
    setShowSuggestions(false);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const resolvedName = getSuburbsNearCoords(latitude, longitude);
    setFormData(prev => ({
      ...prev,
      coords: { latitude, longitude },
      location: resolvedName
    }));
  };

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
          {step === 3 ? "🚀 Post Listing" : "Continue"}
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

      <InputLabel label="Location (Nairobi Suburb)" />
      <View style={{ zIndex: 999 }}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Westlands, Nairobi"
          placeholderTextColor="#999"
          value={formData.location}
          onChangeText={handleLocationChange}
        />
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionRow}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons name="location-outline" size={16} color={COLORS.secondaryText} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, color: COLORS.text }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.mapPickerContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.mapPicker}
          initialRegion={{
            latitude: formData.coords.latitude,
            longitude: formData.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          onRegionChangeComplete={(region) => {
            const resolvedName = getSuburbsNearCoords(region.latitude, region.longitude);
            setFormData(prev => ({
              ...prev,
              coords: { latitude: region.latitude, longitude: region.longitude },
              location: resolvedName
            }));
          }}
        />
        {/* Center fixed pin like Uber/Bolt */}
        <View style={styles.centerMarkerContainer} pointerEvents="none">
          <View style={styles.markerShadow} />
          <Ionicons name="location" size={38} color={COLORS.brand} style={styles.centerMarkerIcon} />
        </View>
        <View style={styles.mapPickerOverlay}>
          <Text variant="small" color={COLORS.brand} bold>📍 Drag map to choose location</Text>
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
          <FlatList
            data={formData.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const isVideo = isVideoUri(item);
              if (isVideo) {
                return <VideoItem uri={item} style={styles.previewImage} />;
              }
              return <Image source={{ uri: item }} style={styles.previewImage} />;
            }}
            style={{ height: 200 }}
          />
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
  mapPickerContainer: {
    height: 180,
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
  centerMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -19,
    marginTop: -38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMarkerIcon: {
    transform: [{ translateY: -4 }],
  },
  markerShadow: {
    width: 10,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    position: 'absolute',
    bottom: -2,
  },
  mapPickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(24, 14, 9, 0.85)',
    paddingVertical: 6,
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 111, 0, 0.15)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 0, 0.3)',
    marginBottom: SPACING.md,
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
