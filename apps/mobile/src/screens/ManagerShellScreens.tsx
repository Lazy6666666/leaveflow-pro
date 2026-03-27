import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AmbientBackdrop } from "../components/chrome/AmbientBackdrop";
import { DoublePanel } from "../components/chrome/DoublePanel";
import { useMobileRuntime } from "../providers/useMobileRuntime";
import { colors, radius, spacing } from "../theme/tokens";

type ScreenTone = "mint" | "gold" | "ember";

type Insight = {
  label: string;
  value: string;
};

type ManagerShellProps = {
  eyebrow: string;
  title: string;
  body: string;
  tone: ScreenTone;
  focusLabel: string;
  focusBody: string;
  insights: Insight[];
};

const TONE_STYLES: Record<ScreenTone, { badge: string; text: string }> = {
  mint: {
    badge: "rgba(143, 212, 194, 0.14)",
    text: colors.mint,
  },
  gold: {
    badge: "rgba(199, 161, 94, 0.16)",
    text: colors.goldSoft,
  },
  ember: {
    badge: "rgba(242, 157, 127, 0.16)",
    text: colors.ember,
  },
};

function ManagerShellScreen({
  eyebrow,
  title,
  body,
  tone,
  focusLabel,
  focusBody,
  insights,
}: ManagerShellProps) {
  const runtime = useMobileRuntime();
  const toneStyle = TONE_STYLES[tone];

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
              <Text style={styles.eyebrowText}>{eyebrow}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>

          <DoublePanel shellStyle={styles.focusShell} coreStyle={styles.focusCore}>
            <View style={styles.focusHeader}>
              <View style={[styles.focusBadge, { backgroundColor: toneStyle.badge }]}>
                <Text style={[styles.focusBadgeText, { color: toneStyle.text }]}>
                  {runtime.primaryRole.replace("_", " ")}
                </Text>
              </View>
              <Text style={styles.focusIdentity}>
                {runtime.userLabel ?? "Manager session"}
              </Text>
            </View>
            <Text style={styles.focusLabel}>{focusLabel}</Text>
            <Text style={styles.focusBody}>{focusBody}</Text>
            <Pressable
              disabled={!runtime.signOut}
              onPress={() => {
                if (runtime.signOut) {
                  void runtime.signOut();
                }
              }}
              style={({ pressed }) => [
                styles.sessionAction,
                pressed && styles.sessionActionPressed,
                !runtime.signOut && styles.sessionActionDisabled,
              ]}
            >
              <Text style={styles.sessionActionText}>
                {runtime.signOut ? "Sign out" : "Session controls unavailable"}
              </Text>
            </Pressable>
          </DoublePanel>

          <View style={styles.grid}>
            {insights.map((insight) => (
              <DoublePanel
                key={insight.label}
                shellStyle={styles.cardShell}
                coreStyle={styles.cardCore}
              >
                <Text style={styles.cardLabel}>{insight.label}</Text>
                <Text style={styles.cardValue}>{insight.value}</Text>
              </DoublePanel>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ManagerTeamScreen() {
  return (
    <ManagerShellScreen
      eyebrow="TEAM OVERVIEW"
      title="Team operations now get their own mobile surface."
      body="This shell is ready to become the manager landing zone instead of reusing the employee attendance flow."
      tone="mint"
      focusLabel="Next live connection"
      focusBody="Direct reports, today attendance, and leave visibility should land here without changing the employee clock lane."
      insights={[
        { label: "Attendance pulse", value: "Today team status" },
        { label: "Coverage view", value: "Who's out or late" },
        { label: "Manager cue", value: "Action-first home" },
      ]}
    />
  );
}

export function ManagerApprovalsScreen() {
  return (
    <ManagerShellScreen
      eyebrow="APPROVALS"
      title="Leave decisions sit in a focused manager lane."
      body="Approvals move out of generic navigation and into a surface that can prioritize pending work and response confidence."
      tone="gold"
      focusLabel="Next live connection"
      focusBody="Pending requests, decision notes, and lightweight staffing context can plug into this layout without reworking navigation again."
      insights={[
        { label: "Pending queue", value: "Requests awaiting action" },
        { label: "Coverage risk", value: "Conflicts before approval" },
        { label: "Decision notes", value: "Reason capture slot" },
      ]}
    />
  );
}

export function ManagerScheduleScreen() {
  return (
    <ManagerShellScreen
      eyebrow="SCHEDULE"
      title="Scheduling gets a dedicated mobile planning shell."
      body="Managers should be able to scan shifts and make targeted adjustments without dropping into the employee-first tab set."
      tone="mint"
      focusLabel="Next live connection"
      focusBody="Shift allocations, calendar slices, and change-impact summaries can slot into these cards when the schedule data path is ready."
      insights={[
        { label: "Shift map", value: "Weekly team view" },
        { label: "Swap intent", value: "Who needs coverage" },
        { label: "Planning cue", value: "Mobile-first schedule lane" },
      ]}
    />
  );
}

export function ManagerReportsScreen() {
  return (
    <ManagerShellScreen
      eyebrow="REPORTS"
      title="Reports stay concise and mobile-readable."
      body="The foundation gives managers a stable place for team metrics before the full reporting layer arrives."
      tone="ember"
      focusLabel="Next live connection"
      focusBody="Attendance summaries, leave usage patterns, and incident signals can be added here without disturbing the tab model."
      insights={[
        { label: "Trend line", value: "Leave and attendance" },
        { label: "Risk signal", value: "Outliers worth review" },
        { label: "Daily brief", value: "Fast executive summary" },
      ]}
    />
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
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 38,
    maxWidth: 320,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 330,
  },
  focusShell: {
    borderRadius: radius.xl,
  },
  focusCore: {
    gap: spacing.md,
  },
  focusHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  focusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  focusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  focusIdentity: {
    color: colors.textSoft,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    textTransform: "uppercase",
  },
  focusLabel: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
  },
  focusBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  sessionAction: {
    alignSelf: "flex-start",
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sessionActionPressed: {
    opacity: 0.82,
  },
  sessionActionDisabled: {
    opacity: 0.45,
  },
  sessionActionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  grid: {
    gap: spacing.md,
  },
  cardShell: {
    borderRadius: radius.lg,
  },
  cardCore: {
    gap: spacing.xs,
  },
  cardLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  cardValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
});
