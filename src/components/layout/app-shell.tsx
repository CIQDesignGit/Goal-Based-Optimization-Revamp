"use client";

import { usePathname } from "next/navigation";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PageTitleProvider } from "@/components/layout/page-title-context";
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
      {!isSetupFlow && <SidebarNav />}

      <div className="relative flex min-w-0 flex-1 flex-col">
        {!isSetupFlow ? (
          <PageTitleProvider>
            <TopBar />
            <main
              className={cn(
                "flex flex-1 flex-col",
                isSetupFlow ? "min-h-0 overflow-hidden p-0" : "overflow-y-auto p-6",
              )}
            >
              {children}
            </main>
          </PageTitleProvider>
        ) : (
          <main
            className={cn(
              "flex flex-1 flex-col",
              isSetupFlow ? "min-h-0 overflow-hidden p-0" : "overflow-y-auto p-6",
            )}
          >
            {children}
          </main>
        )}
      </div>
    </div>
  );
}
