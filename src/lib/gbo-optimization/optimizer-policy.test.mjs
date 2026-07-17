import assert from "node:assert/strict";
import test from "node:test";

import {
  getAllowedOptimizerColumnModes,
  getCompatibleGoalForOptimizer,
  sanitizeRowModesForOptimizer,
} from "./optimizer-policy.ts";

test("Custom to Ally clears rule-based modes and SOV", () => {
  assert.deepEqual(
    sanitizeRowModesForOptimizer(
      { budget: "rule-based", bid: "rule-based" },
      "ally-ai",
    ),
    { budget: "none", bid: "none" },
  );
  assert.equal(getCompatibleGoalForOptimizer("sov", "ally-ai"), null);
});

test("Rule Based to Ally clears rule-based modes", () => {
  assert.deepEqual(
    sanitizeRowModesForOptimizer(
      { budget: "rule-based", bid: "rule-based" },
      "ally-ai",
    ),
    { budget: "none", bid: "none" },
  );
});

test("Ally to Rule Based clears Ally modes", () => {
  assert.deepEqual(
    sanitizeRowModesForOptimizer(
      { budget: "ally", bid: "ally" },
      "rule-based",
    ),
    { budget: "none", bid: "none" },
  );
});

test("Custom to Rule Based retains compatible rule-based modes", () => {
  assert.deepEqual(
    sanitizeRowModesForOptimizer(
      { budget: "ally", bid: "rule-based" },
      "rule-based",
    ),
    { budget: "none", bid: "rule-based" },
  );
});

test("Ally to Custom keeps existing values", () => {
  assert.deepEqual(
    sanitizeRowModesForOptimizer(
      { budget: "ally", bid: "none" },
      "custom",
    ),
    { budget: "ally", bid: "none" },
  );
});

test("Rule Based to Custom keeps existing values", () => {
  assert.deepEqual(
    sanitizeRowModesForOptimizer(
      { budget: "rule-based", bid: "none" },
      "custom",
    ),
    { budget: "rule-based", bid: "none" },
  );
});

test("Each portfolio optimizer exposes only its legal row modes", () => {
  assert.deepEqual(getAllowedOptimizerColumnModes("ally-ai"), ["ally", "none"]);
  assert.deepEqual(getAllowedOptimizerColumnModes("rule-based"), [
    "rule-based",
    "none",
  ]);
  assert.deepEqual(getAllowedOptimizerColumnModes("custom"), [
    "ally",
    "rule-based",
    "none",
  ]);
});
