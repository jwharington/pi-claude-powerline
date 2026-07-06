import assert from "node:assert/strict";
import test from "node:test";

import { formatMcpFooterText } from "../index.ts";

test("formats a partial connection status", () => {
  assert.equal(formatMcpFooterText("MCP: 0/9 servers"), "🔌 0");
});

test("formats a fully connected status", () => {
  assert.equal(formatMcpFooterText("MCP: 9/9 servers"), "🔌 9");
});

test("formats a partially connected status", () => {
  assert.equal(formatMcpFooterText("MCP: 5/12 servers"), "🔌 5");
});

test("returns null for non-MCP status text", () => {
  assert.equal(formatMcpFooterText("auto-update available"), null);
  assert.equal(formatMcpFooterText(""), null);
});
