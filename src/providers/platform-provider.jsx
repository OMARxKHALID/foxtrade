"use client";

import { createContext } from "react";

export const PlatformContext = createContext(null);

export const PlatformProvider = ({ settings, pairs, children }) => <PlatformContext value={{ settings, pairs }}>{children}</PlatformContext>;
