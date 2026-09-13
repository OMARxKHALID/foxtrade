"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppToaster } from "@/components/ui/app-toaster";
import { getQueryClient } from "@/lib/query-client";
import { usePreferencesStore } from "@/store/use-preferences-store";

export const AppProviders = ({ children }) => {
  const queryClient = getQueryClient();

  useEffect(() => {
    usePreferencesStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AppToaster />
    </QueryClientProvider>
  );
};
