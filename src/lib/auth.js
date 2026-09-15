import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP } from "better-auth/plugins";
import { ObjectId } from "mongodb";
import { DEMO_FAUCET_AMOUNT } from "@/lib/demo";
import { sendEmail } from "@/lib/email";
import { getEnv } from "@/lib/env";
import { postEntries, withTransaction } from "@/lib/ledger";
import { collections, getDb, getMongoClient } from "@/lib/mongo";
import { site } from "@/lib/site";
import { passwordSchema } from "@/features/auth/schemas/auth-schema";

const otpSubjects = {
  "sign-in": "Your sign-in code",
  "email-verification": "Verify your email",
  "forget-password": "Reset your password",
  "change-email": "Confirm your new email",
};

const passwordFields = {
  "/sign-up/email": "password",
  "/email-otp/reset-password": "password",
  "/reset-password": "newPassword",
  "/change-password": "newPassword",
};

const authRateRules = {
  "/sign-in/email": { window: 900, max: 10 },
  "/sign-up/email": { window: 3600, max: 5 },
  "/sign-in/email-otp": { window: 900, max: 6 },
  "/email-otp/send-verification-otp": { window: 900, max: 5 },
  "/email-otp/request-password-reset": { window: 900, max: 5 },
  "/forget-password/email-otp": { window: 900, max: 5 },
  "/email-otp/reset-password": { window: 900, max: 6 },
};

const promoteConfiguredAdmin = async (userId) => {
  const email = getEnv().ADMIN_EMAIL?.toLowerCase();
  if (!email || !ObjectId.isValid(userId)) return;
  await collections.users().updateOne({ _id: new ObjectId(userId), email, emailVerified: true, role: { $ne: "admin" } }, { $set: { role: "admin" } });
};

const createAuth = () => {
  const env = getEnv();
  return betterAuth({
    appName: site.name,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(getDb(), { client: getMongoClient() }),
    emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60, customRules: authRateRules },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const field = passwordFields[ctx.path];
        if (!field) return;
        const result = passwordSchema.safeParse(ctx.body?.[field]);
        if (!result.success) throw new APIError("BAD_REQUEST", { message: result.error.issues[0].message });
      }),
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await withTransaction((session) =>
              postEntries([{ userId: user.id, wallet: "spot", asset: "USDT", type: "faucet", amount: DEMO_FAUCET_AMOUNT, note: "Welcome demo funds" }], session),
            );
          },
        },
      },
      session: {
        create: {
          after: async (session) => {
            await promoteConfiguredAdmin(session.userId);
          },
        },
      },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        sendVerificationOTP: async ({ email, otp, type }) => {
          await sendEmail({
            to: email,
            subject: `${otpSubjects[type] ?? "Your code"} · ${site.name}`,
            text: `Your ${site.name} code is ${otp}. It expires in 10 minutes. If you did not request it, ignore this email.`,
          });
        },
      }),
      admin({ defaultRole: "user", adminRoles: ["admin"] }),
      nextCookies(),
    ],
  });
};

export const getAuth = () => {
  globalThis.foxtradeAuth ??= createAuth();
  return globalThis.foxtradeAuth;
};
