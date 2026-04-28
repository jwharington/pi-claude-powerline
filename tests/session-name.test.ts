import assert from "node:assert/strict";
import test from "node:test";

import { chooseSessionNameForFooter } from "../footer-session-name.ts";
import { measureFooterContentWidth } from "../footer-width.ts";

test("keeps the full session name when the rest of the footer still fits", () => {
  assert.equal(
    chooseSessionNameForFooter(
      [
        { text: "balboa practice session", width: 24 },
        { text: "bps", width: 5 },
        { text: "balboa practice s…", width: 18 },
      ],
      24,
      120,
      3,
    ),
    "balboa practice session",
  );
});

test("prefers initials before truncation when the footer is tight", () => {
  assert.equal(
    chooseSessionNameForFooter(
      [
        { text: "balboa practice session", width: 24 },
        { text: "bps", width: 5 },
        { text: "balboa practice s…", width: 18 },
      ],
      24,
      40,
      3,
    ),
    "bps",
  );
});

test("falls back to truncation when there are no initials to use", () => {
  const result = chooseSessionNameForFooter(
    [
      { text: "extraordinarilylongsessionname", width: 30 },
      { text: "extraordinarilylongs…", width: 18 },
    ],
    24,
    40,
    3,
  );
  assert.equal(result, "extraordinarilylongs…");
});

test("measures footer content width without rendering fill padding", () => {
  assert.equal(measureFooterContentWidth([10, 12, 8]), 32);
});
