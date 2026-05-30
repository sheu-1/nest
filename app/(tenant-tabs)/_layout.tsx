import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { View, TouchableOpacity, Animated, StyleSheet, Text } from 'react-native';
import { useTabVisibility } from '../../src/context/TabVisibilityContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TenantTabLayout() {
  const { translateY } = useTabVisibility();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => {
        const { state, descriptors, navigation } = props;
        return (
          <Animated.View style={[
            styles.tabBar,
            { 
              transform: [{ translateY }],
              bottom: Math.max(insets.bottom + 8, 16)
            }
          ]}>
            {state.routes.filter(r => ['browse', 'saved', 'messages', 'profile'].includes(r.name)).map((route) => {
              const { options } = descriptors[route.key];
              const label = options.title !== undefined ? options.title : route.name;
              const isFocused = state.routes[state.index].name === route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate({ name: route.name, params: undefined, merge: true });
                }
              };

              let iconName = 'home-outline';
              if (route.name === 'browse') iconName = isFocused ? 'home' : 'home-outline';
              else if (route.name === 'saved') iconName = isFocused ? 'heart' : 'heart-outline';
              else if (route.name === 'messages') iconName = isFocused ? 'chatbubble' : 'chatbubble-outline';
              else if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={styles.tabItem}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={iconName as any} 
                    size={22} 
                    color={isFocused ? COLORS.brand : COLORS.secondaryText} 
                  />
                  <Text style={[
                    styles.tabLabel,
                    { color: isFocused ? COLORS.brand : COLORS.secondaryText }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        );
      }}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="browse" options={{ title: 'Browse' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="map" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(24, 14, 9, 0.96)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 60,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
