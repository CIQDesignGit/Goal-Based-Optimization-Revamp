import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { TopBar } from "@/components/layout/top-bar";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GBO Revamp",
  description: "Internal dashboard for GBO operations and workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider>
          <div className="relative flex h-screen overflow-hidden bg-background">
            {/* Decorative background blobs */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -left-24 top-20 size-72 rounded-full bg-rose-200/40 blur-3xl" />
              <div className="absolute right-0 top-1/3 size-96 rounded-full bg-violet-200/30 blur-3xl" />
            </div>

            <div className="relative flex min-w-0 flex-1 flex-col">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
