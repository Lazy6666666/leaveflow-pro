import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import type { StorageId } from "@/lib/convexTypes";

export async function uploadFileToConvex(
  file: Blob,
  fileClass: "avatar" | "leave_attachment" | "attendance_selfie" | "policy_document",
) {
  const uploadUrl = await convex.mutation(api.files.generateUploadUrl, { fileClass });
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!result.ok) {
    throw new Error("Failed to upload file");
  }

  const { storageId } = await result.json() as { storageId: string };
  await convex.mutation(api.files.registerUploadedFile, {
    storageId: storageId as StorageId,
    fileClass,
  });
  return { storageId: storageId as StorageId };
}
