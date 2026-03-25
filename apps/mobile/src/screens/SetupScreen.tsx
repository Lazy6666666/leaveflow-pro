import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "../theme/tokens";

export function SetupScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.kicker}>BALANCE MOBILE</Text>
        <Text style={styles.title}>Mobile shell is ready.</Text>
        <Text style={styles.body}>
          Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CONVEX_URL`
          in `apps/mobile/.env` to switch this package from setup mode into the
          live app shell.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next implementation slice</Text>
          <Text style={styles.cardBody}>
            1. Native Clerk sign-in.
            {"\n"}2. Attendance clock actions on live Convex data.
            {"\n"}3. Camera, location, and offline replay.
          </Text>
        </View>

        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Env gate acknowledged</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: "center",
    gap: spacing.lg,
  },
  kicker: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.4,
  },
  title: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "800",
    lineHeight: 42,
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  cta: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  ctaText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
