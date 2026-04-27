# pi-claude-powerline

Pi extension/package that brings a Claude Powerline-like **status bar above the prompt line** to Pi, plus matching Pi color themes.

## What this adds

1. A custom powerline bar (segments + separators) inspired by `claude-powerline`, rendered **above the editor/prompt line**.
2. Six Pi themes that map Claude Powerline palettes into Pi's theme schema:
   - `claude-powerline-dark`
   - `claude-powerline-light`
   - `claude-powerline-nord`
   - `claude-powerline-tokyo-night`
   - `claude-powerline-rose-pine`
   - `claude-powerline-gruvbox`

## Install

From this repo root:

```bash
pi install ./pi-claude-powerline
```

Or run directly for testing:

```bash
pi -e ./pi-claude-powerline
```

Then run `/reload` in Pi.

## Commands

- `/claude-powerline on`
- `/claude-powerline off`
- `/claude-powerline toggle`
- `/claude-powerline theme dark|light|nord|tokyo-night|rose-pine|gruvbox`
- `/claude-powerline segments list`
- `/claude-powerline segments reset`
- `/claude-powerline segments on today weekly env tmux`
- `/claude-powerline segments off context`
- `/claude-powerline segments toggle git`

While the agent is working, the left-most segment shows an animated spinner.
Extra Claude-style segments now available:
- `today` (daily cost)
- `weekly` (7-day cost)
- `env` (from `CLAUDE_POWERLINE_ENV`, `PI_ENV`, or `NODE_ENV`)
- `tmux` (TMUX session indicator)

## Notes

- If your terminal font doesn't support powerline glyphs, set:

```bash
export POWERLINE_NERD_FONTS=0
```

This switches separators to ASCII (`>`).
- The footer is enabled by default when the extension loads.
- If the context segment would take less than a quarter of the available width, the model provider label is abbreviated to preserve space for context.
- Theme JSONs are still provided so you can also pick `claude-powerline-*` in `/settings`.
