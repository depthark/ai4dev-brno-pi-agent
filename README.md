# Pi agent — AI 4 DEV Brno 2026

Talk deck for **"Pi agent"** at AI 4 DEV Brno (12 Nov 2026): a local AI agent stack on one home PC
(llama.cpp + Qwen3.6-35B-A3B on an RTX 4070, pi coding agent, Discord bridge, voice, images,
agent-browser, agent-desktop).

| File | What |
|---|---|
| `Pi-agent-Keynote.pptx` | the deck (36 slides, English; speaker notes in Slovak) |
| `pptx-to-keynote.applescript` | turns the pptx into a native Keynote deck with Magic Move and looping movies |
| `Pi-agent-Keynote-zaloha.pdf` | PDF backup |
| `Pi-agent-osnova.md` | talk outline and script (Slovak) |
| `zdroj/` | sources: `build.js` (pptxgenjs), animations in `anim/`, images |

## Keynote on a Mac

1. Open `pptx-to-keynote.applescript` in Script Editor and press Run (or `osascript pptx-to-keynote.applescript`).
2. Pick `Pi-agent-Keynote.pptx`. The script saves `Pi-agent-Keynote.key` next to it.
3. Check Magic Move (slides 1→2, 7→8, 26→27, 35→36) and looping movies in Play mode.

## Rebuild

```
cd zdroj
npm install
node build.js
```
