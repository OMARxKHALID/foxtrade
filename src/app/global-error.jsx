"use client";

import "./globals.css";

const GlobalError = ({ reset }) => (
  <html lang="en">
    <body className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-sm text-neutral-400">Please refresh the page or try again in a moment.</p>
        <button onClick={reset} className="h-10 rounded-md bg-brand px-5 text-sm font-semibold text-white">
          Try Again
        </button>
      </div>
    </body>
  </html>
);

export default GlobalError;
