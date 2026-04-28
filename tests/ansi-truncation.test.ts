import assert from "node:assert/strict";
import test from "node:test";

import { preserveTrailingEllipsisStyle } from "../ansi-truncation.ts";

test("keeps the trailing ellipsis inside the previous ANSI style", () => {
  const input = "\x1b[31mabc\x1b[0m...\x1b[0m";
  assert.equal(preserveTrailingEllipsisStyle(input), "\x1b[31mabc...\x1b[0m");
});
