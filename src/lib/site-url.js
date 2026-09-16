export const siteUrl = () => (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const absoluteUrl = (path = "/") => `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
