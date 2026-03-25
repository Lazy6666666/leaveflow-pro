import * as FileSystem from "expo-file-system/legacy";

const SELFIE_DIRECTORY = `${FileSystem.documentDirectory ?? ""}attendance-selfies/`;

async function ensureSelfieDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Device file storage is unavailable for offline selfie capture.");
  }

  await FileSystem.makeDirectoryAsync(SELFIE_DIRECTORY, {
    intermediates: true,
  });
}

export async function persistCapturedSelfie(sourceUri: string) {
  await ensureSelfieDirectory();
  const targetUri = `${SELFIE_DIRECTORY}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.jpg`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: targetUri,
  });

  return targetUri;
}

export async function deletePersistedSelfie(selfieUri?: string) {
  if (!selfieUri) {
    return;
  }

  await FileSystem.deleteAsync(selfieUri, {
    idempotent: true,
  });
}
