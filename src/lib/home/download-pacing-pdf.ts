/**
 * Opens the browser print dialog so the user can Save as PDF.
 * Targets the Pacing report root (#pacing-report-root).
 */
export function downloadPacingReportPdf() {
  if (typeof window === "undefined") return;

  const root = document.getElementById("pacing-report-root");
  if (!root) {
    window.print();
    return;
  }

  // Briefly expand collapsed accordion bodies for a complete PDF.
  const collapsed = root.querySelectorAll<HTMLElement>(
    "[data-pacing-accordion-body].hidden",
  );
  collapsed.forEach((el) => {
    el.classList.remove("hidden");
    el.dataset.wasCollapsed = "1";
  });

  document.body.classList.add("printing-pacing-report");
  const restore = () => {
    document.body.classList.remove("printing-pacing-report");
    root.querySelectorAll<HTMLElement>("[data-was-collapsed='1']").forEach((el) => {
      el.classList.add("hidden");
      delete el.dataset.wasCollapsed;
    });
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
