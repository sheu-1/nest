import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Typography';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { ChatModal } from '../../src/components/chat/ChatModal';
import { useFocusEffect } from '@react-navigation/native';

interface ConversationThread {
  id: string;
  last_message: string;
  updated_at: string;
  listing: {
    id: string;
    title: string;
    image: string;
    price: number;
  };
  recipient: {
    id: string;
    name: string;
    avatar: string;
  };
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const getAvatarBgColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#C8511B', '#8D6E63', '#8D6E63', '#D84315', '#E65100', '#8D6E63'];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function TenantMessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChat, setActiveChat] = useState<ConversationThread | null>(null);



  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message,
          updated_at,
          tenant_id,
          landlord_id,
          listing:listings (id, title, images, price),
          landlordProfile:profiles!conversations_landlord_id_fkey (id, name, avatar_url)
        `)
        .eq('tenant_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted: ConversationThread[] = data.map((d: any) => ({
          id: d.id,
          last_message: d.last_message || 'Conversation started',
          updated_at: d.updated_at,
          listing: {
            id: d.listing?.id,
            title: d.listing?.title || 'Unknown Property',
            image: d.listing?.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&auto=format&fit=crop&q=80',
            price: Number(d.listing?.price || 0),
          },
          recipient: {
            id: d.landlordProfile?.id || 'landlord',
            name: d.landlordProfile?.name || 'Landlord',
            avatar: d.landlordProfile?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          }
        }));
        setConversations(formatted);
      } else {
        setConversations([]);
      }
    } catch (err: any) {
      console.warn('Conversations fetch failed:', err.message);
      setConversations([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadConversations();
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (_) {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Messages Header */}
      <View style={styles.header}>
        <Text variant="h1" bold style={{ color: COLORS.brand }}>Messages 💬</Text>
        <Text variant="caption" color={COLORS.secondaryText}>
          Enquiries about your dream homes
        </Text>
      </View>

      {/* Conversations Threads List */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.brand} size="large" />
          <Text variant="body" color={COLORS.secondaryText} style={{ marginTop: SPACING.md }}>
            Loading your chats...
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.brand]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.threadCard}
              activeOpacity={0.9}
              onPress={() => setActiveChat(item)}
            >
              <View style={[styles.avatarCircle, { backgroundColor: getAvatarBgColor(item.recipient.name) }]}>
                <Text style={styles.avatarInitials}>{getInitials(item.recipient.name)}</Text>
              </View>
              
              <View style={styles.threadContent}>
                <View style={styles.threadHeader}>
                  <Text variant="body" bold style={{ fontSize: 15 }}>{item.recipient.name}</Text>
                  <Text variant="small" color={COLORS.secondaryText}>
                    {getRelativeTime(item.updated_at)}
                  </Text>
                </View>
                
                <Text variant="caption" color={COLORS.brand} bold style={{ marginTop: 2 }}>
                  🏡 {item.listing.title}
                </Text>
                
                <Text variant="body" color={COLORS.secondaryText} numberOfLines={1} style={styles.lastMessage}>
                  {item.last_message}
                </Text>
              </View>

              <Image source={{ uri: item.listing.image }} style={styles.listingThumb} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={COLORS.border} />
              <Text variant="h3" style={{ marginTop: SPACING.md }}>No Conversations Yet</Text>
              <Text variant="body" color={COLORS.secondaryText} style={{ marginTop: SPACING.sm, textAlign: 'center' }}>
                When you inquire about listings, your messages will appear here.
              </Text>
            </View>
          }
        />
      )}

      {/* Chat Conversation Modal */}
      {activeChat && (
        <ChatModal
          visible={!!activeChat}
          onClose={() => {
            setActiveChat(null);
            loadConversations();
          }}
          listingId={activeChat.listing.id}
          listingTitle={activeChat.listing.title}
          listingImage={activeChat.listing.image}
          listingPrice={activeChat.listing.price}
          recipientId={activeChat.recipient.id}
          recipientName={activeChat.recipient.name}
          recipientAvatar={activeChat.recipient.avatar}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 100, // Account for custom bottom tabs bar pill!
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card, // Set to dark chocolate!
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    marginTop: 4,
    fontSize: 13,
  },
  listingThumb: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    paddingHorizontal: SPACING.xl,
  },
});
