import React from 'react';
import { 
  View, 
  StyleSheet, 
  ImageBackground, 
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { storage } from '../src/utils/storage';
import { Text } from '../src/components/ui/Typography';


import { Button } from '../src/components/ui/Button';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export default function IndexScreen() {
  return null;
}
