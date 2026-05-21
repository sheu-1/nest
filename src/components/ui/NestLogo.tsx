import React from 'react';
import Svg, { Rect, Path, Ellipse, Text } from 'react-native-svg';

interface NestLogoProps {
  width?: number;
  textColor?: string;
}

export default function NestLogo({ width = 320, textColor = '#FFFFFF' }: NestLogoProps) {
  const height = Math.round((88 / 320) * width);

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 320 88"
      aria-label="Nest"
      role="img"
    >
      {/* Icon box */}
      <Rect x="0" y="0" width="88" height="88" rx="20" fill="#3B1F14" />

      {/* Nest arc */}
      <Path
        d="M 24 52 Q 44 20 44 20 Q 64 20 84 52"
        fill="none"
        stroke="#E8622A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Nest base */}
      <Path
        d="M 18 60 Q 44 70 70 60"
        fill="none"
        stroke="#E8622A"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Eggs */}
      <Ellipse cx="34" cy="48" rx="8" ry="6" fill="#f5ede6" />
      <Ellipse cx="44" cy="44" rx="8" ry="6" fill="#fff8f4" />
      <Ellipse cx="54" cy="48" rx="8" ry="6" fill="#f5ede6" />

      {/* Wordmark */}
      <Text
        x="104"
        y="62"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="52"
        fontWeight="500"
        letterSpacing="-1"
        fill={textColor}
      >
        nest
      </Text>
    </Svg>
  );
}
