"use client";

import "./globals.css";
import { GradientButton } from "@/components/ui/gradient-button";
import { fontVariables } from "@/lib/fonts";

const GlobalError = ({ reset }) => (
  <html lang="en" className={`${fontVariables} antialiased`}>
    <body className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-neutral-400">Please refresh the page or try again in a moment.</p>
        <GradientButton onClick={reset}>Try Again</GradientButton>
      </div>
    </body>
  </html>
);

export default GlobalError;
