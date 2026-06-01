import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Text } from '../ui/Typography';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const { width } = Dimensions.get('window');

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
  const colors = ['#C8511B', '#7a480d', '#7a480d', '#D84315', '#E65100', '#7a480d'];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: number;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  listingId,
  listingTitle,
  listingImage,
  listingPrice,
  recipientId,
  recipientName,
  recipientAvatar,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Animated values for the "Message Sent" drop-down notification banner
  const notificationAnim = useRef(new Animated.Value(-100)).current;
  const flatListRef = useRef<FlatList>(null);

  // 1. Fetch or Create Conversation
  useEffect(() => {
    if (!visible || !user || !recipientId || !listingId) return;

    const initChat = async () => {
      setIsLoading(true);
      try {
        // Query if conversation already exists between this tenant, landlord, and listing
        const { data: existing, error: fetchErr } = await supabase
          .from('conversations')
          .select('id')
          .eq('listing_id', listingId)
          .or(`and(tenant_id.eq.${user.id},landlord_id.eq.${recipientId}),and(tenant_id.eq.${recipientId},landlord_id.eq.${user.id})`)
          .single();

        if (existing?.id) {
          setConversationId(existing.id);
          await loadMessages(existing.id);
        } else {
          // If no existing conversation, create a new one!
          const isLandlord = user.user_metadata?.role === 'landlord';
          const tenantId = isLandlord ? recipientId : user.id;
          const landlordId = isLandlord ? user.id : recipientId;

          const { data: created, error: createErr } = await supabase
            .from('conversations')
            .insert({
              tenant_id: tenantId,
              landlord_id: landlordId,
              listing_id: listingId,
              last_message: 'Conversation started',
            })
            .select('id')
            .single();

          if (createErr) throw createErr;
          if (created?.id) {
            setConversationId(created.id);
            setMessages([]);
          }
        }
      } catch (err: any) {
        console.error('Chat init error:', err);
        Alert.alert('Error', 'Could not initialize chat.');
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [visible, listingId, recipientId, user]);

  // 2. Real-time Message Subscription via Supabase
  useEffect(() => {
    if (!conversationId) return;

    // Realtime channel to listen for messages in this specific conversation
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Avoid duplicate messages
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Scroll to end
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // 3. Load Message History
  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    } catch (err: any) {
      console.warn('Failed to load message history:', err.message);
    }
  };

  // 4. Send Message Function
  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !conversationId) return;

    const messageText = inputText.trim();
    setInputText('');

    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      text: messageText,
      created_at: new Date().toISOString(),
    };

    // Optimistically update state
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // Trigger local "Message Sent" drop-down notification banner animation
    triggerSentNotification();

    try {
      // 1. Insert message into messages table
      const { error: msgErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          text: messageText,
        });

      if (msgErr) throw msgErr;

      // 2. Update conversations table last_message and timestamp
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

    } catch (err: any) {
      console.error('Supabase message send failed:', err.message);
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  // Trigger "Message Sent" elegant micro-notification banner
  const triggerSentNotification = () => {
    Animated.sequence([
      Animated.timing(notificationAnim, {
        toValue: 24,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(notificationAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        
        {/* Elegant "Message Sent" Top Notification Banner */}
        <Animated.View style={[
          styles.notificationBanner,
          { transform: [{ translateY: notificationAnim }] }
        ]}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
          <Text variant="small" bold color={COLORS.white} style={{ marginLeft: 6 }}>
            Message Sent Successfully
          </Text>
        </Animated.View>

        {/* Modal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <View style={styles.recipientInfo}>
            <View style={[styles.avatarCircle, { backgroundColor: getAvatarBgColor(recipientName) }]}>
              <Text style={styles.avatarInitials}>{getInitials(recipientName)}</Text>
            </View>
            <View>
              <Text variant="body" bold>{recipientName}</Text>
              <Text variant="caption" color={COLORS.secondaryText}>Online</Text>
            </View>
          </View>
        </View>

        {/* Mini Property Summary Header Card */}
        <View style={styles.propertySummary}>
          <Image source={{ uri: listingImage }} style={styles.propertyThumb} />
          <View style={{ flex: 1 }}>
            <Text variant="body" bold numberOfLines={1}>{listingTitle}</Text>
            <Text variant="small" bold style={{ color: COLORS.brand }}>
              KSh {listingPrice.toLocaleString()}/mo
            </Text>
          </View>
          <View style={styles.propertyBadge}>
            <Text variant="small" bold style={{ color: COLORS.brand, fontSize: 10 }}>Inquiry</Text>
          </View>
        </View>

        {/* Messages Body */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text variant="body" color={COLORS.secondaryText} style={{ marginTop: SPACING.md }}>
              Connecting securely...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isMe = item.sender_id === user?.id; // Correct watertight alignment check
              return (
                <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
                  <View style={[
                    styles.messageBubble,
                    isMe ? styles.bubbleMe : styles.bubbleThem
                  ]}>
                    {/* Sent: Dark Chocolate on Orange | Received: White on Accent Chocolate */}
                    <Text variant="body" style={{ color: isMe ? '#0a0501' : '#FFFFFF', lineHeight: 20 }}>
                      {item.text}
                    </Text>
                    <Text style={[
                      styles.timestamp,
                      { color: isMe ? 'rgba(24, 14, 9, 0.6)' : 'rgba(255,255,255,0.6)' }
                    ]}>
                      {formatTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Chat Footer Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.footer}>
            <TextInput
              style={[styles.input, { maxHeight: 80 }]}
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              placeholderTextColor={COLORS.secondaryText}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons name="paper-plane" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notificationBanner: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: '#43A047', // Gorgeous high-end green!
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    shadowColor: '#43A047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999, // Floating on very top!
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border, // Dark chocolate border!
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 4,
    marginRight: SPACING.md,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: SPACING.sm,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
  propertySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card, // Deep dark chocolate!
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  propertyThumb: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
  },
  propertyBadge: {
    backgroundColor: 'rgba(255, 111, 0, 0.15)', // Dark translucent orange badge!
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'stretch',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: COLORS.brand, // Neon Glowing brand orange!
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: COLORS.accent, // Sleek accent chocolate bubble background!
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timestamp: {
    fontSize: 9,
    textAlign: 'right',
    marginTop: 4,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card, // Deep dark chocolate input footer!
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand, // Brand orange!
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});
