/** Shared layout tokens for expanded alert detail rows — keeps columns content-sized on wide screens. */

/**
 * Parent list grid — field column grows to widest badge; before/after columns align across rows.
 * entity | field | before | → | after | trailing
 */
export const detailChangeRowList =
  "divide-y divide-slate-100 sm:grid sm:grid-cols-[minmax(0,8.5rem)_auto_minmax(0,5rem)_1.25rem_minmax(0,6rem)_auto] sm:gap-x-4 sm:px-4";

/** Row item participating in the parent subgrid (6 columns). */
export const detailChangeRowItem =
  "py-2.5 sm:grid sm:grid-cols-subgrid sm:col-span-6 sm:items-center";

/** Row contents — `sm:contents` so cells join the parent subgrid on desktop. */
export const detailChangeRowGrid =
  "grid grid-cols-1 gap-x-4 gap-y-2 px-4 py-2.5 sm:contents sm:px-0 sm:py-0";

/** Override comparison — previous → in effect, clustered not stretched. */
export const detailOverrideCompare =
  "mt-3 w-fit max-w-full flex flex-col gap-8 sm:flex-row sm:items-start";
