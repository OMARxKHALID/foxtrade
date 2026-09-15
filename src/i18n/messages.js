import en from "../../messages/en.json";

const loaders = {
  en: async () => en,
  zh: async () => (await import("../../messages/zh.json")).default,
};

export const defaultLocale = "en";

export const defaultMessages = en;

export const resolveLocale = (value) => (loaders[value] ? value : defaultLocale);

export const loadMessages = (locale) => loaders[resolveLocale(locale)]();
