import assert from "node:assert/strict";
import test from "node:test";

import { abbreviateGitLabel, fitPathAndGitPrefix } from "../index.ts";

test("truncates git labels without an ellipsis", () => {
  const result = abbreviateGitLabel("very-long-branch-name-that-needs-shortening", 12);

  assert.equal(result.includes("…"), false);
  assert.equal(result.length > 0, true);
});

test("prefers preserving full git branch by collapsing path", () => {
  const result = fitPathAndGitPrefix("/srv/repos/monorepo/apps/frontend/web", "feature-super-long-branch-name", 50, "*");

  assert.equal(result.gitLabel, "feature-super-long-branch-name");
  assert.equal(result.path, "…/web");
});

test("shows up to two trailing directories when budget allows", () => {
  const result = fitPathAndGitPrefix("/srv/repos/monorepo/apps/frontend/web", "feature-super-long-branch-name", 60, "*");

  assert.equal(result.gitLabel, "feature-super-long-branch-name");
  assert.equal(result.path, "…/frontend/web");
});
