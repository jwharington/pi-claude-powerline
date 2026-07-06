import assert from "node:assert/strict";
import test from "node:test";

import { formatSessionUsageText } from "../index.ts";

const usage = {
  input: 1200,
  output: 3400,
  cacheRead: 0,
  cacheWrite: 0,
  sessionCost: 1.23,
};

test("shows session cost in the session segment by default", () => {
  const result = formatSessionUsageText(usage, 80);

  assert.equal(result.includes("$1.23"), true);
});

test("can hide session cost in the session segment", () => {
  const result = formatSessionUsageText(usage, 80, false);

  assert.equal(result.includes("$"), false);
  assert.equal(result.startsWith("§ "), true);
});

test("keeps session cost hidden even when the session segment is tight", () => {
  const result = formatSessionUsageText(usage, 8, false);

  assert.equal(result.includes("$"), false);
});
