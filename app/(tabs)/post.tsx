import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../src/components/ui/Typography';
import { COLORS } from '../../src/constants/theme';
import { PostListingForm } from '../../src/components/forms/PostListingForm';

export default function PostScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <PostListingForm 
        onSubmit={async () => {}} 
        onClose={() => {}} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  }
});
