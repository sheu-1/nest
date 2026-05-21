export const COLORS = {
  brand: '#FF6F00',      // Highly intense, vibrant premium amber-orange!
  text: '#FF6F00',       // Glowing orange text
  background: '#180E09', // Deep dark chocolate espresso background
  card: '#180E09',       // Cards and containers now fully match the chocolate background
  accent: '#2D1A11',     // Medium dark chocolate accent
  border: '#341E13',     // Dark chocolate borders
  secondaryText: '#FFFFFF', // Pure white for perfect readable body texts and description words!
  white: '#FFFFFF',      // White helper colors match pure white!
  verified: '#FF6F00',   // Verification badges match the glowing brand orange
  error: '#FF5252',      // Error red
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.brand, // Premium brand orange header text
    fontFamily: 'Inter_700Bold',
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.brand, // Premium brand orange header text
    fontFamily: 'Inter_700Bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.brand, // Premium brand orange header text
    fontFamily: 'Inter_600SemiBold',
  },
  body: {
    fontSize: 16,
    color: COLORS.secondaryText, // White body text for absolute maximum contrast!
    fontFamily: 'Inter_400Regular',
  },
  caption: {
    fontSize: 14,
    color: COLORS.secondaryText, // White captions
    fontFamily: 'Inter_400Regular',
  },
  small: {
    fontSize: 12,
    color: COLORS.secondaryText, // White small meta tags
    fontFamily: 'Inter_400Regular',
  },
};

