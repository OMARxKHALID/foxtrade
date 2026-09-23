"use server";

import { headers } from "next/headers";
import { formFailure, signInRequired, validationFailure } from "@/lib/action-result";
import { reportError } from "@/lib/error-log";
import { serverFailure } from "@/lib/server-result";
import { getAuth } from "@/lib/auth";
import { DOCUMENT_MAX_BYTES, combinedSide, documentSides } from "@/lib/document-rules";
import { deletePrivateImages, detectDocumentFormat, isDocumentStorageConfigured, uploadPrivateImage } from "@/lib/document-storage";
import { collections } from "@/lib/mongo";
import { setPin } from "@/lib/pin";
import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { basicVerificationSchema, changePasswordSchema, withdrawalPinSchema } from "@/features/account/schemas/account-schema";

let verificationIndexReady;

const ensureVerificationIndex = () => {
  verificationIndexReady ??= collections
    .verifications()
    .createIndex({ userId: 1 }, { unique: true })
    .catch((error) => {
      verificationIndexReady = undefined;
      console.error("Could not create the unique verifications index:", error);
    });
  return verificationIndexReady;
};

export const submitBasicVerification = async (input) => {
  const parsed = basicVerificationSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser();
  if (!user) return signInRequired("Log in to submit verification.");
  try {
    const limit = await rateLimit(`kyc-submit:${user.id}`, { limit: 5, windowSeconds: 3600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    await ensureVerificationIndex();
    const existing = await collections.verifications().findOne({ userId: user.id });
    if (existing?.status === "approved") return formFailure("Your identity is already verified.");
    if (existing?.status === "pending") return formFailure("Your verification is already under review.");
    const submission = { $set: { ...parsed.data, userId: user.id, email: user.email, status: "pending", reason: null, submittedAt: new Date(), reviewedAt: null } };
    if (existing) {
      const updated = await collections.verifications().updateOne({ userId: user.id, status: { $nin: ["approved", "pending"] } }, submission);
      if (!updated.matchedCount) return formFailure("Your verification was just reviewed. Refresh the page.");
      return { ok: true };
    }
    const created = await collections
      .verifications()
      .updateOne({ userId: user.id }, submission, { upsert: true })
      .catch((error) => (error?.code === 11000 ? null : Promise.reject(error)));
    if (!created) return formFailure("Your verification was just submitted. Refresh the page.");
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

export const changePassword = async (input) => {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser();
  if (!user) return signInRequired("Log in to change your password.");
  try {
    const limit = await rateLimit(`password-change:${user.id}`, { limit: 5, windowSeconds: 900 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    await getAuth().api.changePassword({
      body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

export const setWithdrawalPin = async (input) => {
  const parsed = withdrawalPinSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser();
  if (!user) return signInRequired("Log in to set a withdrawal PIN.");
  try {
    const limit = await rateLimit(`pin-set:${user.id}`, { limit: 5, windowSeconds: 3600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    await setPin(user.id, parsed.data.pin);
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

export const signOutOtherDevices = async () => {
  const user = await getCurrentUser();
  if (!user) return signInRequired("Log in to manage your sessions.");
  try {
    const limit = await rateLimit(`sessions-revoke:${user.id}`, { limit: 5, windowSeconds: 900 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    await getAuth().api.revokeOtherSessions({ headers: await headers() });
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

const documentsLocked = (verification) => {
  if (verification?.status !== "approved") return "Basic verification must be approved first.";
  if (verification.documents?.status === "pending") return "Your documents are already under review.";
  if (verification.documents?.status === "approved") return "Your documents are already verified.";
  return null;
};

export const uploadVerificationDocument = async (formData) => {
  const user = await getCurrentUser();
  if (!user) return signInRequired("Log in to upload documents.");
  const side = formData.get("side");
  const file = formData.get("file");
  if (![...documentSides, combinedSide].some((item) => item.value === side)) return formFailure("Choose the front or back of your ID.");
  if (!file || typeof file.arrayBuffer !== "function" || !file.size) return formFailure("Choose a file to upload.");
  if (file.size > DOCUMENT_MAX_BYTES) return formFailure("Files must be 4 MB or smaller.");
  try {
    if (!isDocumentStorageConfigured()) return formFailure("Document upload is not available yet.");
    const limit = await rateLimit(`kyc-upload:${user.id}`, { limit: 20, windowSeconds: 3600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    const verification = await collections.verifications().findOne({ userId: user.id });
    const locked = documentsLocked(verification);
    if (locked) return formFailure(locked);
    const buffer = Buffer.from(await file.arrayBuffer());
    const format = detectDocumentFormat(buffer);
    if (!format) return formFailure("Upload a JPG, PNG or PDF file.");
    if (side === combinedSide.value && format !== "pdf") return formFailure("Upload one PDF that shows both sides of your ID.");
    const stored = await uploadPrivateImage(buffer, { folder: `kyc/${user.id}`, publicId: side });
    const targets = side === combinedSide.value ? documentSides.map((item) => item.value) : [side];
    const entry = { ...stored, uploadedAt: new Date() };
    await collections.verifications().updateOne(
      { userId: user.id },
      { $set: { ...Object.fromEntries(targets.map((target) => [`documents.${target}`, entry])), "documents.status": "draft", "documents.reason": null } },
    );
    const current = documentSides.map((item) => (targets.includes(item.value) ? stored.publicId : verification.documents?.[item.value]?.publicId));
    const stale = documentSides.map((item) => verification.documents?.[item.value]?.publicId).filter((publicId) => publicId && !current.includes(publicId));
    await deletePrivateImages(stale).catch((error) => reportError(error, { job: "deleteReplacedKycFiles", userId: user.id }));
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

export const submitVerificationDocuments = async () => {
  const user = await getCurrentUser();
  if (!user) return signInRequired("Log in to submit documents.");
  try {
    const verification = await collections.verifications().findOne({ userId: user.id });
    const locked = documentsLocked(verification);
    if (locked) return formFailure(locked);
    if (!verification.documents?.front || !verification.documents?.back) return formFailure("Upload both the front and back of your ID.");
    await collections.verifications().updateOne(
      { userId: user.id },
      { $set: { "documents.status": "pending", "documents.reason": null, "documents.submittedAt": new Date(), "documents.reviewedAt": null } },
    );
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};
