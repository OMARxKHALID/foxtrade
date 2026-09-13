import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP } from "better-auth/plugins";
import { DEMO_FAUCET_AMOUNT } from "@/lib/demo";
import { sendEmail } from "@/lib/email";
import { getEnv } from "@/lib/env";
import { postEntries, withTransaction } from "@/lib/ledger";
import { getDb, getMongoClient } from "@/lib/mongo";
import { site } from "@/lib/site";

const otpSubjects = {
  "sign-in": "Your sign-in code",
  "email-verification": "Verify your email",
  "forget-password": "Reset your password",
  "change-email": "Confirm your new email",
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
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60 },
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
