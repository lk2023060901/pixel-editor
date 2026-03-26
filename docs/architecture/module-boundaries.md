# Module Boundaries

## Dependency Rule

Allowed dependency direction:

`ui-editor -> app-services -> map -> editor-state -> domain`

`ui-editor -> app-services -> tileset -> editor-state -> domain`

`ui-editor -> app-services -> project -> editor-state -> domain`

`ui-editor -> app-services -> template -> editor-state -> domain`

`app-services -> command-engine`

`app-services -> contracts`

`map -> command-engine`

`tileset -> command-engine`

`renderer-pixi -> domain`

`apps/web -> ui-editor, app-services, contracts`

`apps/worker -> contracts, domain, future io/export packages`

Anything outside this graph requires an explicit architecture decision.

## Package Responsibilities

## `packages/contracts`

Owns:

- API DTOs
- command payload envelopes crossing process boundaries
- error codes
- job descriptors
- project and asset metadata contracts

Must not own:

- domain entities
- editor session state
- renderer state

Public API rules:

- export stable type aliases and interfaces only
- avoid leaking framework-specific types
- version breaking API shape changes explicitly

## `packages/domain`

Owns:

- map, tileset, tile, layer, object, template, project, world models
- IDs and reference semantics
- property type system
- format-neutral invariants
- orientation and chunk math that belongs to the model

Must not own:

- React hooks
- Pixi objects
- browser APIs
- transport DTOs

Public API rules:

- constructors and factories validate invariants
- mutating operations are exposed through explicit methods or command helpers
- derived calculations stay pure

## `packages/command-engine`

Owns:

- command interfaces
- transaction orchestration
- undo and redo history
- mergeable command logic
- macro commands

Must not own:

- UI state
- persistence adapters
- renderer invalidation details

Public API rules:

- commands receive typed context
- command effects are deterministic
- commands must support undo unless clearly marked read-only

## `packages/editor-state`

Owns:

- active document pointer
- selection
- tool mode
- panel state
- viewport session state
- transient interaction state such as drag previews and gesture-local overlays
- derived selectors for UI

Must not own:

- domain serialization logic
- actual draw commands
- server persistence

Public API rules:

- selectors are pure
- mutations happen through explicit session actions
- state shape must remain renderer-agnostic
- temporary interaction previews must live here instead of controller-private ad hoc fields

## `packages/app-services`

Owns:

- use-case orchestration
- precondition checks
- composition of multiple domain commands
- service interfaces for storage, export, validation, and asset loading
- mapping between contracts and domain operations

Must not own:

- presentational markup
- low-level Pixi draw logic
- raw XML or JSON parsing

Public API rules:

- expose task-focused entrypoints such as `createMap`, `paintTiles`, `saveDocument`
- define interfaces for infrastructure dependencies instead of reaching into app code

## `packages/map`

Owns:

- map document factory defaults
- map-focused command composition
- viewport commands
- active map and active tool commands
- tile selection and tile painting workflows

Must not own:

- transport DTOs
- React components
- renderer internals
- generic persistence adapters
- object-specific editing workflows

Public API rules:

- expose map-specific commands and helpers only
- depend on shared domain and command primitives instead of duplicating them
- keep feature behavior reusable by both UI and future automation flows

## `packages/objects`

Owns:

- object-focused command composition
- object selection commands
- object clipboard workflows
- object creation and deletion helpers

Must not own:

- transport DTOs
- React components
- renderer internals
- tile editing workflows

Public API rules:

- expose object-specific commands and helpers only
- depend on shared domain and command primitives instead of duplicating them
- keep object behavior reusable by both UI and future automation flows

## `packages/tileset`

Owns:

- tileset creation defaults
- tileset-focused command composition
- active tileset commands
- tile metadata and property editing commands

Must not own:

- transport DTOs
- React components
- renderer internals
- generic persistence adapters

Public API rules:

- expose tileset-specific commands and helpers only
- depend on shared domain and command primitives instead of duplicating them
- keep tileset behavior reusable by both UI and future automation flows

## `packages/project`

Owns:

- project-focused command composition
- project metadata replacement helpers
- reusable project document mutation workflows

Must not own:

- transport DTOs
- React components
- renderer internals
- generic persistence adapters

Public API rules:

- expose project-specific commands and helpers only
- depend on shared domain and command primitives instead of duplicating them
- keep project behavior reusable by both UI and future automation flows

## `packages/template`

Owns:

- template-focused command composition
- active template selection commands
- reusable object template document creation helpers

Must not own:

- transport DTOs
- React components
- renderer internals
- generic persistence adapters
- template instance mutation workflows that belong to object editing

Public API rules:

- expose template-specific commands and helpers only
- depend on shared domain and command primitives instead of duplicating them
- keep template document behavior reusable by both UI and future import/export flows

## `packages/world`

Owns:

- world-focused command composition
- imported world document insertion workflows
- reusable world mutation helpers shared by import/export and future world view flows

Must not own:

- transport DTOs
- React components
- renderer internals
- generic persistence adapters

Public API rules:

- expose world-specific commands and helpers only
- depend on shared domain and command primitives instead of duplicating them
- keep world behavior reusable by both UI and future import/export flows

## `packages/renderer-pixi`

Owns:

- Pixi application bootstrap
- layer renderers
- overlay renderers
- hit testing
- viewport interactions
- render cache lifecycle

Must not own:

- authoritative document state
- file format decisions
- undo and redo history

Public API rules:

- accept typed render snapshots
- isolate Pixi object creation behind package-private modules
- expose stable canvas host interfaces to `apps/web`

## `packages/ui-editor`

Owns:

- shell layout
- panel components
- inspector components
- dialogs
- toolbars
- keyboard shortcut binding at UI boundary

Must not own:

- direct domain mutation
- storage adapters
- format conversion

Public API rules:

- consume selectors and typed action callbacks
- components remain reusable and capability-scoped
- avoid app-global singleton state

## Cross-Package Contracts

The following seams must stay explicit.

### Document Services

`app-services` depends on interfaces such as:

- `DocumentRepository`
- `AssetRepository`
- `ExportJobGateway`
- `ValidationGateway`

`apps/web` provides concrete implementations.

### Renderer Input

`renderer-pixi` receives:

- immutable document snapshot
- viewport settings
- overlay settings
- interaction flags

It returns:

- normalized pick results
- viewport callbacks
- renderer lifecycle hooks

### UI Actions

`ui-editor` receives:

- selectors
- command-like action functions
- feature capability flags

It does not import domain entities unless rendering read-only metadata.

## Folder-Level Rules

- Each package exports from a single `src/index.ts`.
- Internal modules remain package-private unless re-exported deliberately.
- Feature code should be grouped by capability, not by framework.
- Avoid dumping unrelated helpers into `utils.ts`.
- Shared constants must be named by domain meaning, not screen usage.

## Forbidden Patterns

- React components importing domain internals and mutating them directly.
- Pixi event handlers mutating domain state without going through `app-services`.
- API routes depending on UI packages.
- Contract types importing domain classes.
- Hardcoded project rules in generic map editing code.
- Saving by serializing arbitrary in-memory UI state.

## Expected Extension Points

The architecture must leave stable seams for:

- additional file format adapters
- scripting and plugin host
- future desktop shell
- future collaboration layer
- future worker offloading for automapping and export
