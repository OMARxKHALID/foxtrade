import { vi } from "vitest";

// next/cache only works inside a Next request, and every suite stubs it the
// same way, so it lives here instead of in each file.
vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {}, updateTag: () => {} }));
