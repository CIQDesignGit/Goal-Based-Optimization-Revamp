export type ParsedChangeClaim = {
  entityName: string;
  field: string;
  before: string | null;
  after: string | null;
};

/**
 * Parse manual change claim strings produced by formatValueChangeClaim.
 * e.g. "Bid optimization for JBC Fresh: None → Ally AI"
 */
export function parseChangeClaim(claim: string): ParsedChangeClaim | null {
  const arrowMatch = claim.match(/^(.+?) for (.+?): (.+?) → (.+)$/);
  if (arrowMatch) {
    return {
      field: arrowMatch[1].trim(),
      entityName: arrowMatch[2].trim(),
      before: arrowMatch[3].trim(),
      after: arrowMatch[4].trim(),
    };
  }

  const setToMatch = claim.match(/^(.+?) for (.+?): set to (.+)$/i);
  if (setToMatch) {
    return {
      field: setToMatch[1].trim(),
      entityName: setToMatch[2].trim(),
      before: null,
      after: setToMatch[3].trim(),
    };
  }

  const clearedMatch = claim.match(/^(.+?) for (.+?): cleared from (.+)$/i);
  if (clearedMatch) {
    return {
      field: clearedMatch[1].trim(),
      entityName: clearedMatch[2].trim(),
      before: clearedMatch[3].trim(),
      after: null,
    };
  }

  return null;
}
