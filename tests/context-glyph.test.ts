import assert from "node:assert/strict";
import test from "node:test";

import { chooseContextGlyph } from "../context-glyph.ts";

test("maps low context usage to U+25D4", () => {
  assert.equal(chooseContextGlyph(0), "◔");
  assert.equal(chooseContextGlyph(33.9), "◔");
});

test("maps mid context usage to U+25D1", () => {
  assert.equal(chooseContextGlyph(34), "◑");
  assert.equal(chooseContextGlyph(66.9), "◑");
});

test("maps high context usage to U+25D5", () => {
  assert.equal(chooseContextGlyph(67), "◕");
  assert.equal(chooseContextGlyph(100), "◕");
});

test("defaults to the low glyph when context is unknown", () => {
  assert.equal(chooseContextGlyph(undefined), "◔");
});
