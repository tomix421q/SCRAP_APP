# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or issue number directly.

## Archive: `.scratch/_old_scratch/`

Completed or superseded specs and tickets live in `.scratch/_old_scratch/` (same layout: `<feature-slug>/spec.md`, `<feature-slug>/issues/<NN>-<slug>.md`).

- Treat it as a **read-only archive**: do not create new specs or tickets there, and do not pick tickets from it as open work (ignore it when scanning for the frontier / open issues).
- Whenever a task reworks, changes or touches an existing feature, **look into the archive first** (e.g. `ls .scratch/_old_scratch`, grep for the feature name) to find the original spec, decisions and acceptance criteria, and reuse that context.
- Old references of the form `.scratch/<feature-slug>/...` may now resolve to `.scratch/_old_scratch/<feature-slug>/...`.
