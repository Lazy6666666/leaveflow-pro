import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buildAttendanceCapabilityFallbacks } from "../../lib/attendanceFlow";
import type { MobileOfflineLocationData } from "../../lib/mobileOfflineQueue";
import { colors } from "../../theme/tokens";
import { styles } from "./AttendanceCaptureModal.styles";

export type AttendanceCaptureSubmission = {
  selfieUri?: string;
  locationData?: MobileOfflineLocationData;
};

type AttendanceCaptureModalProps = {
  visible: boolean;
  title: string;
  requiresSelfie: boolean;
  requiresLocation: boolean;
  geofenceLabel?: string | null;
  isBusy: boolean;
  onClose: () => void;
  onSubmit: (payload: AttendanceCaptureSubmission) => Promise<void>;
};

export function AttendanceCaptureModal({
  visible,
  title,
  requiresSelfie,
  requiresLocation,
  geofenceLabel,
  isBusy,
  onClose,
  onSubmit,
}: AttendanceCaptureModalProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<MobileOfflineLocationData | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState<boolean | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCapturingSelfie, setIsCapturingSelfie] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const capabilityFallbacks = buildAttendanceCapabilityFallbacks({
    settings: {
      require_selfie: requiresSelfie,
      require_location: requiresLocation,
      geofence_enabled: Boolean(geofenceLabel),
      geofence_label: geofenceLabel ?? null,
    },
    cameraAvailable,
    cameraPermission,
    locationPermission,
    locationServicesEnabled,
  });
  const liveCaptureBlocked = capabilityFallbacks.some((item) => item.blocking);
  const unsupportedCameraMessage =
    "This device cannot provide a live camera feed for selfie verification.";

  async function ensureCameraPermission() {
    if (cameraAvailable === false) {
      return false;
    }

    if (cameraPermission?.granted) {
      return true;
    }

    const result = await requestCameraPermission();
    return result.granted;
  }

  const ensureLocationPermission = useCallback(async () => {
    if (locationPermission?.granted) {
      return true;
    }

    const result = await requestLocationPermission();
    return result.granted;
  }, [locationPermission?.granted, requestLocationPermission]);

  async function captureSelfie() {
    setLocalError(null);
    const granted = await ensureCameraPermission();

    if (!granted) {
      setLocalError("Camera permission is required to capture a selfie.");
      return;
    }

    if (!cameraRef.current) {
      setLocalError("The camera is still preparing. Try again in a moment.");
      return;
    }

    setIsCapturingSelfie(true);

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        shutterSound: false,
      });
      setSelfieUri(picture.uri);
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Selfie capture failed. Try again.",
      );
    } finally {
      setIsCapturingSelfie(false);
    }
  }

  const acquireLocation = useCallback(async () => {
    setLocalError(null);
    setIsLoadingLocation(true);

    try {
      const granted = await ensureLocationPermission();

      if (!granted) {
        setLocalError("Location permission is required for attendance verification.");
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      setLocationServicesEnabled(servicesEnabled);
      if (!servicesEnabled) {
        setLocalError("Turn on location services to continue.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
      });

      const nextLocation: MobileOfflineLocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
      };

      setLocationData(nextLocation);
      setLocationLabel(
        nextLocation.accuracy
          ? `${nextLocation.lat.toFixed(5)}, ${nextLocation.lng.toFixed(5)} | +/-${Math.round(
              nextLocation.accuracy,
            )}m`
          : `${nextLocation.lat.toFixed(5)}, ${nextLocation.lng.toFixed(5)}`,
      );
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Location capture failed. Try again.",
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [ensureLocationPermission]);

  useEffect(() => {
    if (!visible) {
      setSelfieUri(null);
      setLocationData(null);
      setLocationLabel(null);
      setCameraAvailable(null);
      setLocationServicesEnabled(null);
      setLocalError(null);
      setIsCapturingSelfie(false);
      setIsLoadingLocation(false);
      return;
    }

    if (requiresSelfie) {
      void CameraView.isAvailableAsync()
        .then((available) => {
          setCameraAvailable(available);
          if (!available) {
            setLocalError(unsupportedCameraMessage);
          }
        })
        .catch(() => {
          setCameraAvailable(false);
          setLocalError(unsupportedCameraMessage);
        });
    }

    if (requiresLocation) {
      void acquireLocation();
    }
  }, [acquireLocation, requiresLocation, requiresSelfie, visible]);

  async function handleSubmit() {
    if (isBusy) {
      return;
    }

    setLocalError(null);

    if (liveCaptureBlocked) {
      setLocalError("Resolve the device fallback guidance before continuing.");
      return;
    }

    if (requiresSelfie && !selfieUri) {
      setLocalError("Capture a selfie before continuing.");
      return;
    }

    if (requiresLocation && !locationData) {
      setLocalError("Capture your live location before continuing.");
      return;
    }

    try {
      await onSubmit({
        selfieUri: selfieUri ?? undefined,
        locationData: locationData ?? undefined,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Attendance capture could not be submitted.",
      );
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      transparent={true}
      visible={visible}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Verification</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.body}>
                  {geofenceLabel
                    ? `Capture the required evidence before submitting attendance for ${geofenceLabel}.`
                    : "Capture the required evidence before submitting attendance."}
                </Text>
              </View>
              <Pressable disabled={isBusy} onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>

            {capabilityFallbacks.length > 0 ? (
              <View style={styles.fallbackStack}>
                {capabilityFallbacks.map((item) => (
                  <View key={item.key} style={styles.fallbackCard}>
                    <Text style={styles.fallbackTitle}>{item.title}</Text>
                    <Text style={styles.fallbackBody}>{item.body}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {requiresSelfie ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Selfie evidence</Text>
                <View style={styles.cameraFrame}>
                  {selfieUri ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: selfieUri }}
                      style={styles.cameraFrame}
                    />
                  ) : cameraAvailable === false ? (
                    <View style={styles.cameraFallback}>
                      <Text style={styles.cameraFallbackTitle}>Camera capture unavailable</Text>
                      <Text style={styles.cameraFallbackBody}>
                        Use the fallback guidance above, then continue attendance on a supported device.
                      </Text>
                    </View>
                  ) : (
                    <CameraView
                      facing="front"
                      mirror={true}
                      ref={cameraRef}
                      style={styles.cameraFrame}
                    />
                  )}
                </View>

                <View style={styles.sectionActions}>
                  <Pressable
                    disabled={isBusy || isCapturingSelfie}
                    onPress={() => {
                      if (selfieUri) {
                        setSelfieUri(null);
                        return;
                      }

                      void captureSelfie();
                    }}
                    style={({ pressed }) => [
                      styles.secondaryAction,
                      pressed && styles.secondaryActionPressed,
                      (isBusy || isCapturingSelfie) && styles.secondaryActionDisabled,
                    ]}
                  >
                    <Text style={styles.secondaryActionText}>
                      {selfieUri
                        ? "Retake selfie"
                        : isCapturingSelfie
                          ? "Capturing..."
                          : "Capture selfie"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {requiresLocation ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Location evidence</Text>
                <View style={styles.locationCard}>
                  <Text style={styles.locationValue}>
                    {locationLabel ?? "No location captured yet."}
                  </Text>
                  <Text style={styles.locationMeta}>
                    {geofenceLabel
                      ? `This sample is used for ${geofenceLabel} geofence validation.`
                      : "This sample is used for live attendance verification."}
                  </Text>
                </View>

                <View style={styles.sectionActions}>
                  <Pressable
                    disabled={isBusy || isLoadingLocation}
                    onPress={() => {
                      void acquireLocation();
                    }}
                    style={({ pressed }) => [
                      styles.secondaryAction,
                      pressed && styles.secondaryActionPressed,
                      (isBusy || isLoadingLocation) && styles.secondaryActionDisabled,
                    ]}
                  >
                    <Text style={styles.secondaryActionText}>
                      {isLoadingLocation ? "Refreshing..." : "Refresh location"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {localError ? <Text style={styles.errorText}>{localError}</Text> : null}

            <Pressable
              disabled={isBusy}
              onPress={() => {
                void handleSubmit();
              }}
              style={({ pressed }) => [
                styles.primaryActionShell,
                pressed && styles.primaryActionPressed,
                (isBusy || liveCaptureBlocked) && styles.primaryActionDisabled,
              ]}
            >
              <View style={styles.primaryActionCore}>
                <Text style={styles.primaryActionText}>
                  {liveCaptureBlocked ? "Use supported device" : "Submit evidence"}
                </Text>
                <View style={styles.actionIsland}>
                  {isBusy ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Text style={styles.actionIslandText}>{">"}</Text>
                  )}
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
