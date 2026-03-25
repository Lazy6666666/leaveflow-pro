import { StyleSheet, View } from "react-native";

import { colors } from "../../theme/tokens";

export function AmbientBackdrop() {
  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={[styles.orb, styles.orbPrimary]} />
      <View style={[styles.orb, styles.orbSecondary]} />
      <View style={[styles.orb, styles.orbAccent]} />
      <View style={styles.topGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbPrimary: {
    backgroundColor: "rgba(199, 161, 94, 0.12)",
    height: 240,
    right: -48,
    top: 28,
    width: 240,
  },
  orbSecondary: {
    backgroundColor: "rgba(143, 212, 194, 0.10)",
    height: 220,
    left: -54,
    top: 220,
    width: 220,
  },
  orbAccent: {
    backgroundColor: "rgba(242, 157, 127, 0.08)",
    bottom: 130,
    height: 180,
    right: 36,
    width: 180,
  },
  topGlow: {
    position: "absolute",
    left: 24,
    right: 24,
    top: 0,
    height: 1,
    backgroundColor: colors.borderStrong,
    opacity: 0.8,
  },
});
