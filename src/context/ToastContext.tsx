import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, SafeAreaView } from 'react-native';
import { Text } from '../components/ui/Typography';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'warning'>('success');
  const [visible, setVisible] = useState(false);
  const opacity = useState(new Animated.Value(0))[0];

  const showToast = useCallback((msg: string, t: 'success' | 'error' | 'warning' = 'success') => {
    setMessage(msg);
    setType(t);
    setVisible(true);

    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <SafeAreaView style={styles.container} pointerEvents="none">
          <Animated.View style={[
            styles.toast,
            { opacity, backgroundColor: type === 'success' ? '#2E7D32' : type === 'warning' ? '#F57C00' : '#C62828' }
          ]}>
            <Ionicons 
              name={type === 'success' ? 'checkmark-circle' : type === 'warning' ? 'warning' : 'alert-circle'} 
              size={20} 
              color={COLORS.white} 
            />
            <Text color={COLORS.white} bold style={{ marginLeft: SPACING.sm }}>
              {message}
            </Text>
          </Animated.View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
