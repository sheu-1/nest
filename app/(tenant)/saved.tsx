import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { Listing } from '../../src/types';
import { Text } from '../../src/components/ui/Typography';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { ListingDetailModal } from '../../src/components/listing/ListingDetailModal';
import { storage } from '../../src/utils/storage';
import { supabase } from '../../src/lib/supabase';
import { useToast } from '../../src/context/ToastContext';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

export default function TenantSavedScreen() {
  const { showToast } = useToast();
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedIds = await storage.getSavedIds();
      if (savedIds.length === 0) { setSavedListings([]); return; }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('id', savedIds);

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
        isSaved: true,
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
      }));

      setSavedListings(mapped);
    } catch (err: any) {
      showToast('Failed to load saved listings', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadSaved(); }, [loadSaved]));

  const handleToggleSave = async (id: string) => {
    try {
      await storage.toggleSaveId(id);
      // Remove from state list immediately
      setSavedListings(prev => prev.filter(item => item.id !== id));
      if (selected && selected.id === id) {
        setSelected(null);
      }
      showToast('Property removed from saved!', 'success');
    } catch (e) {
      showToast('Failed to save property', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm }}>
          <Text variant="h1" bold style={{ textAlign: 'center' }}>Saved ❤️</Text>
          <View style={styles.countBadge}>
            <Text variant="small" bold color={COLORS.white}>{savedListings.length}</Text>
          </View>
        </View>
      </View>

      <FlatList<Listing>
        data={savedListings}
        keyExtractor={item => item.id}
        numColumns={isTablet ? 2 : 1}
        contentContainerStyle={styles.list}
        onRefresh={loadSaved}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <ListingCard 
            listing={item} 
            onPress={() => setSelected(item)} 
            onToggleSave={handleToggleSave}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={COLORS.border} />
            <Text variant="h3" style={{ marginTop: SPACING.md }}>No saved listings</Text>
            <Text variant="body" color={COLORS.secondaryText} style={{ marginTop: SPACING.sm, textAlign: 'center' }}>
              Browse properties and tap ❤️ to save them here.
            </Text>
          </View>
        }
      />

      {selected && (
        <ListingDetailModal
          listing={selected}
          visible={!!selected}
          onClose={() => setSelected(null)}
          onToggleSave={handleToggleSave}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  countBadge: {
    backgroundColor: '#0066FF',
    borderRadius: RADIUS.full,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
});
