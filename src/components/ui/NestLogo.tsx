import React from 'react';
import { View, Image, Text, Platform } from 'react-native';

interface NestLogoProps {
  width?: number;
  textColor?: string;
  showText?: boolean;
  centered?: boolean;
}

export default function NestLogo({ width = 320, textColor = '#FFFFFF', showText = true, centered = false }: NestLogoProps) {
  // We keep the original width logic to maintain the exact same sizing as before
  const originalWidth = showText ? 320 : 88;
  const height = Math.round((88 / originalWidth) * width);
  const iconSize = height;

  return (
    <View style={{ width, height, justifyContent: centered ? 'center' : 'flex-start', alignItems: 'center', flexDirection: 'row' }}>
      <Image 
        source={require('../../../assets/icon.png')} 
        style={{ width: iconSize, height: iconSize, borderRadius: iconSize * (20/88) }}
        resizeMode="contain"
      />
    </View>
  );
}
