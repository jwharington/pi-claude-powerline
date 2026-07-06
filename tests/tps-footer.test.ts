import assert from "node:assert/strict";
import test from "node:test";

import { formatTpsFooterText } from "../index.ts";

test("compacts the final/summary form, keeping sparkline + avg", () => {
  assert.equal(
    formatTpsFooterText("▁▄▇▅▂▁▇█▅▃▆▇ 42 tps · μ 39 · p95 61"),
    "▁▄▇▅▂▁▇█▅▃▆▇ 42 tps",
  );
});

test("compacts a slower summary form", () => {
  assert.equal(
    formatTpsFooterText("▁▄▇▅▂▁▇█▅▃▆▇ 7 tps · μ 5 · p95 9"),
    "▁▄▇▅▂▁▇█▅▃▆▇ 7 tps",
  );
});

test("leaves the live gauge form untouched", () => {
  assert.equal(formatTpsFooterText("⠹ ▕███████▋···▏ 47 tps"), null);
});

test("returns null for non-tps status text", () => {
  assert.equal(formatTpsFooterText("auto-update available"), null);
  assert.equal(formatTpsFooterText(""), null);
});
