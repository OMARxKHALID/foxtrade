"use server";

import { headers } from "next/headers";
import { formFailure, serverFailure, signInRequired, validationFailure } from "@/lib/action-result";
import { getAuth } from "@/lib/auth";
import { DOCUMENT_MAX_BYTES, documentSides } from "@/lib/document-rules";
import { detectImageFormat, isDocumentStorageConfigured, uploadPrivateImage } from "@/lib/document-storage";
import { collections } from "@/lib/mongo";
import { setPin } from "@/lib/pin";
import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { basicVerificationSchema, changePasswordSchema, withdrawalPinSchema } from "@/features/account/schemas/account-schema";

export const submitBasicVerification = async (input) => {
  const parsed = basicVerificationSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser();
  if (!user) return signInRequired("Log in to submit verification.");
  try {
    const limit = await rateLimit(`kyc-submit:${user.id}`, { limit: 5, windowSeconds: 3600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    const existing = await collections.verifications().findOne({ userId: user.id });
    if (existing?.status === "approved") return formFailure("Your identity is already verified.");
    if (existing?.status === "pending") return formFailure("Your verification is already under review.");
    await collections.verifications().updateOne(
      { userId: user.id },
      { $set: { ...parsed.data, userId: user.id, email: user.email, status: "pending", reason: null, submittedAt: new Date(), reviewedAt: null } },
      { upsert: true },
    );
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
  if (!documentSides.some((item) => item.value === side)) return formFailure("Choose the front or back of your ID.");
  if (!file || typeof file.arrayBuffer !== "function" || !file.size) return formFailure("Choose an image to upload.");
  if (file.size > DOCUMENT_MAX_BYTES) return formFailure("Images must be 4 MB or smaller.");
  try {
    if (!isDocumentStorageConfigured()) return formFailure("Document upload is not available yet.");
    const limit = await rateLimit(`kyc-upload:${user.id}`, { limit: 20, windowSeconds: 3600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    const verification = await collections.verifications().findOne({ userId: user.id });
    const locked = documentsLocked(verification);
    if (locked) return formFailure(locked);
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!detectImageFormat(buffer)) return formFailure("Upload a JPG or PNG image.");
    const stored = await uploadPrivateImage(buffer, { folder: `kyc/${user.id}`, publicId: side });
    await collections.verifications().updateOne(
      { userId: user.id },
      { $set: { [`documents.${side}`]: { ...stored, uploadedAt: new Date() }, "documents.status": "draft", "documents.reason": null } },
    );
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
