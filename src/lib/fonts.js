import { Inter, Inter_Tight } from "next/font/google";

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const fontVariables = `${inter.variable} ${interTight.variable}`;
