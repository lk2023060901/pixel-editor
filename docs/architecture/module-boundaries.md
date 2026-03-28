# Module Boundaries

## Dependency Rule

Allowed dependency direction:

`ui-editor -> app-services/ui -> map -> editor-state -> domain`

`ui-editor -> app-services/ui-shell -> map -> editor-state -> domain`

`ui-editor -> app-services/ui-store -> map -> editor-state -> domain`

`ui-editor -> app-services/ui-naming -> domain`

`ui-editor -> app-services/ui-custom-properties -> domain`

`ui-editor -> app-services/ui-property-types -> domain`

`ui-editor -> app-services/ui -> tileset -> editor-state -> domain`

`ui-editor -> app-services/ui -> project -> editor-state -> domain`

`ui-editor -> app-services/ui -> template -> editor-state -> domain`

`app-services -> command-engine`

`app-services -> contracts`

`app-services -> asset-reference`

`app-services -> automapping`

`app-services -> tiled-automapping`

`map -> command-engine`

`tileset -> command-engine`

`automapping -> domain`

`renderer-pixi -> domain`

`apps/web -> ui-editor, app-services, renderer-pixi, contracts, example-project-support, export-jobs`

`apps/worker -> contracts, example-project-support, export-jobs`

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

## `packages/example-project-support`

Owns:

- example project filesystem path resolution
- example project document read and write helpers
- content-type aware export artifact persistence for the example app

Must not own:

- UI state
- controller orchestration
- queue lifecycle state

Public API rules:

- expose Node-only helpers with explicit project/path inputs
- keep path normalization and traversal checks centralized
- remain example-project scoped rather than becoming a generic export API

## `packages/export-jobs`

Owns:

- export job queue storage
- job state transitions such as queued/running/completed/failed
- worker-friendly job claim and completion helpers

Must not own:

- export serialization
- editor session state
- UI concerns

Public API rules:

- persist stable job records using contracts DTOs
- expose explicit queue/claim/complete/fail APIs
- keep storage concerns reusable by web routes and worker processes

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
- editor action and menu contracts consumed by the UI shell
- UI read-model helpers and selectors that flatten editor state for presentation

Must not own:

- presentational markup
- low-level Pixi draw logic
- raw XML or JSON parsing

Public API rules:

- expose task-focused entrypoints such as `createMap`, `paintTiles`, `saveDocument`
- expose typed UI contracts instead of forcing `ui-editor` to mirror business action registries
- keep shell and panel contracts under the `@pixel-editor/app-services/ui` subpath
- keep editor shell chrome, toolbar, and menu registries under the `@pixel-editor/app-services/ui-shell` subpath
- keep component-specific store/action facets under the `@pixel-editor/app-services/ui-store` subpath
- split shell store facets by responsibility such as snapshot subscription, file actions, document navigation, canvas interaction, issues, and status bar controls
- keep naming helpers such as indexed labels and slugs under the `@pixel-editor/app-services/ui-naming` subpath
- keep low-level widget helpers split by concern under dedicated subpaths such as `@pixel-editor/app-services/ui-custom-properties` and `@pixel-editor/app-services/ui-property-types`
- avoid re-exporting raw `contracts` DTOs or runtime snapshots from the `ui` root when a view-state or local union is sufficient
- avoid re-exporting the full `EditorController` from the `ui` root when a narrower component store contract is available
- avoid re-exporting generic naming utilities from the `ui` root when a narrower helper subpath is available
- prefer deriving tile widget labels and unions from existing UI view-state contracts instead of maintaining a separate tile enum gateway
- centralize state-to-view derivation there instead of rebuilding it ad hoc inside React components
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

## `packages/tiled-automapping`

Owns:

- `rules.txt` parsing
- automapping rules include expansion
- rule map reference normalization
- automapping path reference issue reporting

Must not own:

- rule execution
- React components
- renderer internals
- authoritative editor state

Public API rules:

- accept raw rules text plus explicit path resolution options
- keep include traversal deterministic and side-effect free
- expose normalized rule map references and issues for reuse by future editor and worker flows

## `packages/automapping`

Owns:

- rule map layer analysis
- compiled automapping rule structures
- input/output pattern matching
- deterministic rule execution against map snapshots
- automapping execution issues for unsupported rule semantics

Must not own:

- `rules.txt` parsing
- React components
- authoritative editor session state
- storage adapters

Public API rules:

- accept normalized rule maps as domain models
- keep compilation and execution pure and reusable
- expose explicit execution options instead of reaching into controller state
- leave document loading and trigger orchestration to `app-services`

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
- expose stable renderer bridge implementations to `apps/web`

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

- consume `@pixel-editor/app-services/ui` shell and panel contracts, dedicated widget helper subpaths, and injected render bridges
- components remain reusable and capability-scoped
- keep shell-local UI state and menu/dialog orchestration in dedicated presenter hooks instead of growing a monolithic top-level component
- keep shell snapshot subscriptions plus shell-specific view and chrome derivation in dedicated hooks instead of rebuilding them inline inside the presenter body
- keep the workspace grid and overlay/dialog regions in dedicated shell layout components instead of concentrating all JSX branches in `editor-shell.tsx`
- keep menu bar and toolbar rendering in dedicated shell chrome components instead of mixing chrome widgets with presenter hookup
- keep menu popups and toolbar button groups under dedicated chrome primitive components instead of re-growing `editor-shell-chrome.tsx`
- keep chrome-local interaction state such as submenu focus and the New split-menu open flag in dedicated chrome hooks instead of the generic shell local-state hook
- keep toolbar split buttons, separators, and item groups under dedicated toolbar primitive components instead of re-growing `editor-shell-toolbar.tsx`
- keep repeated chrome class and visual-state decisions in shared chrome style helpers instead of scattering the same Tailwind branches across menu and toolbar primitives
- keep popup surfaces, popup rows, and popup separators under shared popup primitives instead of duplicating the same overlay structure between menu and split-button components
- keep panel-local selection, filter text, zoom, draft objects, and controller action wrappers in dedicated `use-*-state` hooks instead of embedding those concerns in the panel root component
- keep panel-specific list, toolbar, summary-card, and detail-form JSX in dedicated `*-sections.tsx` files instead of letting `properties-inspector`, `tilesets-panel`, `objects-panel`, `terrain-sets-panel`, or editor dialogs regrow into mixed presenter/view modules
- keep property-editor parsing, draft coercion, and other pure transformation helpers in dedicated utility modules instead of combining pure helper logic with React component bodies
- avoid reconstructing layer trees, project trees, or active-selection derivations from raw snapshot state
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

### Renderer Bridge

`ui-editor` depends on an injected renderer bridge for:

- canvas renderer creation
- snapshot export
- object projection and picking
- world overlay projection

`apps/web` provides the concrete `renderer-pixi` implementation.
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
