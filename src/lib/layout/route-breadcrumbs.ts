import type { BreadcrumbItem } from "@/components/layout/page-title-context";

/** Default breadcrumbs for routes that do not set their own via PageTitleProvider. */
export function getRouteBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname.startsWith("/explainability-dashboard")) {
    return [
      { label: "Home", href: "/" },
      { label: "Advertising" },
      { label: "Optimization", href: "/" },
      { label: "Alerts" },
    ];
  }

  if (pathname.startsWith("/chat")) {
    return [
      { label: "Home", href: "/" },
      { label: "Ask Ally" },
    ];
  }

  return [];
}
