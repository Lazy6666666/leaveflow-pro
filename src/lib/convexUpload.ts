import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import type { StorageId } from "@/lib/convexTypes";

export async function uploadFileToConvex(file: Blob) {
  const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});
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
  return { storageId: storageId as StorageId };
}
