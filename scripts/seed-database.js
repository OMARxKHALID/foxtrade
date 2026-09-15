import { getAuth } from "@/lib/auth";
import { getDb, getMongoClient } from "@/lib/mongo";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const accounts = [
  { email: required("SEED_ADMIN_EMAIL"), password: required("SEED_ADMIN_PASSWORD"), name: "Admin", role: "admin" },
  { email: required("SEED_CLIENT_EMAIL"), password: required("SEED_CLIENT_PASSWORD"), name: "Client", role: "user" },
];

const wipeDatabase = async () => {
  const existing = await getDb().collections();
  await Promise.all(existing.map((collection) => collection.drop()));
  return existing.map((collection) => collection.collectionName);
};

const createAccount = async (context, { email, password, name, role }) => {
  const user = await context.internalAdapter.createUser({ email, name, role, emailVerified: true });
  await context.internalAdapter.linkAccount({ userId: user.id, providerId: "credential", accountId: user.id, password: await context.password.hash(password) });
  return user;
};

const seed = async () => {
  const dropped = await wipeDatabase();
  console.info(`Dropped ${dropped.length} collections: ${dropped.join(", ") || "none"}`);
  const context = await getAuth().$context;
  for (const account of accounts) {
    const user = await createAccount(context, account);
    console.info(`Created ${account.role} ${user.email}`);
  }
};

try {
  await seed();
} finally {
  await getMongoClient().close();
}
