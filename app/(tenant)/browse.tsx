import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { Listing } from '../../src/types';
import { Text } from '../../src/components/ui/Typography';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { ListingDetailModal } from '../../src/components/listing/ListingDetailModal';
import { ChatModal } from '../../src/components/chat/ChatModal';
import { LoadingSkeleton } from '../../src/components/ui/LoadingSkeleton';
import { useRouter, useNavigation } from 'expo-router';
import { useToast } from '../../src/context/ToastContext';
import { useAuth } from '../../src/context/AuthContext';
import NestLogo from '../../src/components/ui/NestLogo';
import { useTabVisibility } from '../../src/context/TabVisibilityContext';
import { supabase } from '../../src/lib/supabase';
import { storage } from '../../src/utils/storage';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const numColumns = isTablet ? 2 : 1;

const PROPERTY_TYPES = ['All', 'Apartment', 'House', 'Studio', 'Villa', 'Bedsitter'];

export default function TenantBrowseScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [chatListing, setChatListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(90); // Dynamic height to prevent sticky overlaps!

  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const { hideTabBar, showTabBar } = useTabVisibility();
  const lastScrollY = useRef(0);
  const topNavAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > lastScrollY.current ? 'down' : 'up';
    
    // Only trigger toggle after scrolling more than 15px threshold
    if (Math.abs(currentOffset - lastScrollY.current) > 15) {
      if (direction === 'down' && currentOffset > 80) {
        // 1. Smoothly slide bottom tab bar down past the screen bottom
        hideTabBar();
        // 2. Slide the filters row up perfectly behind the sticky header!
        Animated.timing(topNavAnim, {
          toValue: -55, 
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (direction === 'up' || currentOffset <= 20) {
        // 1. Smoothly slide bottom tab bar back up into view
        showTabBar();
        // 2. Slide the filters row back down into view smoothly
        Animated.timing(topNavAnim, {
          toValue: 0, 
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
    lastScrollY.current = currentOffset;
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const savedIds = await storage.getSavedIds();
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Listing[] = (data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        location: d.location,
        price: d.price,
        type: d.type,
        category: d.category,
        beds: d.beds ?? 0,
        baths: d.baths ?? 0,
        sqft: d.sqft ?? 0,
        description: d.description ?? '',
        images: d.images ?? [],
        emoji: d.emoji ?? '🏠',
        isVerified: false,
        isSaved: savedIds.includes(d.id),
        amenities: d.amenities ?? [],
        landlord: {
          id: d.landlord_id,
          name: d.landlord_name ?? 'Owner',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(d.landlord_name ?? 'Owner')}&background=C8511B&color=fff`,
          rating: 4.5,
        },
        postedAt: d.created_at,
        status: d.available !== false ? 'Available' : 'Taken',
        available: d.available ?? true,
        landlordId: d.landlord_id,
        phone: d.phone ?? '',
      }));

      setListings(mapped);
    } catch (err: any) {
      showToast('Failed to load listings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = async (id: string) => {
    try {
      const updatedIds = await storage.toggleSaveId(id);
      const isSaved = updatedIds.includes(id);

      // Update listings in state
      setListings(prev => prev.map(item =>
        item.id === id ? { ...item, isSaved } : item
      ));

      // Update selected listing if open
      if (selectedListing && selectedListing.id === id) {
        setSelectedListing(prev => prev ? { ...prev, isSaved } : null);
      }

      showToast(
        isSaved ? 'Property saved successfully!' : 'Property removed from saved!',
        'success'
      );
    } catch (e) {
      showToast('Failed to save property', 'error');
    }
  };

  const filtered = useMemo(() => {
    let result = listings;
    if (propertyType) result = result.filter(l => l.type === propertyType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q)
      );
    }
    if (locationFilter.trim()) {
      const q = locationFilter.toLowerCase();
      result = result.filter(l => l.location.toLowerCase().includes(q));
    }
    if (minPrice.trim() && !isNaN(Number(minPrice))) {
      result = result.filter(l => l.price >= Number(minPrice));
    }
    if (maxPrice.trim() && !isNaN(Number(maxPrice))) {
      result = result.filter(l => l.price <= Number(maxPrice));
    }
    return result;
  }, [listings, search, propertyType, locationFilter, minPrice, maxPrice]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <NestLogo width={120} textColor="#C8511B" />
        </View>
        <View style={{ padding: SPACING.md, gap: SPACING.md }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ height: 180, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border }}>
              <LoadingSkeleton height={100} borderRadius={RADIUS.md} />
              <LoadingSkeleton width="60%" height={20} />
              <LoadingSkeleton width="40%" height={16} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Sticky Top Header (Always Visible) */}
      <View 
        style={styles.header}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          if (height > 0) setHeaderHeight(height);
        }}
      >
        <NestLogo width={120} textColor="#C8511B" />
        
        <View style={styles.headerRightContainer}>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={{ marginRight: 6 }}>
            <Ionicons name="options-outline" size={22} color={showFilters ? COLORS.brand : COLORS.secondaryText} />
          </TouchableOpacity>

          {/* Minimized Search Box */}
          <View style={styles.headerSearch}>
            <Ionicons name="search-outline" size={14} color={COLORS.secondaryText} style={{ marginRight: 4 }} />
            <TextInput
              style={styles.headerSearchInput}
              placeholder="Search..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.secondaryText}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={14} color={COLORS.secondaryText} />
              </TouchableOpacity>
            )}
          </View>

          {/* Tenant Role Badge */}
          <View style={styles.roleTag}>
            <Ionicons name="home" size={13} color={COLORS.brand} />
            <Text variant="small" bold style={{ color: COLORS.brand, marginLeft: 3 }}>Tenant</Text>
          </View>
        </View>
      </View>

      {/* Dynamic Animated Filters Row (Slides & hides perfectly underneath sticky header) */}
      <Animated.View style={[
        styles.animatedFiltersContainer, 
        { 
          top: headerHeight, // Dynamic, 100% overlap-free placement!
          transform: [{ translateY: topNavAnim }] 
        }
      ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.xs, alignItems: 'center' }}
        >
          {PROPERTY_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, (type === 'All' ? !propertyType : propertyType === type) && styles.chipActive]}
              onPress={() => setPropertyType(type === 'All' ? null : type)}
            >
              <Text
                variant="small"
                bold
                color={(type === 'All' ? !propertyType : propertyType === type) ? COLORS.white : COLORS.secondaryText}
                style={{ fontSize: 12 }}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {showFilters && (
          <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.sm }}>
            <TextInput
              style={styles.filterInput}
              placeholder="Filter by location (e.g. Kilimani)"
              value={locationFilter}
              onChangeText={setLocationFilter}
              placeholderTextColor={COLORS.secondaryText}
            />
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <TextInput
                style={[styles.filterInput, { flex: 1 }]}
                placeholder="Min Price"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholderTextColor={COLORS.secondaryText}
              />
              <TextInput
                style={[styles.filterInput, { flex: 1 }]}
                placeholder="Max Price"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholderTextColor={COLORS.secondaryText}
              />
            </View>
          </View>
        )}
      </Animated.View>

      {/* Listings FlatList */}
      <FlatList<Listing>
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        style={StyleSheet.absoluteFillObject}
        contentContainerStyle={styles.list}
        onRefresh={loadData}
        refreshing={isLoading}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          // Adjusted dynamically to avoid overlapping the first property card
          <View style={{ height: headerHeight + 38 }} />
        )}
        renderItem={({ item }) => (
          <View style={isTablet ? { width: '50%', padding: SPACING.xs } : undefined}>
            <ListingCard
              listing={item}
              onPress={() => setSelectedListing(item)}
              onToggleSave={handleToggleSave}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={64} color={COLORS.border} />
            <Text variant="h3" style={{ marginTop: SPACING.md }}>No listings found</Text>
            <Text variant="body" color={COLORS.secondaryText} style={{ marginTop: SPACING.sm, textAlign: 'center' }}>
              Try adjusting your search or filters.
            </Text>
          </View>
        }
      />

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          visible={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          onToggleSave={handleToggleSave}
          onOpenChat={() => {
            const item = selectedListing;
            setSelectedListing(null);
            setTimeout(() => {
              setChatListing(item);
            }, 400);
          }}
        />
      )}

      {/* Real-time Message Chat Modal */}
      {chatListing && (
        <ChatModal
          visible={!!chatListing}
          onClose={() => setChatListing(null)}
          listingId={chatListing.id}
          listingTitle={chatListing.title}
          listingImage={chatListing.images[0]}
          listingPrice={Number(chatListing.price)}
          recipientId={chatListing.landlord.id}
          recipientName={chatListing.landlord.name}
          recipientAvatar={chatListing.landlord.avatar}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 36, // Restored original padding to avoid physical notches
    paddingBottom: 6,
    backgroundColor: COLORS.background, // Cream backdrop masks the sliding filters!
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Stays sticky permanently!
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.brand,
    letterSpacing: -0.8,
    fontFamily: 'Inter_700Bold',
    lineHeight: 22,
  },
  animatedFiltersContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 90, // Slides under the sticky header
    backgroundColor: COLORS.background,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 6,
    height: 32,
    width: 110, // Perfectly cozy next to roleTag!
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    padding: 0,
  },
  filtersScroll: {
    height: 34,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  chipActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  filterInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 36,
    fontSize: 13,
    color: COLORS.text,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5D0',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FFB780',
  },
  list: {
    paddingHorizontal: 0, // 100% edge-to-edge!
    paddingBottom: 100, // Safe padding for the elegant floating transparent tab bar!
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
});
