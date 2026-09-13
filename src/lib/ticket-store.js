import "server-only";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/mongo";

let indexesReady;

const ensureIndexes = () => {
  indexesReady ??= Promise.all([
    collections.tickets().createIndex({ userId: 1, updatedAt: -1 }),
    collections.tickets().createIndex({ status: 1, updatedAt: -1 }),
  ]);
  return indexesReady;
};

const toId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

const summaryDTO = (doc) => ({
  id: doc._id.toString(),
  userId: doc.userId,
  email: doc.email,
  category: doc.category,
  subject: doc.subject,
  status: doc.status,
  messageCount: doc.messages.length,
  lastFrom: doc.messages.at(-1)?.from ?? "client",
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const detailDTO = (doc) => ({
  ...summaryDTO(doc),
  messages: doc.messages.map((message, index) => ({
    id: `${doc._id.toString()}-${index}`,
    from: message.from,
    author: message.author,
    body: message.body,
    at: message.at.toISOString(),
  })),
});

export const createTicket = async (user, { category, subject, message }) => {
  await ensureIndexes();
  const now = new Date();
  const { insertedId } = await collections.tickets().insertOne({
    userId: user.id,
    email: user.email,
    category,
    subject,
    status: "open",
    messages: [{ from: "client", author: user.email, body: message, at: now }],
    createdAt: now,
    updatedAt: now,
  });
  return insertedId.toString();
};

export const countOpenTickets = async (userId) => collections.tickets().countDocuments({ userId, status: { $ne: "closed" } });

export const listUserTickets = async (userId) => {
  await ensureIndexes();
  return (await collections.tickets().find({ userId }).sort({ updatedAt: -1 }).limit(100).toArray()).map(summaryDTO);
};

export const getUserTicket = async (userId, id) => {
  const _id = toId(id);
  if (!_id) return null;
  const doc = await collections.tickets().findOne({ _id, userId });
  return doc ? detailDTO(doc) : null;
};

export const listAllTickets = async () => {
  await ensureIndexes();
  return (await collections.tickets().find().sort({ updatedAt: -1 }).limit(1000).toArray()).map(summaryDTO);
};

export const getTicket = async (id) => {
  const _id = toId(id);
  if (!_id) return null;
  const doc = await collections.tickets().findOne({ _id });
  return doc ? detailDTO(doc) : null;
};

export const addTicketMessage = async ({ id, userId, from, author, body }) => {
  const _id = toId(id);
  if (!_id) return null;
  const now = new Date();
  const filter = { _id, ...(userId ? { userId } : {}), status: { $ne: "closed" } };
  return collections.tickets().findOneAndUpdate(
    filter,
    { $push: { messages: { from, author, body, at: now } }, $set: { status: from === "admin" ? "answered" : "open", updatedAt: now } },
    { returnDocument: "after" },
  );
};

export const setTicketStatus = async ({ id, userId, status }) => {
  const _id = toId(id);
  if (!_id) return null;
  return collections.tickets().findOneAndUpdate({ _id, ...(userId ? { userId } : {}) }, { $set: { status, updatedAt: new Date() } }, { returnDocument: "after" });
};
