import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../src/components/ui/Typography';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { PostListingForm } from '../../src/components/forms/PostListingForm';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useToast } from '../../src/context/ToastContext';

export default function LandlordPostScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [formKey, setFormKey] = useState(0); // reset form after success
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleSubmit = async (data: any) => {
    if (!user) { Alert.alert('Error', 'Not signed in'); return; }

    setIsUploading(true);
    setUploadProgress('Preparing upload...');

    try {
      const uploadedUrls: string[] = [];
      const mediaFiles = data.images ?? [];

      for (let i = 0; i < mediaFiles.length; i++) {
        const uri = mediaFiles[i];
        
        // If it's already a remote url, just add it
        if (uri.startsWith('http')) {
          uploadedUrls.push(uri);
          continue;
        }

        setUploadProgress(`Uploading media ${i + 1} of ${mediaFiles.length}...`);

        // Read uri as a blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // Extract extension
        const fileExt = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
        const isVideo = ['mp4', 'mov', 'm4v', '3gp', 'avi'].includes(fileExt) || uri.toLowerCase().includes('video');
        const contentType = isVideo ? `video/${fileExt}` : `image/${fileExt}`;
        
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to supabase storage bucket
        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(fileName, blob, {
            contentType,
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase upload error details:', uploadError);
          throw new Error(`Media upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setUploadProgress('Saving listing details...');

      const { error } = await supabase.from('listings').insert({
        landlord_id: user.id,
        landlord_name: user.user_metadata?.name ?? user.email,
        title: data.title,
        location: data.location,
        price: Number(data.price),
        property_type: data.type,
        type: data.type,
        beds: Number(data.beds) || 0,
        baths: Number(data.baths) || 0,
        sqft: 0,
        description: data.description,
        images: uploadedUrls,
        emoji: '🏠',
        amenities: data.amenities ?? [],
        available: true,
        status: 'Available',
        phone: data.phone,
      });

      if (error) throw error;

      showToast('Listing posted successfully!', 'success');
      setFormKey(k => k + 1); // reset the form
    } catch (err: any) {
      console.error('Submit error:', err);
      Alert.alert('Error', err.message ?? 'Failed to post listing');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" bold style={{ color: COLORS.brand }}>Post a Listing 🏠</Text>
        <Text variant="small" color={COLORS.secondaryText} style={{ marginTop: 2 }}>
          Fill in the details about your property
        </Text>
      </View>
      <PostListingForm
        key={formKey}
        onClose={() => {}}
        onSubmit={handleSubmit}
      />

      {isUploading && (
        <Modal transparent animationType="fade" visible={isUploading}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.brand} />
              <Text variant="h3" style={{ marginTop: SPACING.md }}>Posting Listing...</Text>
              <Text variant="body" color={COLORS.secondaryText} style={{ marginTop: SPACING.xs, textAlign: 'center' }}>
                {uploadProgress}
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: COLORS.card,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
});
