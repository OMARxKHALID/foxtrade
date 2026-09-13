import { MongoClient } from "mongodb";
import { getEnv } from "@/lib/env";

const globalForMongo = globalThis;

export const getMongoClient = () => {
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(getEnv().MONGODB_URI, { appName: "foxtrade" });
  }
  return globalForMongo.mongoClient;
};

export const getDb = () => getMongoClient().db();

export const collections = {
  users: () => getDb().collection("user"),
  sessions: () => getDb().collection("session"),
  wallets: () => getDb().collection("wallets"),
  ledger: () => getDb().collection("ledger"),
  orders: () => getDb().collection("orders"),
  positions: () => getDb().collection("positions"),
  pairs: () => getDb().collection("pairs"),
  notices: () => getDb().collection("notices"),
  banners: () => getDb().collection("banners"),
  tickets: () => getDb().collection("tickets"),
  verifications: () => getDb().collection("verifications"),
  addresses: () => getDb().collection("addresses"),
  audit: () => getDb().collection("audit"),
  security: () => getDb().collection("security"),
  rateLimits: () => getDb().collection("rate_limits"),
  settings: () => getDb().collection("settings"),
  profiles: () => getDb().collection("profiles"),
  follows: () => getDb().collection("follows"),
  pairSettings: () => getDb().collection("pair_settings"),
};
