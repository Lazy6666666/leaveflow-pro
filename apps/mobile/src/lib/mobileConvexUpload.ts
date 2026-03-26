import { api } from "../../../../convex/_generated/api";
import { convexClient } from "./convex";

type MobileFileClass = "attendance_selfie";

export async function uploadFileToConvex(
  fileUri: string,
  fileClass: MobileFileClass,
) {
  if (!convexClient) {
    throw new Error("Convex client is not ready for uploads.");
  }

  const uploadUrl = await convexClient.mutation(api.files.generateUploadUrl, { fileClass });
  const fileResponse = await fetch(fileUri);
  const fileBlob = await fileResponse.blob();
  const uploadResult = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": fileBlob.type || "application/octet-stream",
    },
    body: fileBlob,
  });

  if (!uploadResult.ok) {
    throw new Error("Failed to upload attendance evidence.");
  }

  const { storageId } = (await uploadResult.json()) as { storageId: string };
  await convexClient.mutation(api.files.registerUploadedFile, {
    storageId: storageId as never,
    fileClass,
  });

  return {
    storageId,
  };
}
