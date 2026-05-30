import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { role } = useAuth();
  const isLandlord = role === 'landlord';
  const accentColor = isLandlord ? COLORS.brand : '#0066FF';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: COLORS.secondaryText,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0EDE8',
          height: 62 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_600SemiBold',
        },
      }}
    >
      {/* ─── Tenant tabs ─────────────────────────────────── */}
      <Tabs.Screen
        name="browse"
        options={{
          title: isLandlord ? 'Dashboard' : 'Browse',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={isLandlord
                ? (focused ? 'bar-chart' : 'bar-chart-outline')
                : (focused ? 'home' : 'home-outline')}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: isLandlord ? 'Post' : 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={isLandlord
                ? (focused ? 'add-circle' : 'add-circle-outline')
                : (focused ? 'heart' : 'heart-outline')}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: isLandlord ? 'Messages' : 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={isLandlord
                ? (focused ? 'chatbubble' : 'chatbubble-outline')
                : (focused ? 'map' : 'map-outline')}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
