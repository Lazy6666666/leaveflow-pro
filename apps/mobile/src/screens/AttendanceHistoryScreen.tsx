import { FlashList } from "@shopify/flash-list";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AmbientBackdrop } from "../components/chrome/AmbientBackdrop";
import { DoublePanel } from "../components/chrome/DoublePanel";
import {
  type AttendanceLogPreview,
  useEmployeeDashboardData,
} from "../hooks/useEmployeeDashboardData";
import {
  formatAttendanceSummary,
  formatDateLabel,
  formatStatusLabel,
} from "../lib/formatters";
import { colors, radius, spacing } from "../theme/tokens";

export function AttendanceHistoryScreen() {
  const dashboard = useEmployeeDashboardData();
  const completedCount = dashboard.history.filter((item) => Boolean(item.clock_out)).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackdrop />
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.eyebrow}>
            <Text style={styles.eyebrowText}>ATTENDANCE LEDGER</Text>
          </View>
          <Text style={styles.title}>A cleaner read on every shift already logged.</Text>
          <Text style={styles.body}>
            This is the employee history lane, optimized for scanning whether each
            day is done, partial, or still needs attention.
          </Text>
        </View>

        <DoublePanel shellStyle={styles.summaryShell} coreStyle={styles.summaryCore}>
          <SummaryBlock label="Entries this month" value={String(dashboard.history.length)} />
          <SummaryBlock label="Closed shifts" value={String(completedCount)} />
        </DoublePanel>

        {dashboard.isLoading ? (
          <DoublePanel shellStyle={styles.loadingShell} coreStyle={styles.loadingCore}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.loadingText}>Loading attendance history...</Text>
          </DoublePanel>
        ) : null}

        <FlashList<AttendanceLogPreview>
          contentContainerStyle={styles.listContent}
          data={dashboard.history}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <DoublePanel shellStyle={styles.emptyShell} coreStyle={styles.emptyCore}>
              <Text style={styles.emptyTitle}>No attendance records yet</Text>
              <Text style={styles.emptyText}>
                As soon as the first shift is captured, this ledger becomes the
                mobile reference point for clock activity.
              </Text>
            </DoublePanel>
          }
          renderItem={({ item, index }) => (
            <View style={[styles.rowWrap, index === 0 && styles.firstRowWrap]}>
              <View style={styles.timelineRail}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineLine} />
              </View>
              <DoublePanel shellStyle={styles.rowShell} coreStyle={styles.rowCore}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowDate}>{formatDateLabel(item.date)}</Text>
                  <Text style={styles.rowStatus}>{formatStatusLabel(item.status)}</Text>
                </View>
                <Text style={styles.rowSummary}>{formatAttendanceSummary(item)}</Text>
              </DoublePanel>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryBlock}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  screen: {
    flex: 1,
    gap: spacing.md,
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
    maxWidth: 315,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 320,
  },
  summaryShell: {
    borderRadius: radius.lg,
  },
  summaryCore: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  summaryBlock: {
    flex: 1,
    gap: 6,
  },
  summaryLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  listContent: {
    paddingBottom: 120,
    paddingTop: spacing.sm,
  },
  rowWrap: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  firstRowWrap: {
    marginTop: 2,
  },
  timelineRail: {
    alignItems: "center",
    width: 16,
  },
  timelineDot: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    height: 8,
    marginTop: 22,
    width: 8,
  },
  timelineLine: {
    backgroundColor: colors.borderStrong,
    flex: 1,
    marginTop: 6,
    width: 1,
  },
  rowShell: {
    flex: 1,
    borderRadius: radius.lg,
  },
  rowCore: {
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowDate: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  rowStatus: {
    color: colors.mint,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  rowSummary: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  emptyShell: {
    borderRadius: radius.lg,
  },
  emptyCore: {
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  loadingShell: {
    borderRadius: radius.lg,
  },
  loadingCore: {
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
