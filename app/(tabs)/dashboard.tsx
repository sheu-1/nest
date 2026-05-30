import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { Listing } from '../../src/types';
import { Text } from '../../src/components/ui/Typography';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useToast } from '../../src/context/ToastContext';
import { useTabVisibility } from '../../src/context/TabVisibilityContext';
import NestLogo from '../../src/components/ui/NestLogo';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const StatDoughnut = ({ 
  value, 
  label, 
  color, 
  percentage = 100 
}: { 
  value: number | string; 
  label: string; 
  color: string; 
  percentage?: number; 
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [percentage]);

  const size = 76;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={statStyles.doughnutWrapper}>
      <View style={statStyles.circleContainer}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={StyleSheet.absoluteFillObject}>
          <View style={statStyles.innerValueContainer}>
            <Text variant="body" bold style={{ color: color, fontSize: 18 }}>
              {value}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="small" bold color={COLORS.secondaryText} style={statStyles.label}>
        {label}
      </Text>
    </View>
  );
};

const statStyles = StyleSheet.create({
  doughnutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 104,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  circleContainer: {
    width: 76,
    height: 76,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerValueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 8,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

// ─── Listing Row Card ─────────────────────────────────────────
const ListingRow = ({
  item,
  onToggle,
  onDelete,
  onEdit,
}: {
  item: Listing;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) => {
  const isAvailable = item.available !== false && item.status !== 'Taken';

  return (
    <View style={rowStyles.card}>
      <View style={rowStyles.topRow}>
        <View style={{ flex: 1, marginRight: SPACING.sm }}>
          <Text variant="body" bold numberOfLines={1}>{item.title}</Text>
          <View style={rowStyles.locationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.secondaryText} style={{ opacity: 0.7 }} />
            <Text variant="small" color={COLORS.secondaryText} numberOfLines={1} style={{ marginLeft: 2, opacity: 0.7 }}>
              {item.location}
            </Text>
          </View>
          <Text variant="body" bold style={{ color: COLORS.brand, marginTop: 2 }}>
            KSh {Number(item.price).toLocaleString()}/mo
          </Text>
        </View>
        <View>
          <View style={[rowStyles.badge, isAvailable ? rowStyles.badgeAvail : rowStyles.badgeTaken]}>
            <Ionicons
              name={isAvailable ? 'checkmark-circle' : 'lock-closed'}
              size={12}
              color={isAvailable ? '#4CAF50' : '#FF5252'}
            />
            <Text variant="small" bold style={{ color: isAvailable ? '#4CAF50' : '#FF5252', marginLeft: 3 }}>
              {isAvailable ? 'Available' : 'Taken'}
            </Text>
          </View>
        </View>
      </View>

      <View style={rowStyles.actions}>
        <TouchableOpacity style={rowStyles.actionBtn} onPress={onToggle}>
          <Ionicons
            name={isAvailable ? 'lock-closed-outline' : 'checkmark-circle-outline'}
            size={15}
            color={COLORS.brand}
          />
          <Text variant="small" bold style={{ color: COLORS.brand, marginLeft: 4 }}>
            {isAvailable ? 'Mark Taken' : 'Mark Available'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={rowStyles.actionBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={15} color={COLORS.brand} />
          <Text variant="small" bold style={{ color: COLORS.brand, marginLeft: 4 }}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[rowStyles.actionBtn, rowStyles.deleteBtn]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={15} color="#FF5252" />
          <Text variant="small" bold style={{ color: '#FF5252', marginLeft: 4 }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const rowStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeAvail: { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
  badgeTaken: { backgroundColor: 'rgba(255, 82, 82, 0.15)' },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 111, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 0, 0.2)',
  },
  deleteBtn: { 
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderColor: 'rgba(255, 82, 82, 0.2)',
  },
});

// ─── Main Dashboard ──────────────────────────────────────────
export default function LandlordDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(90); // Dynamic height to prevent sticky overlaps!
  const { hideTabBar, showTabBar } = useTabVisibility();
  const lastScrollY = React.useRef(0);

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > lastScrollY.current ? 'down' : 'up';

    if (Math.abs(currentOffset - lastScrollY.current) > 15) {
      if (direction === 'down' && currentOffset > 80) {
        hideTabBar();
      } else if (direction === 'up' || currentOffset <= 20) {
        showTabBar();
      }
    }
    lastScrollY.current = currentOffset;
  };

  const loadListings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map snake_case DB fields to camelCase Listing type
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
        isSaved: false,
        amenities: d.amenities ?? [],
        landlord: { id: d.landlord_id, name: d.landlord_name ?? 'You', avatar: '', rating: 0 },
        postedAt: d.created_at,
        status: d.available ? 'Available' : 'Taken',
        available: d.available ?? true,
        landlordId: d.landlord_id,
      }));
      setListings(mapped);
    } catch (err: any) {
      showToast(err.message ?? 'Failed to load listings', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { loadListings(); }, [loadListings]));

  const handleToggle = async (listing: Listing) => {
    const newAvailable = !listing.available;
    try {
      const { error } = await supabase
        .from('listings')
        .update({ available: newAvailable })
        .eq('id', listing.id);
      if (error) throw error;
      showToast(`Marked as ${newAvailable ? 'Available' : 'Taken'}`, 'success');
      loadListings();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = (listing: Listing) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${listing.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('listings').delete().eq('id', listing.id);
              if (error) throw error;
              showToast('Listing deleted', 'success');
              loadListings();
            } catch (err: any) {
              showToast(err.message, 'error');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (listing: Listing) => {
    router.push({ pathname: '/(landlord-tabs)/post', params: { editId: listing.id } });
  };

  const totalListings = listings.length;
  const activeCount = listings.filter(l => l.available !== false && l.status !== 'Taken').length;
  const takenCount = totalListings - activeCount;
  const views = totalListings * 5;
  const inquiries = totalListings * 2;

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
        <View>
          <NestLogo width={120} textColor="#C8511B" />
          <Text variant="caption" color={COLORS.secondaryText} style={{ marginTop: 6 }}>
            My Dashboard ({user?.user_metadata?.name ?? user?.email})
          </Text>
        </View>
        <View style={styles.roleTag}>
          <Ionicons name="home" size={13} color={COLORS.brand} />
          <Text variant="small" bold style={{ color: COLORS.brand, marginLeft: 3 }}>Landlord</Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Dynamic spacer offset to avoid sticky header overlap! */}
        <View style={{ height: headerHeight + 16 }} />

        {/* Stats row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.doughnutsScrollContainer}
          style={styles.doughnutsScrollView}
        >
          <StatDoughnut 
            value={totalListings} 
            label="Total Listings" 
            color={COLORS.brand} 
            percentage={100} 
          />
          <StatDoughnut 
            value={activeCount} 
            label="Active Listings" 
            color="#2E7D32" 
            percentage={totalListings > 0 ? (activeCount / totalListings) * 100 : 100} 
          />
          <StatDoughnut 
            value={takenCount} 
            label="Taken Properties" 
            color="#C62828" 
            percentage={totalListings > 0 ? (takenCount / totalListings) * 100 : 0} 
          />
          <StatDoughnut 
            value={views} 
            label="Total Views" 
            color="#0066FF" 
            percentage={Math.min(100, Math.max(10, totalListings > 0 ? 80 : 0))} 
          />
        </ScrollView>

        {/* Listings */}
        <View style={styles.listingsSection}>
          <Text variant="h3" bold style={styles.sectionTitle}>My Listings</Text>

          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={COLORS.brand} size="large" />
              <Text variant="body" color={COLORS.secondaryText} style={{ marginTop: SPACING.md }}>
                Loading listings...
              </Text>
            </View>
          ) : listings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="home-outline" size={64} color={COLORS.border} />
              <Text variant="h3" style={{ marginTop: SPACING.md }}>No listings yet</Text>
              <Text variant="body" color={COLORS.secondaryText} style={{ marginTop: SPACING.sm, textAlign: 'center' }}>
                Tap the Post tab to add your first property listing.
              </Text>
            </View>
          ) : (
            listings.map(item => (
              <ListingRow
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item)}
                onDelete={() => handleDelete(item)}
                onEdit={() => handleEdit(item)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Keep sticky permanently!
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 111, 0, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 0, 0.3)',
  },
  doughnutsScrollView: {
    marginBottom: SPACING.lg,
    width: '100%',
  },
  doughnutsScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  listingsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100, // Safe clearance padding for the elegant floating transparent tab bar!
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
});
