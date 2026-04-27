import assert from "node:assert/strict";
import test from "node:test";

import { fillBoundaryGlyph, isVscodeTerminal, separatorGlyph } from "../powerline-glyphs.ts";

const POWERLINE = "\uE0B0";
const ASCII_POWERLINE = ">";

const seg = (id: string) => ({ id });

test("uses the plain powerline glyph for model/context seams in VS Code", () => {
  const env = { TERM_PROGRAM: "vscode" };

  assert.equal(separatorGlyph(seg("model"), seg("context"), POWERLINE, env), POWERLINE);
  assert.equal(separatorGlyph(seg("context"), seg("model"), POWERLINE, env), POWERLINE);
});

test("uses the plain powerline glyph for model/context seams when nerd fonts are disabled", () => {
  const env = { POWERLINE_NERD_FONTS: "0" };

  assert.equal(separatorGlyph(seg("model"), seg("context"), ASCII_POWERLINE, env), ASCII_POWERLINE);
  assert.equal(separatorGlyph(seg("context"), seg("model"), ASCII_POWERLINE, env), ASCII_POWERLINE);
});

test("keeps the model chevrons for other terminals", () => {
  const env = {};

  assert.equal(separatorGlyph(seg("model"), seg("context"), POWERLINE, env), "◤");
  assert.equal(separatorGlyph(seg("context"), seg("model"), POWERLINE, env), "◣");
});

test("falls back to the plain powerline glyph for the fill boundary in VS Code", () => {
  const env = { TERM_PROGRAM: "vscode" };

  assert.equal(fillBoundaryGlyph(POWERLINE, env), POWERLINE);
});

test("keeps the chevron fill boundary in other terminals", () => {
  assert.equal(fillBoundaryGlyph(POWERLINE, {}), "◤");
});

test("detects VS Code terminals from environment hints", () => {
  assert.equal(isVscodeTerminal({ TERM_PROGRAM: "vscode" }), true);
  assert.equal(isVscodeTerminal({ VSCODE_PID: "12345" }), true);
  assert.equal(isVscodeTerminal({ VSCODE_INJECTION: "1" }), true);
  assert.equal(isVscodeTerminal({ TERM_PROGRAM: "xterm" }), false);
});
