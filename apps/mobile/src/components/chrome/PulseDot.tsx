import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { colors } from "../../theme/tokens";

type PulseDotProps = {
  tone?: "gold" | "mint" | "ember";
};

export function PulseDot({ tone = "mint" }: PulseDotProps) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.92,
            duration: 1200,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.72,
            duration: 1500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.ring,
          { borderColor: toneMap[tone], opacity, transform: [{ scale }] },
        ]}
      />
      <View style={[styles.dot, { backgroundColor: toneMap[tone] }]} />
    </View>
  );
}

const toneMap = {
  gold: colors.gold,
  mint: colors.mint,
  ember: colors.ember,
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    height: 14,
    justifyContent: "center",
    width: 14,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
});
