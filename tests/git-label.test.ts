import assert from "node:assert/strict";
import test from "node:test";

import { abbreviateGitLabel } from "../index.ts";

test("truncates git labels without an ellipsis", () => {
  const result = abbreviateGitLabel("very-long-branch-name-that-needs-shortening", 12);

  assert.equal(result.includes("…"), false);
  assert.equal(result.length > 0, true);
});
