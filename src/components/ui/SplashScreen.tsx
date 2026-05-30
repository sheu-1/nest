import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import NestLogo from './NestLogo';
import { Text } from './Typography';

const { width, height } = Dimensions.get('window');

function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animate(dot1, 0);
    const anim2 = animate(dot2, 150);
    const anim3 = animate(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1, transform: [{ scale: dot1 }] }]} />
      <Animated.View style={[styles.dot, { opacity: dot2, transform: [{ scale: dot2 }] }]} />
      <Animated.View style={[styles.dot, { opacity: dot3, transform: [{ scale: dot3 }] }]} />
    </View>
  );
}

export default function SplashScreen() {
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1.0,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Split background underlay */}
      <View style={styles.backgroundSplit}>
        <View style={styles.splitLeft} />
        <View style={styles.splitRight} />
      </View>

      {/* Content wrapper */}
      <Animated.View style={[styles.content, { opacity: containerOpacity }]}>
        <Animated.View style={{ transform: [{ scale: logoScale }], alignItems: 'center' }}>
          <NestLogo width={120} textColor="#FFFFFF" showText={false} />
          <Text style={styles.tagline}>Find Your Perfect Home</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundSplit: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  splitLeft: {
    flex: 1,
    backgroundColor: '#C8511B', // Brand orange
  },
  splitRight: {
    flex: 1,
    backgroundColor: '#7a480d', // Chocolate brown
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '300',
    marginTop: 20,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  footer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});
