import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  Dimensions,
  Platform,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '../../types';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Text } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatFriendlyLocation } from './ListingCard';
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

const { height, width } = Dimensions.get('window');


interface Props {
  listing: Listing | null;
  visible: boolean;
  onClose: () => void;
  onToggleSave?: (id: string) => void;
  onOpenChat?: (listingId: string) => void;
}

export const ListingDetailModal: React.FC<Props> = ({ 
  listing, 
  visible, 
  onClose, 
  onToggleSave,
  onOpenChat
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [activeIndex, setActiveIndex] = useState(0);
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // ── Directions state ────────────────────────────────────────
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [startCoords, setStartCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  // Uber-style: track the centre of the map as the pin position
  const [isDragging, setIsDragging] = useState(false);
  const dirMapRef = useRef<MapView>(null);

  // Compute destination coordinates dynamically from the listing
  const parseCoordinates = (listing: Listing | null) => {
    if (listing?.latitude && listing?.longitude) {
      return { latitude: Number(listing.latitude), longitude: Number(listing.longitude) };
    }
    // Simple hash‑based fallback (same as MapScreen) using the location string
    const hash = (listing?.location ?? '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    return {
      latitude: -1.2921 + (hash % 100) / 1000,
      longitude: 36.8219 + (hash % 80) / 1000,
    };
  };
  const { latitude: destLat, longitude: destLng } = parseCoordinates(listing);

  const getUserLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to get directions from your current location.');
        setIsFetchingLocation(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setStartCoords(coords);
      // Smoothly animate the map to the GPS position
      dirMapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        600,
      );
    } catch (e) {
      Alert.alert('Error', 'Could not retrieve your location.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const launchGoogleMapsDirections = (fromLat: number, fromLng: number) => {
    const destination = (listing?.latitude && listing?.longitude)
      ? `${listing.latitude},${listing.longitude}`
      : encodeURIComponent(listing?.location || `${destLat},${destLng}`);
      
    const url = `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${destination}&travelmode=driving`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Google Maps.'));
  };

  const handleOpenDirections = () => {
    setShowDirectionsModal(true);
    getUserLocation();
  };

  // Fallback mock reviews
  const mockReviews = [
    { id: 'mock-1', tenant_name: 'John Doe', rating: 5, comment: 'Excellent landlord! Very responsive and maintains the property perfectly.', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'mock-2', tenant_name: 'Sarah Smith', rating: 4, comment: 'Good experience living here. Highly recommend this property.', created_at: new Date(Date.now() - 86400000 * 12).toISOString() }
  ];

  const loadReviews = useCallback(async () => {
    if (!listing) return;
    setIsLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('landlord_reviews')
        .select('*')
        .eq('landlord_id', listing.landlordId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Reviews table fetch error, using mocks:', error.message);
        setReviews(mockReviews);
      } else if (data && data.length > 0) {
        setReviews(data);
      } else {
        setReviews(mockReviews);
      }
    } catch (e) {
      setReviews(mockReviews);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [listing]);

  useEffect(() => {
    if (visible && listing) {
      loadReviews();
    }
  }, [visible, listing, loadReviews]);

  const handleSubmitReview = async () => {
    if (!listing) return;
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to leave a review.');
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert('Review Required', 'Please write a comment for your review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tenantName = user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Anonymous';
      const { error } = await supabase
        .from('landlord_reviews')
        .insert({
          tenant_id: user.id,
          tenant_name: tenantName,
          landlord_id: listing.landlordId,
          rating: userRating,
          comment: reviewComment.trim(),
        });

      if (error) {
        console.warn('Failed to insert in Supabase, updating locally:', error.message);
        const newReview = {
          id: `local-${Date.now()}`,
          tenant_name: tenantName,
          rating: userRating,
          comment: reviewComment.trim(),
          created_at: new Date().toISOString()
        };
        setReviews(prev => [newReview, ...prev]);
        setReviewComment('');
        Alert.alert('Success', 'Review submitted successfully!');
      } else {
        setReviewComment('');
        Alert.alert('Success', 'Review posted successfully!');
        loadReviews();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDirections = handleOpenDirections;

  const handleShare = async () => {
    if (!listing) return;
    try {
      const link = require('expo-linking').createURL(`listing/${listing.id}`);
      await Share.share({
        message: `Check out this property on Nest: ${listing.title} - ${listing.price.toLocaleString()} Ksh/mo\nLocation: ${formatFriendlyLocation(listing.location)}\n\nLink: ${link}`,
      });
    } catch (error) {
      console.error('Error sharing', error);
    }
  };

  const handleWhatsAppConnect = () => {
    if (!listing) return;
    let rawPhone = listing.phone || (listing.landlord as any)?.phone || '0700000000';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '254' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 9) {
      cleanPhone = '254' + cleanPhone;
    } else if (!cleanPhone.startsWith('254')) {
      cleanPhone = '254' + cleanPhone;
    }
    if (cleanPhone === '254') cleanPhone = '254700000000';
    
    const message = `Hi, I'm interested in your property: ${listing.title}`;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    require('expo-linking').openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed or cannot be opened.');
    });
  };

  if (!listing) return null;

  // Calculate dynamic rating and count
  const totalRatingsCount = reviews.length;
  const averageRating = totalRatingsCount > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalRatingsCount).toFixed(1)
    : listing.landlord.rating;

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <View>
              <FlatList
                data={listing.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => {
                  const isVideo = isVideoUri(item);
                  if (isVideo) {
                    return <VideoItem uri={item} style={styles.carouselImage} />;
                  }
                  return <Image source={{ uri: item }} style={styles.carouselImage} />;
                }}
                ListEmptyComponent={() => (
                  <Image 
                    source={{ uri: 'https://via.placeholder.com/400x300?text=No+Image' }} 
                    style={styles.carouselImage} 
                  />
                )}
              />
              {listing.images && listing.images.length > 1 && (
                <View style={styles.paginationContainer}>
                  {listing.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === activeIndex && styles.paginationDotActive
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
            <SafeAreaView style={styles.overlay} pointerEvents="box-none">

              <View style={styles.headerButtons}>
                <TouchableOpacity style={styles.circleButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <TouchableOpacity style={styles.circleButton} onPress={handleShare}>
                    <Ionicons name="share-outline" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.circleButton} 
                    onPress={() => onToggleSave?.(listing.id)}
                  >
                    <Ionicons 
                      name={listing.isSaved ? "heart" : "heart-outline"} 
                      size={24} 
                      color={listing.isSaved ? COLORS.brand : COLORS.text} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </View>

          <View style={styles.content}>
            <View style={styles.badgeRow}>
              <Badge label={listing.type} variant="info" />
              {listing.isVerified && <Badge label="Verified" variant="success" />}
              <Badge label={listing.status} variant="warning" />
            </View>

            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text variant="h1">{listing.title}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.secondaryText} />
                  <Text variant="body" color={COLORS.secondaryText} style={{ marginLeft: 4 }}>
                    {formatFriendlyLocation(listing.location)}
                  </Text>
                </View>
              </View>
              <Text variant="h1" color={COLORS.brand}>
                KSh {listing.price.toLocaleString()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text variant="h2" style={{ marginBottom: SPACING.sm }}>Description</Text>
              <Text variant="body" color={COLORS.secondaryText} style={{ lineHeight: 24 }}>
                {listing.description}
              </Text>
            </View>

            <View style={styles.section}>
              <Text variant="h2" style={{ marginBottom: SPACING.md }}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {listing.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityItem}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.brand} />
                    <Text variant="body" style={{ marginLeft: SPACING.sm }}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <DetailStat icon="bed-outline" value={listing.beds.toString()} label="Beds" />
              <View style={styles.verticalDivider} />
              <DetailStat icon="water-outline" value={listing.baths.toString()} label="Baths" />
              <View style={styles.verticalDivider} />
              <DetailStat icon="resize-outline" value={listing.sqft.toLocaleString()} label="Sqft" />
            </View>

            <View style={styles.divider} />

             <View style={styles.section}>
              <Text variant="h2" style={{ marginBottom: SPACING.md }}>Location</Text>
              <TouchableOpacity activeOpacity={0.9} onPress={openDirections} style={styles.mapContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.miniMap}
                  initialRegion={{
                    latitude: listing.latitude ?? (-1.2921 + (listing.id.length % 10) / 1000),
                    longitude: listing.longitude ?? (36.8219 + (listing.id.length % 8) / 1000),
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker 
                    coordinate={{
                      latitude: listing.latitude ?? (-1.2921 + (listing.id.length % 10) / 1000),
                      longitude: listing.longitude ?? (36.8219 + (listing.id.length % 8) / 1000),
                    }}
                    pinColor={COLORS.brand}
                  />
                </MapView>
                <View style={styles.mapOverlay}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="navigate-circle-outline" size={18} color={COLORS.brand} />
                    <Text variant="body" bold>{formatFriendlyLocation(listing.location)} (Tap for directions)</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>


            <View style={styles.landlordCard}>
              <Image source={{ uri: listing.landlord.avatar }} style={styles.landlordAvatar} />
              <View style={{ flex: 1 }}>
                <Text variant="h3">{listing.landlord.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text variant="small" bold style={{ marginLeft: 4 }}>
                    {averageRating}
                  </Text>
                  <Text variant="small" color={COLORS.secondaryText} style={{ marginLeft: 4 }}>
                    ({totalRatingsCount} {totalRatingsCount === 1 ? 'review' : 'reviews'})
                  </Text>
                </View>
                {listing.phone ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="call" size={12} color={COLORS.secondaryText} />
                    <Text variant="small" color={COLORS.secondaryText}>{listing.phone}</Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => onOpenChat?.(listing.id)}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.brand} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.whatsappButtonInline}
              onPress={handleWhatsAppConnect}
            >
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text variant="body" bold color={COLORS.white}>Contact on WhatsApp</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center', marginTop: SPACING.sm }}>
              <Text variant="small" color={COLORS.secondaryText}>
                Phone: {listing.phone || (listing.landlord as any)?.phone || 'Number not provided'}
              </Text>
            </View>

            {/* Landlord Reviews & Ratings Section */}
            <View style={{ marginTop: SPACING.lg, paddingBottom: SPACING.md }}>
              <Text variant="h2" style={{ marginBottom: SPACING.md }}>Landlord Reviews 💬</Text>
              
              {/* Add review form */}
              {user?.user_metadata?.role !== 'landlord' && (
                <View style={styles.addReviewBox}>
                  <Text variant="body" bold style={{ marginBottom: SPACING.xs }}>Leave a Review</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.sm }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                        <Ionicons 
                          name={star <= userRating ? "star" : "star-outline"} 
                          size={28} 
                          color="#FFD700" 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Tell others about your experience with this landlord..."
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity 
                    style={styles.submitReviewBtn} 
                    onPress={handleSubmitReview}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={COLORS.background} />
                    ) : (
                      <Text variant="body" bold color={COLORS.background}>Submit Review</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Reviews List */}
              {isLoadingReviews ? (
                <ActivityIndicator size="small" color={COLORS.brand} style={{ marginVertical: SPACING.md }} />
              ) : (
                <View style={{ marginTop: SPACING.md, gap: SPACING.md }}>
                  {reviews.map((rev) => (
                    <View key={rev.id} style={styles.reviewCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="body" bold>{rev.tenant_name ?? 'Anonymous Tenant'}</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons 
                              key={star} 
                              name="star" 
                              size={12} 
                              color={star <= rev.rating ? "#FFD700" : COLORS.border} 
                            />
                          ))}
                        </View>
                      </View>
                      <Text variant="caption" color={COLORS.secondaryText} style={{ marginTop: 2 }}>
                        {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>
                      {rev.comment ? (
                        <Text variant="body" color={COLORS.text} style={{ marginTop: SPACING.xs, lineHeight: 20 }}>
                          {rev.comment}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                  {reviews.length === 0 && (
                    <Text variant="body" color={COLORS.secondaryText} style={{ fontStyle: 'italic', textAlign: 'center', marginVertical: SPACING.md }}>
                      No reviews yet. Be the first to rate!
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>

    {/* ── Directions Picker Modal ── */}
    <Modal
      visible={showDirectionsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDirectionsModal(false)}
    >
      <View style={styles.dirModal}>
        {/* Header */}
        <View style={styles.dirHeader}>
          <Text variant="h2" bold style={{ color: COLORS.brand }}>Get Directions</Text>
          <TouchableOpacity onPress={() => setShowDirectionsModal(false)} style={styles.dirCloseBtn}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={styles.dirInfoCard}>
          <Ionicons name="flag" size={16} color={COLORS.brand} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text variant="small" bold style={{ color: COLORS.brand }}>Destination</Text>
            <Text variant="small" color={COLORS.secondaryText} numberOfLines={2}>
              {listing?.title} — {formatFriendlyLocation(listing?.location ?? '')}
            </Text>
          </View>
        </View>

        {/* Map to select starting point — Uber-style draggable centre pin */}
        <Text variant="small" bold style={{ color: COLORS.secondaryText, paddingHorizontal: SPACING.md, marginTop: SPACING.md, marginBottom: 6 }}>
          Drag the map to place your start pin
        </Text>
        <View style={styles.dirMapContainer}>
          <MapView
            ref={dirMapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: startCoords?.latitude ?? destLat,
              longitude: startCoords?.longitude ?? destLng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            onRegionChange={() => setIsDragging(true)}
            onRegionChangeComplete={(region) => {
              setIsDragging(false);
              setStartCoords({ latitude: region.latitude, longitude: region.longitude });
            }}
          >
            {/* Destination pin (fixed) */}
            <Marker
              coordinate={{ latitude: destLat, longitude: destLng }}
              title={listing?.title}
              pinColor={COLORS.brand}
            />
          </MapView>

          {/* ── Uber-style centre pin overlay ── */}
          <View style={styles.centrePinWrapper} pointerEvents="none">
            {/* Shadow dot on the ground */}
            <View style={[
              styles.centrePinShadow,
              isDragging && { transform: [{ scaleX: 1.4 }, { scaleY: 0.6 }], opacity: 0.25 },
            ]} />
            {/* The pin itself floats up when dragging */}
            <View style={[
              styles.centrePinBody,
              isDragging && { transform: [{ translateY: -8 }] },
            ]}>
              <Ionicons name="navigate" size={22} color={COLORS.white} />
            </View>
            <View style={styles.centrePinTail} />
          </View>

          {/* Destination legend */}
          <View style={styles.dirMapLegend}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.brand }]} />
              <Text style={{ color: COLORS.white, fontSize: 11, marginLeft: 6 }}>Destination</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.legendDot, { backgroundColor: '#0066FF' }]} />
              <Text style={{ color: COLORS.white, fontSize: 11, marginLeft: 6 }}>Your start (centre pin)</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.dirActions}>
          <TouchableOpacity
            style={[styles.dirBtn, { backgroundColor: 'rgba(0,102,255,0.12)', borderColor: '#0066FF', flex: 1 }]}
            onPress={getUserLocation}
            disabled={isFetchingLocation}
          >
            {isFetchingLocation ? (
              <ActivityIndicator size="small" color="#0066FF" />
            ) : (
              <Ionicons name="locate" size={18} color="#0066FF" />
            )}
            <Text style={{ color: '#0066FF', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
              {isFetchingLocation ? 'Locating...' : 'Use My Location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dirBtn,
              { backgroundColor: COLORS.brand, flex: 1 },
              !startCoords && { opacity: 0.5 },
            ]}
            onPress={() => {
              if (!startCoords) return;
              setShowDirectionsModal(false);
              launchGoogleMapsDirections(startCoords.latitude, startCoords.longitude);
            }}
            disabled={!startCoords}
          >
            <Ionicons name="navigate" size={18} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
};


const DetailStat = ({ icon, value, label }: { icon: any, value: string, label: string }) => (
  <View style={styles.detailStat}>
    <Ionicons name={icon} size={24} color={COLORS.text} />
    <Text variant="h3" style={{ marginTop: 4 }}>{value}</Text>
    <Text variant="small">{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  imageContainer: {
    height: 300,
    width: width,
    backgroundColor: COLORS.border,
  },
  carouselImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 30, // Above the curved card
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
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    marginTop: -RADIUS.lg,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  detailStat: {
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  mapContainer: {
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniMap: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(36, 21, 14, 0.9)',
    padding: SPACING.sm,
    alignItems: 'center',
  },
  // Directions modal styles
  dirModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  dirHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dirCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dirInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dirMapContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  // Uber-style centre pin
  centrePinWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centrePinBody: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 2,
  },
  centrePinTail: {
    width: 3,
    height: 10,
    backgroundColor: '#0066FF',
    borderRadius: 2,
  },
  centrePinShadow: {
    position: 'absolute',
    bottom: '47%',
    width: 20,
    height: 7,
    borderRadius: 10,
    backgroundColor: '#000',
    opacity: 0.18,
  },
  dirMapLegend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(24,14,9,0.85)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dirActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  dirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  landlordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  landlordAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappButtonInline: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addReviewBox: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: SPACING.sm,
  },
  submitReviewBtn: {
    backgroundColor: COLORS.brand,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
