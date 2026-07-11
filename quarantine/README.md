# Quarantine

Retired code kept for easy resurrection. Nothing here is imported, built, or
typechecked (`quarantine` is excluded in tsconfig.json). Full history also
lives in git if something predates this folder.

| File | Retired | What it was | To resurrect |
|---|---|---|---|
| `GameSkin.tsx` | 2026-07-11 | The "▶ GAME" pixel-art/typewriter booking path (Quest Mode). Toggle button removed from the NPC panel header the same day. | Move back to `components/npc/`, re-add the import + `skin === "game"` render branch and toggle button in `NPCWidget.tsx` (see git history of that file). |
| `MobileView.backup.tsx` | pre-2026-07 (moved here 2026-07-11) | Old mobile booking flow, superseded by the current `MobileView.tsx`. | Reference only — diff against current MobileView. |

Also retired earlier, recoverable from git history only:
- Rodeo overlay on /book (`app/(main)/book/page.tsx`, commit ~2026-07-11) — replaced by the SimpleWindows homepage explainer squares.
- Video-card differentiator ticker in `MapPanel.tsx` — nine marketing lines, removed 2026-07-11; the copy is preserved in that commit if wanted for FAQ/info content.
