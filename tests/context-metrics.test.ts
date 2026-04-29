import assert from "node:assert/strict";
import test from "node:test";

import { calculateSystemPromptRatio, describeSystemPrompt, estimatePromptTokens } from "../context-metrics.ts";

test("estimates prompt tokens with a simple chars-over-four heuristic", () => {
  assert.equal(estimatePromptTokens("abcd"), 1);
  assert.equal(estimatePromptTokens("abcdefgh"), 2);
});

test("computes the system prompt share of total context", () => {
  assert.equal(calculateSystemPromptRatio("abcdefgh", 10), 0.2);
});

test("returns zero when total tokens are unavailable", () => {
  assert.equal(calculateSystemPromptRatio("abcdefgh", null), 0);
});

test("describes an empty system prompt", () => {
  assert.equal(describeSystemPrompt("   \n  \t"), "empty");
});

test("describes a non-empty system prompt with token estimate and preview", () => {
  assert.equal(describeSystemPrompt("hello world"), "3t hello world");
});
