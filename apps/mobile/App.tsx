import "react-native-gesture-handler";

import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppTabs } from "./src/navigation/AppTabs";
import { AppProviders } from "./src/providers/AppProviders";
import { useMobileRuntime } from "./src/providers/useMobileRuntime";
import { AuthScreen } from "./src/screens/AuthScreen";
import { SetupScreen } from "./src/screens/SetupScreen";
import { colors, spacing } from "./src/theme/tokens";

function LoadingScreen() {
  const runtime = useMobileRuntime();
  const [showResetAction, setShowResetAction] = useState(false);

  useEffect(() => {
    setShowResetAction(false);

    if (runtime.authSyncStatus !== "waiting_for_convex") {
      return;
    }

    const timer = setTimeout(() => {
      setShowResetAction(true);
    }, 8000);

    return () => {
      clearTimeout(timer);
    };
  }, [runtime.authSyncStatus]);

  const canSignOut = Boolean(
    runtime.signOut &&
      (showResetAction || runtime.authSyncStatus === "signed_out"),
  );

  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={colors.ember} size="large" />
      <Text style={styles.loadingTitle}>Syncing secure session</Text>
      <Text style={styles.loadingBody}>
        Finishing Clerk and Convex handoff before the attendance workspace loads.
      </Text>
      {runtime.authSyncStatus ? (
        <Text style={styles.loadingStatus}>{runtime.authSyncStatus}</Text>
      ) : null}
      {runtime.authSyncDetail ? (
        <Text style={styles.loadingDetail}>{runtime.authSyncDetail}</Text>
      ) : null}
      {showResetAction ? (
        <Text style={styles.loadingHint}>
          If this takes more than a few seconds in Expo Go, reset the session and sign in again.
        </Text>
      ) : null}
      {canSignOut ? (
        <Pressable
          onPress={() => {
            if (runtime.signOut) {
              void runtime.signOut();
            }
          }}
          style={({ pressed }) => [
            styles.loadingAction,
            pressed && styles.loadingActionPressed,
          ]}
        >
          <Text style={styles.loadingActionText}>Reset session</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function RootSurface() {
  const runtime = useMobileRuntime();

  if (!runtime.hasBackendEnv) {
    return <SetupScreen />;
  }

  if (!runtime.isLoaded) {
    return <LoadingScreen />;
  }

  if (!runtime.isSignedIn) {
    return <AuthScreen />;
  }

  return <AppTabs />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProviders>
          <StatusBar style="light" />
          <RootSurface />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.ink,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  loadingStatus: {
    color: colors.goldSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  loadingDetail: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 320,
    textAlign: "center",
  },
  loadingAction: {
    marginTop: spacing.sm,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  loadingActionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  loadingActionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  loadingHint: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 320,
    textAlign: "center",
  },
});
