import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import { colors, radius } from "../../theme/tokens";

type DoublePanelProps = {
  children: ReactNode;
  shellStyle?: StyleProp<ViewStyle>;
  coreStyle?: StyleProp<ViewStyle>;
};

export function DoublePanel({
  children,
  shellStyle,
  coreStyle,
}: DoublePanelProps) {
  return (
    <View style={[styles.shell, shellStyle]}>
      <View style={[styles.core, coreStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.panelGlass,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
  core: {
    backgroundColor: colors.panelRaised,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 20,
  },
});
