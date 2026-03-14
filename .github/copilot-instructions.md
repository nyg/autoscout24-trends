# Copilot Instructions

Read `AGENTS.md` in the repository root first. It is the canonical source for repository architecture, workflows, conventions, and integration pitfalls.

Keep this file short and Copilot-specific:

- Use `AGENTS.md` for repo facts; avoid duplicating large sections of project documentation here.
- If `AGENTS.md` and this file ever drift, treat `AGENTS.md` as authoritative for repository behavior and update this file to match.
- Make surgical changes that preserve the existing crawler/frontend split and reuse established patterns before introducing new ones.

## Copilot-specific reminders

- For frontend work, keep SQL in `frontend/src/lib/data.js` and preserve the server-passes-promises/client-uses-`use(data)` pattern described in `AGENTS.md`.
- For crawler schema or car-field changes, update `crawler/autoscout/items.py`, `crawler/autoscout/pipelines.py`, `crawler/SCHEMA.sql`, and relevant frontend readers together.
- Do not modify `crawler/output/` unless the task is explicitly about runtime artifacts or debugging output.
- Follow the existing style conventions already documented in `AGENTS.md`: frontend uses 3-space indentation, single quotes, and no semicolons; Python stays close to PEP 8.
