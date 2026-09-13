import "server-only";
import { ObjectId } from "mongodb";
import { banners as defaultBanners } from "@/lib/content/banners";
import { notices as defaultNotices } from "@/lib/content/notices";
import { collections } from "@/lib/mongo";

const configured = () => Boolean(process.env.MONGODB_URI);

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "notice";

const seedOnce = async (key, seed) => {
  const claimed = await collections
    .settings()
    .updateOne({ _id: `seeded:${key}` }, { $setOnInsert: { at: new Date() } }, { upsert: true });
  if (claimed.upsertedCount) await seed();
};

const ensureNotices = () =>
  seedOnce("notices", async () => {
    await collections.notices().createIndex({ slug: 1 }, { unique: true });
    await collections.notices().insertMany(
      defaultNotices.map((notice) => ({
        slug: notice.id,
        title: notice.title,
        category: notice.category,
        summary: notice.summary,
        body: notice.body,
        published: true,
        publishedAt: new Date(notice.date),
        createdAt: new Date(notice.date),
        updatedAt: new Date(notice.date),
      })),
    );
  });

const ensureBanners = () =>
  seedOnce("banners", () =>
    collections.banners().insertMany(
      defaultBanners.map((banner, order) => ({
        eyebrow: banner.eyebrow,
        title: banner.title,
        text: banner.text,
        ctaLabel: banner.cta.label,
        ctaHref: banner.cta.href,
        active: true,
        order,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    ),
  );

const noticeDTO = (doc) => ({
  id: doc._id.toString(),
  slug: doc.slug,
  title: doc.title,
  category: doc.category,
  summary: doc.summary,
  body: doc.body,
  published: doc.published,
  date: (doc.publishedAt ?? doc.createdAt).toISOString(),
});

const bannerDTO = (doc) => ({
  id: doc._id.toString(),
  eyebrow: doc.eyebrow,
  title: doc.title,
  text: doc.text,
  cta: { label: doc.ctaLabel, href: doc.ctaHref },
  active: doc.active,
  order: doc.order,
});

const fallbackNotices = () => defaultNotices.map((notice) => ({ ...notice, slug: notice.id, published: true }));

const fallbackBanners = () => defaultBanners.map((banner, order) => ({ ...banner, active: true, order }));

export const getPublishedNotices = async () => {
  if (!configured()) return fallbackNotices();
  await ensureNotices();
  const docs = await collections.notices().find({ published: true }).sort({ publishedAt: -1 }).limit(100).toArray();
  return docs.map(noticeDTO);
};

export const getNoticeBySlug = async (slug) => {
  if (!configured()) return fallbackNotices().find((notice) => notice.slug === slug) ?? null;
  await ensureNotices();
  const doc = await collections.notices().findOne({ slug: String(slug), published: true });
  return doc ? noticeDTO(doc) : null;
};

export const getActiveBanners = async () => {
  if (!configured()) return fallbackBanners();
  await ensureBanners();
  const docs = await collections.banners().find({ active: true }).sort({ order: 1, createdAt: 1 }).toArray();
  return docs.map(bannerDTO);
};

export const listAllNotices = async () => {
  await ensureNotices();
  return (await collections.notices().find().sort({ createdAt: -1 }).toArray()).map(noticeDTO);
};

export const listAllBanners = async () => {
  await ensureBanners();
  return (await collections.banners().find().sort({ order: 1, createdAt: 1 }).toArray()).map(bannerDTO);
};

const uniqueSlug = async (title, excludeId) => {
  const base = slugify(title);
  let slug = base;
  for (let i = 2; await collections.notices().findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }); i += 1) slug = `${base}-${i}`;
  return slug;
};

const paragraphs = (body) => body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

export const saveNotice = async ({ id, title, category, summary, body, published }) => {
  await ensureNotices();
  const now = new Date();
  const _id = id ? new ObjectId(id) : null;
  const fields = { title, category, summary, body: paragraphs(body), published, updatedAt: now };
  if (!_id) {
    const doc = { ...fields, slug: await uniqueSlug(title), createdAt: now, publishedAt: published ? now : null };
    const { insertedId } = await collections.notices().insertOne(doc);
    return noticeDTO({ ...doc, _id: insertedId });
  }
  const current = await collections.notices().findOne({ _id });
  if (!current) return null;
  const updated = await collections
    .notices()
    .findOneAndUpdate({ _id }, { $set: { ...fields, publishedAt: published ? current.publishedAt ?? now : current.publishedAt } }, { returnDocument: "after" });
  return noticeDTO(updated);
};

export const deleteNotice = async (id) => collections.notices().findOneAndDelete({ _id: new ObjectId(id) });

export const saveBanner = async ({ id, eyebrow, title, text, ctaLabel, ctaHref, active, order }) => {
  await ensureBanners();
  const now = new Date();
  const fields = { eyebrow, title, text, ctaLabel, ctaHref, active, order, updatedAt: now };
  if (!id) {
    const { insertedId } = await collections.banners().insertOne({ ...fields, createdAt: now });
    return bannerDTO({ ...fields, _id: insertedId });
  }
  const updated = await collections.banners().findOneAndUpdate({ _id: new ObjectId(id) }, { $set: fields }, { returnDocument: "after" });
  return updated ? bannerDTO(updated) : null;
};

export const deleteBanner = async (id) => collections.banners().findOneAndDelete({ _id: new ObjectId(id) });
