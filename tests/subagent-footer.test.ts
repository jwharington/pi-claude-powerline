import assert from "node:assert/strict";
import test from "node:test";

import { formatSubagentFooterText } from "../index.ts";

test("formats a single running agent", () => {
  assert.equal(formatSubagentFooterText("1 running agent"), "🤖 1");
});

test("formats multiple running agents", () => {
  assert.equal(formatSubagentFooterText("3 running agents"), "🤖 3");
});

test("formats running and queued agents", () => {
  assert.equal(formatSubagentFooterText("2 running, 1 queued agents"), "🤖 2 +1");
});

test("formats queued-only status with no running count", () => {
  assert.equal(formatSubagentFooterText("1 queued agent"), "🤖 +1");
});

test("returns null for non-subagent status text", () => {
  assert.equal(formatSubagentFooterText("auto-update available"), null);
  assert.equal(formatSubagentFooterText(""), null);
});
