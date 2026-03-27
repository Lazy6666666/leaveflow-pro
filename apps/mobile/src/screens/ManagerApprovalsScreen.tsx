import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AmbientBackdrop } from "../components/chrome/AmbientBackdrop";
import { DoublePanel } from "../components/chrome/DoublePanel";
import { useManagerApprovalsData, type PendingApprovalPreview } from "../hooks/useManagerApprovalsData";
import { formatDateLabel } from "../lib/formatters";
import { formatApprovalDateRange, getDecisionVerb } from "../lib/managerApprovals";
import { colors, radius, spacing } from "../theme/tokens";

type DecisionState = {
  requestId: string;
  status: "approved" | "rejected";
} | null;

export function ManagerApprovalsScreen() {
  const approvals = useManagerApprovalsData();
  const [decisionState, setDecisionState] = useState<DecisionState>(null);
  const [comment, setComment] = useState("");

  const pendingCount = approvals.approvals.length;
  const targetRequest = approvals.approvals.find(
    (approval) => approval.id === decisionState?.requestId,
  );

  async function confirmDecision() {
    if (!decisionState) {
      return;
    }

    const ok = await approvals.submitDecision({
      requestId: decisionState.requestId,
      status: decisionState.status,
      managerComment: comment,
    });

    if (ok) {
      setDecisionState(null);
      setComment("");
    }
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
              <Text style={styles.eyebrowText}>APPROVALS</Text>
            </View>
            <Text style={styles.title}>Pending decisions stay compact on mobile.</Text>
            <Text style={styles.body}>
              Review requests, confirm a decision, and move the queue forward without
              leaving the manager tab set.
            </Text>
          </View>

          <DoublePanel shellStyle={styles.summaryShell} coreStyle={styles.summaryCore}>
            <MetricCard label="Pending now" value={String(pendingCount)} />
            <MetricCard
              label="Oldest submitted"
              value={
                approvals.approvals[0]
                  ? formatDateLabel(approvals.approvals[0].created_at.slice(0, 10))
                  : "None"
              }
            />
          </DoublePanel>

          {approvals.isLoading ? (
            <DoublePanel shellStyle={styles.stateShell} coreStyle={styles.stateCore}>
              <ActivityIndicator color={colors.gold} />
              <Text style={styles.stateTitle}>Loading pending approvals...</Text>
              <Text style={styles.stateBody}>
                Pulling the current approval queue from Convex.
              </Text>
            </DoublePanel>
          ) : null}

          {!approvals.isLoading && pendingCount === 0 ? (
            <DoublePanel shellStyle={styles.stateShell} coreStyle={styles.stateCore}>
              <Text style={styles.stateTitle}>No pending requests</Text>
              <Text style={styles.stateBody}>
                The queue is clear right now. New leave requests will appear here when
                they need a decision.
              </Text>
            </DoublePanel>
          ) : null}

          {approvals.actionMessage ? (
            <Text style={styles.successText}>{approvals.actionMessage}</Text>
          ) : null}
          {approvals.actionError ? (
            <Text style={styles.errorText}>{approvals.actionError}</Text>
          ) : null}

          <View style={styles.queue}>
            {approvals.approvals.map((approval) => (
              <ApprovalCard
                approval={approval}
                decisionState={decisionState}
                comment={comment}
                onApprove={() => {
                  setDecisionState({ requestId: approval.id, status: "approved" });
                  setComment("");
                }}
                onReject={() => {
                  setDecisionState({ requestId: approval.id, status: "rejected" });
                  setComment("");
                }}
                onCancel={() => {
                  setDecisionState(null);
                  setComment("");
                }}
                onCommentChange={setComment}
                onConfirm={confirmDecision}
                isSubmitting={approvals.isSubmitting}
                isTarget={targetRequest?.id === approval.id}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function ApprovalCard({
  approval,
  decisionState,
  comment,
  onApprove,
  onReject,
  onCancel,
  onCommentChange,
  onConfirm,
  isSubmitting,
  isTarget,
}: {
  approval: PendingApprovalPreview;
  decisionState: DecisionState;
  comment: string;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  onCommentChange: (value: string) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  isTarget: boolean;
}) {
  const activeStatus = isTarget ? decisionState?.status ?? null : null;

  return (
    <DoublePanel shellStyle={styles.cardShell} coreStyle={styles.cardCore}>
      <View style={styles.cardHeader}>
        <View style={styles.cardCopy}>
          <Text style={styles.cardName}>
            {approval.profiles?.full_name ?? approval.profiles?.email ?? "Unknown employee"}
          </Text>
          <Text style={styles.cardMeta}>
            {approval.leave_types?.name ?? "Leave"} |{" "}
            {formatApprovalDateRange(approval.start_date, approval.end_date)}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{approval.status}</Text>
        </View>
      </View>

      <Text style={styles.cardReason}>{approval.reason ?? "No reason provided."}</Text>
      <Text style={styles.cardSubmitted}>
        Submitted {formatDateLabel(approval.created_at.slice(0, 10))}
      </Text>

      <View style={styles.actionRow}>
        <Pressable
          onPress={onApprove}
          style={({ pressed }) => [
            styles.actionButton,
            styles.approveButton,
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={styles.approveText}>Approve</Text>
        </Pressable>
        <Pressable
          onPress={onReject}
          style={({ pressed }) => [
            styles.actionButton,
            styles.rejectButton,
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={styles.rejectText}>Reject</Text>
        </Pressable>
      </View>

      {activeStatus ? (
        <View style={styles.composer}>
          <Text style={styles.composerTitle}>
            {getDecisionVerb(activeStatus)} this request
          </Text>
          <TextInput
            multiline
            onChangeText={onCommentChange}
            placeholder="Optional manager comment"
            placeholderTextColor={colors.textSoft}
            style={styles.commentInput}
            value={comment}
          />
          <View style={styles.composerActions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.secondaryComposerButton,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={styles.secondaryComposerText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void onConfirm();
              }}
              style={({ pressed }) => [
                styles.primaryComposerButton,
                pressed && styles.actionPressed,
                isSubmitting && styles.actionDisabled,
              ]}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryComposerText}>
                {isSubmitting ? "Saving..." : getDecisionVerb(activeStatus)}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </DoublePanel>
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
  summaryShell: {
    borderRadius: radius.xl,
  },
  summaryCore: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  metricCard: {
    flex: 1,
    gap: spacing.xs,
  },
  metricLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  stateShell: {
    borderRadius: radius.lg,
  },
  stateCore: {
    alignItems: "center",
    gap: spacing.sm,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  stateBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  successText: {
    color: colors.mint,
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    color: colors.ember,
    fontSize: 13,
    fontWeight: "700",
  },
  queue: {
    gap: spacing.md,
  },
  cardShell: {
    borderRadius: radius.xl,
  },
  cardCore: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  cardMeta: {
    color: colors.goldSoft,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.panelGlass,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  cardReason: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  cardSubmitted: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    borderRadius: radius.pill,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  approveButton: {
    backgroundColor: "rgba(143, 212, 194, 0.16)",
  },
  rejectButton: {
    backgroundColor: "rgba(242, 157, 127, 0.14)",
  },
  actionPressed: {
    opacity: 0.82,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  approveText: {
    color: colors.mint,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  rejectText: {
    color: colors.ember,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  composer: {
    borderTopColor: colors.borderStrong,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  composerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  commentInput: {
    backgroundColor: colors.canvas,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  composerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  secondaryComposerButton: {
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryComposerText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  primaryComposerButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryComposerText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
});
