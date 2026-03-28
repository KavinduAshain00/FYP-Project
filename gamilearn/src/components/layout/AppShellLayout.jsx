import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ShellPagesCacheProvider } from "../../context/ShellPagesCacheProvider";
import AppSidebar from "./AppSidebar";
import PageTransition from "../PageTransition";

/**
 * Persistent app chrome: sidebar stays mounted; only the main pane transitions.
 */
export default function AppShellLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-neutral-900 text-blue-100">
      <AppSidebar />
      <main className="min-h-screen lg:pl-64 transition-[padding] duration-300 ease-out">
        <ShellPagesCacheProvider>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </ShellPagesCacheProvider>
      </main>
    </div>
  );
}
