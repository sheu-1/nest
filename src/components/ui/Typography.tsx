import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { TYPOGRAPHY, COLORS } from '../../constants/theme';

interface Props extends TextProps {
  variant?: keyof typeof TYPOGRAPHY;
  color?: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
}

export const Text: React.FC<Props> = ({ 
  variant = 'body', 
  color, 
  align = 'left', 
  bold, 
  style, 
  children, 
  ...props 
}) => {
  const getFontFamily = () => {
    if (bold) return 'Inter_700Bold';
    return TYPOGRAPHY[variant].fontFamily;
  };

  return (
    <RNText
      style={[
        TYPOGRAPHY[variant],
        { textAlign: align, fontFamily: getFontFamily() },
        color ? { color } : {},
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

