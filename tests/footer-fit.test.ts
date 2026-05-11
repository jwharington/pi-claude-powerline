import assert from "node:assert/strict";
import test from "node:test";

import { fitFooterSegmentsToWidth } from "../index.ts";

const SAMPLE_SEGMENTS = [
  { text: "tool visibility status line that is very long", color: { bg: "#111111", fg: "#ffffff" }, group: 0, kind: "extension" as const },
  { text: "manager auto-update status info", color: { bg: "#222222", fg: "#ffffff" }, group: 1, kind: "manager" as const },
  { text: "🧠 medium", color: { bg: "#333333", fg: "#ffffff" }, group: 2, kind: "thinking" as const },
];

test("keeps footer status texts when width is roomy", () => {
  const result = fitFooterSegmentsToWidth(SAMPLE_SEGMENTS, 120);

  assert.deepEqual(result.map((segment) => segment.text), SAMPLE_SEGMENTS.map((segment) => segment.text));
});

test("shrinks extension and manager statuses before thinking", () => {
  const result = fitFooterSegmentsToWidth(SAMPLE_SEGMENTS, 30);

  assert.equal(result.length, 3);
  assert.equal(result[2]?.text, "🧠 medium");
  assert.notEqual(result[0]?.text, SAMPLE_SEGMENTS[0].text);
  assert.notEqual(result[1]?.text, SAMPLE_SEGMENTS[1].text);
});

test("drops non-thinking statuses first at very small widths", () => {
  const result = fitFooterSegmentsToWidth(SAMPLE_SEGMENTS, 8);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.kind, "thinking");
  assert.equal(result[0]?.text, "🧠 …");
});
