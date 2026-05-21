import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  StyleSheet, 
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Text } from './Typography';

interface Props extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<Props> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  style,
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
      default:
        return styles.primary;
    }
  };

  const getLabelColor = () => {
    if (disabled) return COLORS.secondaryText;
    switch (variant) {
      case 'outline':
      case 'ghost':
        return COLORS.brand;
      case 'secondary':
        return COLORS.text;
      default:
        return COLORS.white;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[size],
        getVariantStyles(),
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >

      {loading ? (
        <ActivityIndicator color={getLabelColor()} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            variant={size === 'sm' ? 'small' : 'body'}
            bold
            color={getLabelColor()}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  primary: {
    backgroundColor: COLORS.brand,
  },
  secondary: {
    backgroundColor: COLORS.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sm: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    height: 36,
  },
  md: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    height: 48,
  },
  lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    height: 56,
  },
  disabled: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
});
