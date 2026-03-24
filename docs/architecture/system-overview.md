# System Overview

## Purpose

`pixel-editor` is a Web-first, Tiled-compatible 2D map editor. The product goal is to reproduce Tiled's editing depth without collapsing domain logic into UI code or renderer code.

The system is designed around four constraints:

1. Full-fidelity map editing for Tiled concepts, not a simplified level editor.
2. Strict compatibility with `TMX`, `TSX`, `TMJ`, and `TSJ`.
3. Clear separation between document model, editing behavior, rendering, and transport.
4. No hardcoded gameplay assumptions, tileset assumptions, or project-specific behavior.

## Architecture Principles

- Domain-first: the map model, command system, and format compatibility are the source of truth.
- UI as adapter: React components render editor state and dispatch typed actions only.
- Renderer as adapter: PixiJS renders the current document state but does not own business state.
- API-driven modules: packages communicate through typed contracts and public package APIs.
- Incremental extensibility: projects, templates, worlds, automapping, and scripting all attach to stable extension points instead of ad hoc hooks.
- Testable seams: every editing behavior must be testable without a browser canvas.

## Runtime Topology

### `apps/web`

Next.js application shell responsible for:

- project routes
- authentication integration
- API handlers
- server-side job submission
- editor page composition
- static asset bootstrapping

### `apps/worker`

Background process responsible for:

- export jobs
- asset metadata indexing
- thumbnail generation
- validation and consistency checks
- future long-running format conversion tasks

### Shared Packages

- `packages/contracts`: request and response DTOs, API payloads, error codes, event shapes
- `packages/domain`: Tiled-compatible document model and invariants
- `packages/command-engine`: undo, redo, command merging, macros, transactions
- `packages/editor-state`: session state, selection state, tool state, viewport state
- `packages/app-services`: orchestration layer that binds UI actions to domain operations
- `packages/map`: map-focused commands, viewport actions, and default map workflows
- `packages/objects`: object-focused commands, selection actions, and clipboard workflows
- `packages/tileset`: tileset-focused commands, selection actions, and tile metadata workflows
- `packages/renderer-pixi`: PixiJS-backed render graph, picking, overlays, viewport rendering
- `packages/ui-editor`: editor shell components, panels, toolbars, dialogs

## Core State Model

The editor runtime is split into three state categories.

### 1. Document State

Persistent state that maps directly to saved assets:

- map metadata
- layer tree
- tilesets
- tile data and chunks
- objects
- typed properties
- templates
- project metadata
- world metadata

Document state lives in `packages/domain`.

### 2. Session State

Transient editor-only state:

- active document
- active layer
- active tool
- selection
- clipboard snapshot
- panel visibility
- viewport mode
- hover state

Session state lives in `packages/editor-state`.

### 3. Derived State

Computed or cacheable state:

- visible layer tree
- render caches
- dirty chunk ranges
- picked entity metadata
- inspector view models
- minimap model

Derived state is recreated from document state and session state. It must not become a second source of truth.

## Editing Flow

All editing flows follow the same pipeline.

1. UI dispatches an intent through `app-services`.
2. `app-services` validates preconditions and builds one or more commands.
3. `command-engine` executes the command transaction against the domain model.
4. `editor-state` updates selection or tool state if needed.
5. `renderer-pixi` receives an immutable render input snapshot and redraws dirty regions only.
6. Persistence and autosave are triggered through typed service adapters.

Direct mutation from UI components or renderer hooks is not allowed.

## Rendering Model

PixiJS is the rendering backend, not the editor architecture.

The rendering package is responsible for:

- map camera and zoom
- orientation-aware projection math
- tile layer rendering
- object layer rendering
- image layer rendering
- group layer composition
- overlays for selection, grid, guides, handles, hover, previews
- picking and hit-test normalization
- minimap rendering
- chunk-aware incremental redraw for infinite maps

The rendering package is not responsible for:

- document persistence
- undo or redo
- property editing rules
- command batching
- format serialization

## Persistence and Compatibility

Internal state is not serialized directly from React state or Pixi objects.

The compatibility stack is:

1. Domain entities and normalized AST
2. Format adapters for `TMX/TSX`
3. Format adapters for `TMJ/TSJ`
4. Asset reference and path resolution layer
5. Validation layer for unsupported or inconsistent external input

All file format behavior must tolerate unknown attributes and forward-compatible extensions where possible.

## Backend Responsibilities

The first release targets browser-first, online-first, single-user cloud projects.

Backend responsibilities:

- project CRUD
- asset upload and reference management
- document version snapshots
- export job queue and artifact storage
- validation issue reporting

The backend does not own editor command semantics. Those remain client-side domain concerns.

## Non-Functional Requirements

- Large maps and infinite maps must render incrementally.
- Editing logic must be deterministic under undo and redo.
- All public package APIs must be typed and documented.
- Every new feature must include fixture-based or end-to-end validation.
- Performance-sensitive work such as automapping, export prep, or mass property transforms must be worker-friendly.
