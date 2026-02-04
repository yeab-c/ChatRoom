import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TypingIndicatorProps {
  userName: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.messageReceived, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md }]}>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.textMuted, opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.textMuted, opacity: dot2, marginLeft: 4 }]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.textMuted, opacity: dot3, marginLeft: 4 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginVertical: 4,
    maxWidth: '75%',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});