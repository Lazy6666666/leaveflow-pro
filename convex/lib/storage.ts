import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { StorageId, StorageFileDoc } from "./types";
import type { StorageFileClass } from "../constants";
import { now } from "./auth";

type ReadCtx = QueryCtx | MutationCtx;

export async function getStorageFileRecord(ctx: ReadCtx, storageId: StorageId): Promise<StorageFileDoc | null> {
  return await ctx.db.query("storageFiles").withIndex("by_storageId", (q) => q.eq("storageId", storageId)).unique();
}

export async function assertStorageFileOwnership(
  ctx: ReadCtx,
  input: {
    storageId: StorageId;
    ownerUserId: string;
    expectedClass: StorageFileClass;
  },
) {
  const storageFile = await getStorageFileRecord(ctx, input.storageId);
  if (!storageFile) {
    throw new Error("Uploaded file metadata was not found");
  }

  if (storageFile.ownerUserId !== input.ownerUserId || storageFile.fileClass !== input.expectedClass) {
    throw new Error("Forbidden");
  }

  return storageFile;
}

export async function linkStorageFile(
  ctx: MutationCtx,
  input: {
    storageId: StorageId;
    ownerUserId: string;
    expectedClass: StorageFileClass;
    linkedTable: string;
    linkedRecordId: string;
  },
) {
  const storageFile = await assertStorageFileOwnership(ctx, input);
  const nextState = {
    linkedTable: input.linkedTable,
    linkedRecordId: input.linkedRecordId,
    linkedAt: storageFile.linkedAt ?? now(),
    updatedAt: now(),
  };

  if (
    storageFile.linkedTable === nextState.linkedTable &&
    storageFile.linkedRecordId === nextState.linkedRecordId
  ) {
    return storageFile;
  }

  await ctx.db.patch(storageFile._id, nextState);
  return {
    ...storageFile,
    ...nextState,
  };
}
