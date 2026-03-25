import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AttendanceCaptureModal } from "../components/attendance/AttendanceCaptureModal";
import { AmbientBackdrop } from "../components/chrome/AmbientBackdrop";
import { DoublePanel } from "../components/chrome/DoublePanel";
import { PulseDot } from "../components/chrome/PulseDot";
import { useEmployeeDashboardData } from "../hooks/useEmployeeDashboardData";
import {
  formatStatusLabel,
  formatTimeLabel,
  formatWorkWindow,
  getRequirementSummary,
} from "../lib/formatters";
import { colors, radius, spacing } from "../theme/tokens";

export function AttendanceHomeScreen() {
  const dashboard = useEmployeeDashboardData();
  const [captureMode, setCaptureMode] = useState<"live" | "queue" | null>(null);
  const [isCaptureSubmitting, setIsCaptureSubmitting] = useState(false);
  const activeTime = dashboard.currentShiftOpen
    ? formatTimeLabel(dashboard.todayLog?.clock_in ?? null)
    : dashboard.attendanceComplete
      ? formatTimeLabel(dashboard.todayLog?.clock_out ?? null)
      : formatWorkWindow(dashboard.settings);
  const needsEvidence = dashboard.requiresSelfie || dashboard.requiresLocation;

  async function handlePrimaryActionPress() {
    if (needsEvidence) {
      setCaptureMode("live");
      return;
    }

    await dashboard.triggerPrimaryAction();
  }

  async function handleQueueActionPress() {
    if (needsEvidence) {
      setCaptureMode("queue");
      return;
    }

    await dashboard.queuePrimaryAction();
  }

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
              <Text style={styles.eyebrowText}>SHIFT CONTROL</Text>
            </View>
            <Text style={styles.title}>Operational calm for daily attendance.</Text>
            <Text style={styles.body}>
              One screen for starting a shift, capturing required proof, and seeing
              whether today is already closed and synced.
            </Text>
          </View>

          <DoublePanel shellStyle={styles.heroShell} coreStyle={styles.heroCore}>
            <View style={styles.heroHeader}>
              <View style={styles.heroHeaderLeft}>
                <PulseDot tone={dashboard.currentShiftOpen ? "mint" : "gold"} />
                <Text style={styles.heroLabel}>{dashboard.secondaryStatusLabel}</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  {formatStatusLabel(dashboard.todayLog?.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTime}>{activeTime}</Text>

            <Text style={styles.heroMeta}>
              {dashboard.currentShiftOpen
                ? "Your shift is live. Use this control surface to close the day once work is complete."
                : dashboard.attendanceComplete
                  ? "Today's shift is already complete and visible in history."
                  : "Attendance rules load before an action is attempted so mobile stays honest about real constraints."}
            </Text>

            <View style={styles.heroStatsRow}>
              <MicroStat
                label="Policy window"
                value={formatWorkWindow(dashboard.settings)}
              />
              <MicroStat
                label="Leave"
                value={
                  dashboard.leaveBalances[0]
                    ? `${dashboard.leaveBalances[0].balance} days`
                    : "--"
                }
              />
            </View>

            <Pressable
              onPress={() => {
                void handlePrimaryActionPress();
              }}
              style={({ pressed }) => [
                styles.primaryActionShell,
                pressed && styles.primaryActionPressed,
                (dashboard.isSubmitting || dashboard.isLoading) && styles.primaryActionDisabled,
              ]}
            >
              <View style={styles.primaryActionCore}>
                <Text style={styles.primaryActionText}>{dashboard.primaryActionLabel}</Text>
                <View style={styles.actionIsland}>
                  {dashboard.isSubmitting ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Text style={styles.actionIslandText}>{">"}</Text>
                  )}
                </View>
              </View>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => {
                  void handleQueueActionPress();
                }}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.secondaryActionPressed,
                ]}
              >
                <Text style={styles.secondaryActionText}>{dashboard.queueActionLabel}</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void dashboard.replayQueuedActions();
                }}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.secondaryActionPressed,
                  dashboard.pendingQueueCount === 0 && styles.secondaryActionDisabled,
                ]}
                disabled={dashboard.pendingQueueCount === 0}
              >
                <Text style={styles.secondaryActionText}>
                  {dashboard.isSyncingQueue ? "Replaying..." : "Replay queue"}
                </Text>
              </Pressable>
            </View>

            {dashboard.actionMessage ? (
              <Text style={styles.successText}>{dashboard.actionMessage}</Text>
            ) : null}
            {dashboard.actionError ? (
              <Text style={styles.errorText}>{dashboard.actionError}</Text>
            ) : null}
            {dashboard.queueMessage ? (
              <Text style={styles.successText}>{dashboard.queueMessage}</Text>
            ) : null}
            {dashboard.queueError ? (
              <Text style={styles.errorText}>{dashboard.queueError}</Text>
            ) : null}
          </DoublePanel>

          <View style={styles.gridStack}>
            <DoublePanel shellStyle={styles.cardShell} coreStyle={styles.cardCore}>
              <Text style={styles.cardKicker}>Requirements</Text>
              <Text style={styles.cardTitle}>Live policy surface</Text>
              <Text style={styles.cardBody}>
                {getRequirementSummary(dashboard.settings)}
              </Text>
            </DoublePanel>

            <DoublePanel shellStyle={styles.cardShell} coreStyle={styles.cardCoreWarm}>
              <Text style={styles.cardKicker}>Offline lane</Text>
              <Text style={styles.cardTitle}>
                {dashboard.pendingQueueCount} queued action{dashboard.pendingQueueCount === 1 ? "" : "s"}
              </Text>
              <Text style={styles.cardBody}>
                {dashboard.isOnline
                  ? "The queue now listens for network recovery and replays pending attendance entries automatically."
                  : "The queue holds evidence locally while offline and replays it once connectivity returns."}
              </Text>
            </DoublePanel>
          </View>
        </View>
      </ScrollView>
      <AttendanceCaptureModal
        geofenceLabel={dashboard.settings?.geofence_label ?? null}
        isBusy={isCaptureSubmitting}
        onClose={() => {
          if (!isCaptureSubmitting) {
            setCaptureMode(null);
          }
        }}
        onSubmit={async (payload) => {
          if (!captureMode) {
            return;
          }

          setIsCaptureSubmitting(true);

          try {
            const succeeded =
              captureMode === "queue"
                ? await dashboard.queuePrimaryAction(payload)
                : await dashboard.triggerPrimaryAction(payload);

            if (succeeded) {
              setCaptureMode(null);
            }
          } finally {
            setIsCaptureSubmitting(false);
          }
        }}
        requiresLocation={dashboard.requiresLocation}
        requiresSelfie={dashboard.requiresSelfie}
        title={captureMode === "queue" ? dashboard.queueActionLabel : dashboard.primaryActionLabel}
        visible={captureMode !== null}
      />
    </SafeAreaView>
  );
}

function MicroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.microStat}>
      <Text style={styles.microLabel}>{label}</Text>
      <Text style={styles.microValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 108,
  },
  screen: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    gap: spacing.md,
    paddingTop: spacing.sm,
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
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 40,
    maxWidth: 300,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 320,
  },
  heroShell: {
    borderRadius: radius.xl,
  },
  heroCore: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heroHeaderLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroLabel: {
    color: colors.mint,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroBadge: {
    backgroundColor: "rgba(143, 212, 194, 0.14)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: colors.mint,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroTime: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "800",
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  heroMeta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 320,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  microStat: {
    flex: 1,
    borderTopColor: colors.borderStrong,
    borderTopWidth: 1,
    gap: 4,
    paddingTop: spacing.md,
  },
  microLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  microValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryActionShell: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    padding: 4,
  },
  primaryActionPressed: {
    transform: [{ scale: 0.985 }],
  },
  primaryActionDisabled: {
    opacity: 0.7,
  },
  primaryActionCore: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryActionText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  actionIsland: {
    alignItems: "center",
    backgroundColor: "rgba(15, 13, 11, 0.10)",
    borderRadius: radius.pill,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  actionIslandText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    marginTop: -1,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondaryAction: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  secondaryActionPressed: {
    transform: [{ scale: 0.985 }],
  },
  secondaryActionDisabled: {
    opacity: 0.45,
  },
  secondaryActionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  gridStack: {
    gap: spacing.md,
  },
  cardShell: {
    borderRadius: radius.lg,
  },
  cardCore: {
    gap: spacing.sm,
  },
  cardCoreWarm: {
    gap: spacing.sm,
    backgroundColor: colors.canvas,
  },
  cardKicker: {
    color: colors.goldSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 20,
  },
});
