/** Shared layout tokens for expanded alert detail rows — keeps columns content-sized on wide screens. */

/** Entity + field columns use fixed widths so value changes align vertically across rows. */
export const detailChangeRowGrid =
  "grid grid-cols-1 gap-x-4 gap-y-2 px-4 py-2.5 sm:grid-cols-[minmax(0,8.5rem)_minmax(0,9.5rem)_auto] sm:items-center";

/** Override comparison — previous → in effect, clustered not stretched. */
export const detailOverrideCompare =
  "mt-3 w-fit max-w-full flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8";
