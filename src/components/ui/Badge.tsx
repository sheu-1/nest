import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Text } from './Typography';

interface Props {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<Props> = ({ label, variant = 'primary', style }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'danger':
        return { bg: '#FFEBEE', text: '#C62828' };
      case 'warning':
        return { bg: '#FFF3E0', text: '#EF6C00' };

      case 'info':
        return { bg: '#E3F2FD', text: '#1565C0' };
      case 'neutral':
        return { bg: COLORS.border, text: COLORS.secondaryText };
      default:
        return { bg: COLORS.accent, text: COLORS.brand };
    }
  };

  const colors = getVariantStyles();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text variant="small" bold color={colors.text}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
});
