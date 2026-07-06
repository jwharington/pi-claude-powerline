import assert from "node:assert/strict";
import test from "node:test";

import { formatTpsFooterText } from "../index.ts";

test("compacts the live gauge form, dropping the spinner and padding to constant width", () => {
  assert.equal(
    formatTpsFooterText("⠹ ▕███████▋···▏ 47 tps"),
    "▕███████▋···▏  47 tps",
  );
});

test("compacts the summary sparkline form, dropping stats and padding to constant width", () => {
  assert.equal(
    formatTpsFooterText("▁▄▇▅▂▁▇█▅▃▆▇ 42 tps · μ 39 · p95 61"),
    "▁▁▄▇▅▂▁▇█▅▃▆▇  42 tps",
  );
});

test("both forms produce the same total width", () => {
  const live = formatTpsFooterText("⠹ ▕███████▋···▏ 47 tps")!;
  const summary = formatTpsFooterText("▁▄▇▅▂▁▇█▅▃▆▇ 42 tps · μ 39 · p95 61")!;
  assert.equal(live.length, summary.length);
});

test("left-pads single-digit tps to keep width stable", () => {
  assert.equal(
    formatTpsFooterText("▁▄▇▅▂▁▇█▅▃▆▇ 7 tps · μ 5 · p95 9"),
    "▁▁▄▇▅▂▁▇█▅▃▆▇   7 tps",
  );
});

test("handles a decimal tps value", () => {
  assert.equal(
    formatTpsFooterText("⠹ ▕███████▋···▏ 7.3 tps"),
    "▕███████▋···▏ 7.3 tps",
  );
});

test("returns null for non-tps status text", () => {
  assert.equal(formatTpsFooterText("auto-update available"), null);
  assert.equal(formatTpsFooterText(""), null);
});
