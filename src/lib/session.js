import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

const isBackendConfigured = () => Boolean(process.env.MONGODB_URI && process.env.BETTER_AUTH_SECRET);

export const getSession = cache(async () => {
  if (!isBackendConfigured()) return null;
  await connection();
  return getAuth().api.getSession({ headers: await headers() });
});

export const getCurrentUser = async () => (await getSession())?.user ?? null;

export const isAdmin = (user) => user?.role === "admin";

export const toUserDTO = (user) =>
  user ? { id: user.id, email: user.email, name: user.name, role: isAdmin(user) ? "admin" : "client", createdAt: new Date(user.createdAt).toISOString() } : null;

export const requireUser = async (next = "/") => {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
};

export const requireAdmin = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin(user)) redirect("/");
  return user;
};
