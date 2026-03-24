# Pixel Editor

Web-first Tiled-compatible editor built with Next.js, Tailwind CSS, and PixiJS.

## Workspace Layout

- `apps/web`: Next.js application shell and HTTP entrypoints.
- `apps/worker`: Background jobs for exports and asset processing.
- `packages/contracts`: Shared API contracts.
- `packages/domain`: Editor domain model and invariants.
- `packages/command-engine`: Undo/redo command history.
- `packages/editor-state`: Session state and selectors.
- `packages/app-services`: Use-case orchestration layer.
- `packages/map`: Map-focused editing commands and use-case helpers.
- `packages/tileset`: Tileset-focused editing commands and use-case helpers.
- `packages/renderer-pixi`: PixiJS rendering adapter.
- `packages/ui-editor`: Reusable editor UI components.

## Architecture Docs

- `docs/README.md`
- `docs/development-plan.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/module-boundaries.md`
- `docs/architecture/development-roadmap.md`
- `docs/architecture/coding-standards.md`
