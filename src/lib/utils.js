import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({ extend: { theme: { text: ["2xs", "title"] } } });

export const cn = (...inputs) => twMerge(clsx(inputs));
