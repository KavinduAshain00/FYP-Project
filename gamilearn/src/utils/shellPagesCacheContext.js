import { createContext, useContext } from "react";

export const ShellPagesCacheContext = createContext(null);

export function useShellPagesCache() {
  const ctx = useContext(ShellPagesCacheContext);
  if (!ctx) {
    throw new Error(
      "useShellPagesCache must be used inside ShellPagesCacheProvider",
    );
  }
  return ctx;
}
