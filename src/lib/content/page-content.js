import { contentByKey } from "@/lib/content/content-registry";
import { readSetting, writeSetting } from "@/lib/settings-store";

const settingKey = (key) => `content:${key}`;

const normalizeContent = (key, value) => {
  const defaults = contentByKey[key].defaults;
  const sections = Array.isArray(value?.sections)
    ? value.sections
        .map((section) => ({ heading: String(section?.heading ?? "").trim().slice(0, 200), body: String(section?.body ?? "").trim().slice(0, 4000) }))
        .filter((section) => section.heading && section.body)
    : [];
  return {
    title: String(value?.title ?? "").trim().slice(0, 120) || defaults.title,
    summary: String(value?.summary ?? "").trim().slice(0, 600),
    sections: sections.length ? sections : defaults.sections,
    updatedAt: value?.updatedAt ?? null,
  };
};

export const readContent = async (key) => {
  if (!contentByKey[key]) return null;
  const stored = await readSetting(settingKey(key));
  return stored ? normalizeContent(key, stored) : { ...contentByKey[key].defaults, updatedAt: null };
};

export const writeContent = async (key, value) => writeSetting(settingKey(key), { ...normalizeContent(key, value), updatedAt: new Date().toISOString() });

export const resetContent = async (key) => writeSetting(settingKey(key), null);
