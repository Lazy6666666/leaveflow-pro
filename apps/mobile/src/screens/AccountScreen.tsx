import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import appIcon from "../../assets/icon.png";
import { AmbientBackdrop } from "../components/chrome/AmbientBackdrop";
import { DoublePanel } from "../components/chrome/DoublePanel";
import { useEmployeeDashboardData } from "../hooks/useEmployeeDashboardData";
import { useMobileRuntime } from "../providers/useMobileRuntime";
import { colors, radius, spacing } from "../theme/tokens";

export function AccountScreen() {
  const runtime = useMobileRuntime();
  const dashboard = useEmployeeDashboardData();

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackdrop />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screen}>
          <View style={styles.header}>
            <View style={styles.eyebrow}>
              <Text style={styles.eyebrowText}>PROFILE</Text>
            </View>
            <Text style={styles.title}>Identity, leave position, and device readiness.</Text>
          </View>

          <DoublePanel shellStyle={styles.profileShell} coreStyle={styles.profileCore}>
            <View style={styles.profileRow}>
              <Image
                source={appIcon}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.profileCopy}>
                <Text style={styles.name}>{runtime.userLabel || "Employee session"}</Text>
                <Text style={styles.meta}>
                  {runtime.isSignedIn
                    ? "Connected through Clerk and Convex"
                    : "Provider shell active; native sign-in is next"}
                </Text>
              </View>
            </View>

            <View style={styles.runtimeRail}>
              <Text style={styles.runtimeLabel}>Runtime</Text>
              <Text style={styles.runtimeValue}>{runtime.isLoaded ? "Ready" : "Booting"}</Text>
            </View>
          </DoublePanel>

          <DoublePanel shellStyle={styles.leaveShell} coreStyle={styles.leaveCore}>
            <Text style={styles.sectionKicker}>Leave ledger</Text>
            <Text style={styles.sectionTitle}>Current balances</Text>
            {dashboard.leaveBalances.length === 0 ? (
              <Text style={styles.leaveEmpty}>
                No leave balances were returned for the current year.
              </Text>
            ) : (
              dashboard.leaveBalances.slice(0, 3).map((balance) => (
                <View key={String(balance.id)} style={styles.leaveRow}>
                  <View>
                    <Text style={styles.leaveType}>
                      {balance.leave_types?.name ?? "Leave"}
                    </Text>
                    <Text style={styles.leaveMeta}>Available now</Text>
                  </View>
                  <Text style={styles.leaveValue}>{balance.balance} days</Text>
                </View>
              ))
            )}
          </DoublePanel>

          <DoublePanel shellStyle={styles.infoShell} coreStyle={styles.infoCore}>
            <Text style={styles.sectionKicker}>Next implementation slice</Text>
            <Text style={styles.infoBody}>
              Notifications, camera capture, geofence-aware location capture, and local
              offline queue persistence should land next. This account lane is already
              structured to absorb those preferences without becoming an admin surface.
            </Text>
          </DoublePanel>

          <Pressable
            disabled={!runtime.signOut}
            onPress={() => {
              if (runtime.signOut) {
                void runtime.signOut();
              }
            }}
            style={({ pressed }) => [
              styles.signOutShell,
              pressed && styles.signOutPressed,
              !runtime.signOut && styles.signOutDisabled,
            ]}
          >
            <View style={styles.signOutCore}>
              <Text style={styles.signOutText}>
                {runtime.signOut ? "Sign out" : "Sign-out available after native auth"}
              </Text>
              <View style={styles.signOutIsland}>
                <Text style={styles.signOutIslandText}>x</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  screen: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    gap: spacing.md,
  },
  eyebrow: {
    alignSelf: "flex-start",
    backgroundColor: colors.panelGlass,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  eyebrowText: {
    color: colors.goldSoft,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 38,
    maxWidth: 320,
  },
  profileShell: {
    borderRadius: radius.xl,
  },
  profileCore: {
    gap: spacing.lg,
  },
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  avatar: {
    backgroundColor: colors.panel,
    borderRadius: radius.pill,
    height: 76,
    width: 76,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "700",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  runtimeRail: {
    borderTopColor: colors.borderStrong,
    borderTopWidth: 1,
    gap: 4,
    paddingTop: spacing.md,
  },
  runtimeLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  runtimeValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  leaveShell: {
    borderRadius: radius.lg,
  },
  leaveCore: {
    gap: spacing.md,
  },
  sectionKicker: {
    color: colors.goldSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  leaveEmpty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  leaveRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  leaveType: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  leaveMeta: {
    color: colors.textSoft,
    fontSize: 12,
    marginTop: 2,
  },
  leaveValue: {
    color: colors.goldSoft,
    fontSize: 18,
    fontWeight: "800",
  },
  infoShell: {
    borderRadius: radius.lg,
  },
  infoCore: {
    gap: spacing.sm,
    backgroundColor: colors.canvas,
  },
  infoBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  signOutShell: {
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    padding: 4,
  },
  signOutPressed: {
    transform: [{ scale: 0.985 }],
  },
  signOutDisabled: {
    opacity: 0.55,
  },
  signOutCore: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  signOutText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  signOutIsland: {
    alignItems: "center",
    backgroundColor: "rgba(15, 13, 11, 0.10)",
    borderRadius: radius.pill,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  signOutIslandText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
