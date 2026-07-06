"use client";

import { usePathname } from "next/navigation";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isSetupFlow = pathname.startsWith("/gbo-optimization");

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {!isSetupFlow && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-20 size-72 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="absolute right-0 top-1/3 size-96 rounded-full bg-blue-200/30 blur-3xl" />
        </div>
      )}

      {!isSetupFlow && <SidebarNav />}

      <div className="relative flex min-w-0 flex-1 flex-col">
        {!isSetupFlow && <TopBar />}
        <main
          className={cn(
            "flex flex-1 flex-col",
            isSetupFlow ? "min-h-0 overflow-hidden p-0" : "overflow-y-auto p-6",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
