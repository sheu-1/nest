import React, { createContext, useContext, useRef } from 'react';
import { Animated } from 'react-native';

interface TabVisibilityContextProps {
  translateY: Animated.Value;
  hideTabBar: () => void;
  showTabBar: () => void;
}

const TabVisibilityContext = createContext<TabVisibilityContextProps>({
  translateY: new Animated.Value(0),
  hideTabBar: () => {},
  showTabBar: () => {},
});

export const TabVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  const hideTabBar = () => {
    Animated.timing(translateY, {
      toValue: 120, // Slide down past screen bottom!
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const showTabBar = () => {
    Animated.timing(translateY, {
      toValue: 0, // Slide back up smoothly!
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TabVisibilityContext.Provider value={{ translateY, hideTabBar, showTabBar }}>
      {children}
    </TabVisibilityContext.Provider>
  );
};

export const useTabVisibility = () => useContext(TabVisibilityContext);
