import { isClerkAPIResponseError, useSignIn } from "@clerk/expo";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { TextInput as RNTextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AmbientBackdrop } from "../components/chrome/AmbientBackdrop";
import { DoublePanel } from "../components/chrome/DoublePanel";
import {
  completeSignInAttempt,
  getVerificationCodeSeed,
  getNextSignInStep,
  resolveAuthAttemptResult,
} from "./authFlow";
import { colors, radius, spacing } from "../theme/tokens";

export function AuthScreen() {
  const signInHook = useSignIn() as unknown as {
    isLoaded?: boolean;
    signIn?: {
      status?: string;
      createdSessionId?: string | null;
      finalize?: (params: {
        navigate?: (context: {
          session?: { currentTask?: unknown } | null;
          decorateUrl?: (url: string) => string;
        }) => void;
      }) => Promise<void>;
      create: (params: {
        identifier: string;
        password: string;
      }) => Promise<{
        status?: string;
        createdSessionId?: string | null;
        supportedSecondFactors?: Array<{
          strategy?: string;
        }>;
        error?: { message?: string };
      }>;
      supportedSecondFactors?: Array<{
        strategy?: string;
      }>;
      mfa?: {
        sendEmailCode: () => Promise<void>;
        verifyEmailCode: (params: { code: string }) => Promise<{
          status?: string;
          createdSessionId?: string | null;
          supportedSecondFactors?: Array<{
            strategy?: string;
          }>;
        }>;
      };
    };
    setActive?: (params: { session: string }) => Promise<void>;
  };
  const signInResource = signInHook.signIn;
  const setActiveSession = signInHook.setActive;
  const finalizeSignIn = useCallback(async () => {
    if (!signInResource?.finalize) {
      throw new Error("Clerk session activation is unavailable on this device.");
    }

    await signInResource.finalize({
      navigate: () => {
        // App.tsx reacts to Clerk auth state, so no imperative navigation is needed here.
      },
    });
  }, [signInResource]);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInputRef = useRef<RNTextInput | null>(null);
  const verificationInputRef = useRef<RNTextInput | null>(null);
  const lastVerificationAttemptRef = useRef<string | null>(null);

  async function handleSignIn() {
    if (!signInResource || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signInResource.create({
        identifier: identifier.trim(),
        password,
      });

      if (result.error?.message) {
        setError(result.error.message);
        return;
      }

      const nextStep = getNextSignInStep(resolveAuthAttemptResult(signInResource, result));

      if (nextStep.kind === "complete") {
        await completeSignInAttempt(nextStep, {
          finalizeSignIn: signInResource?.finalize ? finalizeSignIn : undefined,
          setActiveSession,
        });
        return;
      }

      if (nextStep.kind === "verify_email_code" && signInResource.mfa) {
        await signInResource.mfa.sendEmailCode();
        setAwaitingVerification(true);
        setVerificationCode("");
        setError(null);
        verificationInputRef.current?.focus();
        return;
      }

      if (nextStep.kind === "unsupported_verification") {
        setError("This account needs a Clerk verification factor that the mobile app does not support yet.");
        return;
      }

      setError("This sign-in flow is incomplete. Try again or request a new verification code.");
    } catch (caughtError) {
      if (isClerkAPIResponseError(caughtError) && caughtError.errors[0]?.message) {
        setError(caughtError.errors[0].message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Sign-in failed. Check your credentials and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleVerification = useCallback(async () => {
    if (!signInResource?.mfa || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    lastVerificationAttemptRef.current = verificationCode.trim();

    try {
      const result = await signInResource.mfa.verifyEmailCode({
        code: verificationCode.trim(),
      });

      const nextStep = getNextSignInStep(resolveAuthAttemptResult(signInResource, result));

      if (nextStep.kind === "complete") {
        await completeSignInAttempt(nextStep, {
          finalizeSignIn: signInResource?.finalize ? finalizeSignIn : undefined,
          setActiveSession,
        });
        return;
      }

      setError(
        signInResource.status
          ? `Verification did not complete. Clerk returned: ${signInResource.status}.`
          : "Verification did not complete. Request a new code and try again.",
      );
    } catch (caughtError) {
      if (isClerkAPIResponseError(caughtError) && caughtError.errors[0]?.message) {
        setError(caughtError.errors[0].message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Verification failed. Check the code and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [finalizeSignIn, isSubmitting, setActiveSession, signInResource, verificationCode]);

  async function handleResendCode() {
    if (!signInResource?.mfa || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signInResource.mfa.sendEmailCode();
    } catch (caughtError) {
      if (isClerkAPIResponseError(caughtError) && caughtError.errors[0]?.message) {
        setError(caughtError.errors[0].message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Could not resend the code. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const normalizedCode = verificationCode.trim();

    if (!awaitingVerification || normalizedCode.length !== 6 || isSubmitting) {
      return;
    }

    if (lastVerificationAttemptRef.current === normalizedCode) {
      return;
    }

    void handleVerification();
  }, [awaitingVerification, handleVerification, isSubmitting, verificationCode]);

  useEffect(() => {
    if (!awaitingVerification) {
      return;
    }

    const seededCode = getVerificationCodeSeed(identifier.trim(), __DEV__);

    const clearVerificationField = setTimeout(() => {
      verificationInputRef.current?.clear();
      setVerificationCode(seededCode);
      if (seededCode) {
        verificationInputRef.current?.setNativeProps({ text: seededCode });
      }
      verificationInputRef.current?.focus();
    }, 75);

    return () => {
      clearTimeout(clearVerificationField);
    };
  }, [awaitingVerification, identifier]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardRoot}
      >
        <View style={styles.screen}>
          <View style={styles.header}>
            <View style={styles.eyebrow}>
              <Text style={styles.eyebrowText}>FIELD ACCESS</Text>
            </View>
            <Text style={styles.title}>Attendance control built for one-thumb speed.</Text>
            <Text style={styles.body}>
              Use the same employee credentials as the web app. Once signed in,
              shifts, leave balances, and attendance history load from Convex.
            </Text>
          </View>

          <DoublePanel coreStyle={styles.formCore} shellStyle={styles.formShell}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.panelKicker}>Employee sign in</Text>
                <Text style={styles.panelTitle}>
                  {awaitingVerification ? "Verify this device" : "Start your shift flow"}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Clerk</Text>
              </View>
            </View>

            {awaitingVerification ? (
              <>
                <Text style={styles.helperCallout}>
                  Enter the email verification code from Clerk to finish sign-in on this device.
                  Test-mode accounts can use 424242.
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Verification code</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="off"
                    editable={!isSubmitting}
                    importantForAutofill="no"
                    keyboardType="number-pad"
                    onSubmitEditing={() => {
                      void handleVerification();
                    }}
                    onChangeText={setVerificationCode}
                    placeholder="424242"
                    placeholderTextColor={colors.textSoft}
                    ref={verificationInputRef}
                    returnKeyType="done"
                    selectTextOnFocus={true}
                    style={styles.input}
                    value={verificationCode}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    blurOnSubmit={false}
                    editable={!isSubmitting}
                    keyboardType="email-address"
                    onChangeText={setIdentifier}
                    onSubmitEditing={() => {
                      passwordInputRef.current?.focus();
                    }}
                    placeholder="name@company.com"
                    placeholderTextColor={colors.textSoft}
                    returnKeyType="next"
                    style={styles.input}
                    value={identifier}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isSubmitting}
                    onChangeText={setPassword}
                    onSubmitEditing={() => {
                      void handleSignIn();
                    }}
                    placeholder="Your web password"
                    placeholderTextColor={colors.textSoft}
                    ref={passwordInputRef}
                    returnKeyType="go"
                    secureTextEntry={true}
                    style={styles.input}
                    value={password}
                  />
                </View>
              </>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              disabled={isSubmitting}
              onPress={() => {
                if (awaitingVerification) {
                  void handleVerification();
                } else {
                  void handleSignIn();
                }
              }}
              style={({ pressed }) => [
                styles.primaryActionShell,
                pressed && styles.primaryActionPressed,
                isSubmitting && styles.primaryActionDisabled,
              ]}
            >
              <View style={styles.primaryActionCore}>
                <Text style={styles.primaryActionText}>
                  {awaitingVerification ? "Verify code" : "Sign in"}
                </Text>
                <View style={styles.actionIsland}>
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Text style={styles.actionIslandText}>{">"}</Text>
                  )}
                </View>
              </View>
            </Pressable>

            {awaitingVerification ? (
              <Pressable
                onPress={() => {
                  void handleResendCode();
                }}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.secondaryActionPressed,
                  isSubmitting && styles.primaryActionDisabled,
                ]}
              >
                <Text style={styles.secondaryActionText}>Send a new code</Text>
              </Pressable>
            ) : null}

            <Text style={styles.helperText}>
              Native sign-up, recovery, and device onboarding can come after camera,
              location, and offline replay are stable on device.
            </Text>
          </DoublePanel>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  keyboardRoot: {
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
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
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 40,
    maxWidth: 320,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 320,
  },
  formShell: {
    borderRadius: radius.xl,
  },
  formCore: {
    gap: spacing.md,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  panelKicker: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  panelTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "700",
    marginTop: 4,
  },
  badge: {
    backgroundColor: "rgba(199, 161, 94, 0.14)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: colors.goldSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.goldSoft,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  helperCallout: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
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
    opacity: 0.65,
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
  secondaryAction: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  secondaryActionPressed: {
    opacity: 0.8,
  },
  secondaryActionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  helperText: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 21,
  },
});
