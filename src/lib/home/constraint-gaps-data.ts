import type { ConstraintAlert } from "@/lib/home/pacing-instance";

type ConstraintSeed = Omit<
  ConstraintAlert,
  "deviationPoints" | "deviationRelativePercent"
>;

function buildConstraint(seed: ConstraintSeed): ConstraintAlert {
  const deviationPoints = Math.abs(
    seed.constraintPercent - seed.spendSharePercent,
  );
  const deviationRelativePercent = Math.abs(
    ((seed.spendSharePercent - seed.constraintPercent) / seed.constraintPercent) *
      100,
  );

  return {
    ...seed,
    deviationPoints,
    deviationRelativePercent,
  };
}

/**
 * Mock constraint gaps for Section B — 25 items so the Pacing tab can show
 * four upfront and expand to the full set.
 */
export const CONSTRAINT_GAPS: ConstraintAlert[] = [
  buildConstraint({
    id: "c-competitor",
    alert: "High Deviation",
    level1: "Pilgrims Core",
    level2: "None",
    group: "Targeting Type",
    constraintType: "Competitor",
    constraintPercent: 30,
    spendSharePercent: 10.7,
    plainLanguage:
      "At the Pilgrims Core level, the Targeting Type constraint for Competitor is set at 30%, but observed spend share is only 10.7% (gap 19.3 points). This under-delivery can leave competitor conquest volume on the table while Generic absorbs excess share.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-generic",
    alert: "High Deviation",
    level1: "Pilgrims Core",
    level2: "None",
    group: "Targeting Type",
    constraintType: "Generic",
    constraintPercent: 70,
    spendSharePercent: 89.3,
    plainLanguage:
      "At the same level, the Targeting Type constraint for Generic is set at 70%, while actual spend share is 89.3% (19.3 points over). Because Generic is already above 60 (set at 70), no additional generic-share increase is advisable right now.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-sb-share",
    alert: "High Deviation",
    level1: "JBC Fresh",
    level2: "Sponsored Brands",
    group: "Campaign Type",
    constraintType: "Sponsored Brands",
    constraintPercent: 30,
    spendSharePercent: 8.4,
    plainLanguage:
      "For JBC Fresh – Sponsored Brands, the campaign-type constraint is set at 30% share, but actual SB spend share is only 8.4% (deviation 21.6 points, 72% relative). This large gap can cause underpacing as GBO repeatedly tries to push more budget into SB than the structure supports.",
    brandId: "jbc-fresh",
  }),
  buildConstraint({
    id: "c-branded",
    alert: "High Deviation",
    level1: "Pilgrims Core",
    level2: "Sponsored Products",
    group: "Targeting Type",
    constraintType: "Branded",
    constraintPercent: 45,
    spendSharePercent: 28.2,
    plainLanguage:
      "Branded targeting on Pilgrims Core SP is capped at 45% but only 28.2% of spend is branded. GBO may be unable to defend branded search terms without relaxing this cap.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-auto",
    alert: "Moderate Deviation",
    level1: "JBC Fresh",
    level2: "None",
    group: "Targeting Type",
    constraintType: "Auto",
    constraintPercent: 25,
    spendSharePercent: 38.6,
    plainLanguage:
      "Auto targeting share on JBC Fresh is 13.6 points above the 25% ceiling. Excess auto share can dilute efficiency on manually curated keyword sets.",
    brandId: "jbc-fresh",
  }),
  buildConstraint({
    id: "c-sp-share",
    alert: "High Deviation",
    level1: "JBC Fresh",
    level2: "Sponsored Products",
    group: "Campaign Type",
    constraintType: "Sponsored Products",
    constraintPercent: 55,
    spendSharePercent: 71.4,
    plainLanguage:
      "JBC Fresh SP spend share is 71.4% vs a 55% campaign-type target — 16.4 points over. SB campaigns remain starved while SP absorbs the portfolio delta.",
    brandId: "jbc-fresh",
  }),
  buildConstraint({
    id: "c-sd-share",
    alert: "Moderate Deviation",
    level1: "Pilgrims Core",
    level2: "None",
    group: "Campaign Type",
    constraintType: "Sponsored Display",
    constraintPercent: 15,
    spendSharePercent: 4.1,
    plainLanguage:
      "Sponsored Display is configured for up to 15% share but only receives 4.1%. Retargeting and awareness placements are under-utilized relative to plan.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-tos",
    alert: "High Deviation",
    level1: "Pilgrims Core",
    level2: "Sponsored Products",
    group: "Placement",
    constraintType: "Top of Search",
    constraintPercent: 40,
    spendSharePercent: 22.8,
    plainLanguage:
      "Top of Search placement is targeted at 40% but actual share is 22.8%. High-intent shelf visibility is below the configured mix.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-rest-of-search",
    alert: "Moderate Deviation",
    level1: "Pilgrims Core",
    level2: "Sponsored Products",
    group: "Placement",
    constraintType: "Rest of Search",
    constraintPercent: 35,
    spendSharePercent: 48.9,
    plainLanguage:
      "Rest of Search absorbs 48.9% vs a 35% cap — 13.9 points over. Lower-funnel placements are overweight relative to the Top of Search gap.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-product-pages",
    alert: "Moderate Deviation",
    level1: "JBC Fresh",
    level2: "Sponsored Products",
    group: "Placement",
    constraintType: "Product Pages",
    constraintPercent: 20,
    spendSharePercent: 11.3,
    plainLanguage:
      "Product Pages placement share is 11.3% vs a 20% floor. Detail-page conquest is under-indexed for JBC Fresh SP.",
    brandId: "jbc-fresh",
  }),
  buildConstraint({
    id: "c-exact-match",
    alert: "High Deviation",
    level1: "Pilgrims Core",
    level2: "Sponsored Brands",
    group: "Keyword Match",
    constraintType: "Exact Match",
    constraintPercent: 50,
    spendSharePercent: 31.5,
    plainLanguage:
      "Exact match keywords are capped at 50% share but only 31.5% of SB spend is exact. Branded defense may be under-weighted on high-intent queries.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-phrase-match",
    alert: "Moderate Deviation",
    level1: "Pilgrims Core",
    level2: "Sponsored Brands",
    group: "Keyword Match",
    constraintType: "Phrase Match",
    constraintPercent: 30,
    spendSharePercent: 42.7,
    plainLanguage:
      "Phrase match spend is 12.7 points above the 30% target on Pilgrims Core SB — broadening match types without lifting exact share.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-broad-match",
    alert: "High Deviation",
    level1: "JBC Fresh",
    level2: "Sponsored Products",
    group: "Keyword Match",
    constraintType: "Broad Match",
    constraintPercent: 15,
    spendSharePercent: 27.4,
    plainLanguage:
      "Broad match exceeds its 15% cap by 12.4 points on JBC Fresh SP. Discovery spend may be crowding out tighter match types.",
    brandId: "jbc-fresh",
  }),
  buildConstraint({
    id: "c-video",
    alert: "Moderate Deviation",
    level1: "JBC Fresh",
    level2: "Sponsored Brands",
    group: "Ad Format",
    constraintType: "Video",
    constraintPercent: 20,
    spendSharePercent: 6.8,
    plainLanguage:
      "Video ad format share is 6.8% vs a 20% target on JBC Fresh SB. Video inventory is materially under-pacing vs plan.",
    brandId: "jbc-fresh",
  }),
  buildConstraint({
    id: "c-store-spotlight",
    alert: "Moderate Deviation",
    level1: "Pilgrims Core",
    level2: "Sponsored Brands",
    group: "Ad Format",
    constraintType: "Store Spotlight",
    constraintPercent: 25,
    spendSharePercent: 38.2,
    plainLanguage:
      "Store Spotlight formats are 13.2 points over the 25% share target. Brand-store traffic is overweight vs product-focused SB units.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-new-to-brand",
    alert: "High Deviation",
    level1: "Entire business",
    level2: "None",
    group: "Audience",
    constraintType: "New to Brand",
    constraintPercent: 35,
    spendSharePercent: 19.6,
    plainLanguage:
      "Account-level New-to-Brand audience share is 19.6% vs a 35% goal. Prospecting volume is below the configured acquisition mix.",
    brandId: "all",
  }),
  buildConstraint({
    id: "c-loyal",
    alert: "Moderate Deviation",
    level1: "Entire business",
    level2: "None",
    group: "Audience",
    constraintType: "Loyal",
    constraintPercent: 40,
    spendSharePercent: 52.3,
    plainLanguage:
      "Loyal audience spend is 12.3 points above the 40% ceiling at account level. Retention spend may be crowding prospecting.",
    brandId: "all",
  }),
  buildConstraint({
    id: "c-subscribe-save",
    alert: "Moderate Deviation",
    level1: "Pilgrims Core",
    level2: "Sponsored Products",
    group: "Promo Type",
    constraintType: "Subscribe & Save",
    constraintPercent: 18,
    spendSharePercent: 9.4,
    plainLanguage:
      "Subscribe & Save promo share is 9.4% vs an 18% target on Pilgrims Core SP. Recurring-revenue placements are under-indexed.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-coupon",
    alert: "High Deviation",
    level1: "JBC Fresh",
    level2: "Sponsored Products",
    group: "Promo Type",
    constraintType: "Coupon",
    constraintPercent: 12,
    spendSharePercent: 21.8,
    plainLanguage:
      "Coupon-attributed spend is 9.8 points above the 12% cap on JBC Fresh SP. Promotional efficiency should be monitored if the gap persists.",
    brandId: "jbc-fresh",
  }),
  buildConstraint({
    id: "c-lightning-deal",
    alert: "Moderate Deviation",
    level1: "Pilgrims Core",
    level2: "None",
    group: "Promo Type",
    constraintType: "Lightning Deal",
    constraintPercent: 10,
    spendSharePercent: 3.2,
    plainLanguage:
      "Lightning Deal placements receive 3.2% share vs a 10% target. Event-day burst spend is below the configured promo mix.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-daypart-morning",
    alert: "Moderate Deviation",
    level1: "JBC Fresh",
    level2: "None",
    group: "Day Parting",
    constraintType: "Morning (6am–12pm)",
    constraintPercent: 30,
    spendSharePercent: 18.5,
    plainLanguage:
      "Morning day-part share is 18.5% vs a 30% target on JBC Fresh. Breakfast and early-shopper windows are under-weighted.",
    brandId: "jbc-fresh",
  }),
  buildConstraint({
    id: "c-daypart-evening",
    alert: "High Deviation",
    level1: "Pilgrims Core",
    level2: "None",
    group: "Day Parting",
    constraintType: "Evening (6pm–12am)",
    constraintPercent: 35,
    spendSharePercent: 51.2,
    plainLanguage:
      "Evening day-part absorbs 51.2% vs a 35% cap — 16.2 points over. Prime-time spend may be starving midday inventory.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-category-chicken",
    alert: "Moderate Deviation",
    level1: "Pilgrims Core",
    level2: "None",
    group: "Category",
    constraintType: "Fresh Chicken",
    constraintPercent: 28,
    spendSharePercent: 17.1,
    plainLanguage:
      "Fresh Chicken category share is 17.1% vs a 28% target. Core protein SKUs are under-pacing relative to the category plan.",
    brandId: "pilgrims-core",
  }),
  buildConstraint({
    id: "c-category-prepared",
    alert: "High Deviation",
    level1: "JBC Fresh",
    level2: "None",
    group: "Category",
    constraintType: "Prepared Meals",
    constraintPercent: 22,
    spendSharePercent: 34.6,
    plainLanguage:
      "Prepared Meals category spend is 12.6 points above the 22% ceiling on JBC Fresh. Ready-to-eat SKUs are overweight vs plan.",
    brandId: "jbc-fresh",
  }),
  buildConstraint({
    id: "c-region-west",
    alert: "Moderate Deviation",
    level1: "Entire business",
    level2: "None",
    group: "Region",
    constraintType: "West",
    constraintPercent: 25,
    spendSharePercent: 14.8,
    plainLanguage:
      "West region delivery share is 14.8% vs a 25% target at account level. Geographic pacing is uneven vs the national mix plan.",
    brandId: "all",
  }),
];
