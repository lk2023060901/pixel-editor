# Development Roadmap

## Delivery Principles

- Build dependencies before features that consume them.
- Preserve Tiled compatibility from the first format adapter onward.
- Do not ship shortcut implementations that will need a rewrite for infinite maps, non-orthogonal maps, or typed properties.
- Every phase ends with concrete acceptance criteria.

## Feature Inventory

The product scope to be implemented includes:

- map creation and map properties
- tile layers, object layers, image layers, group layers
- orthogonal, isometric, staggered, hexagonal, and oblique maps
- fixed-size and infinite maps
- tilesets from sprite sheets and image collections
- tile editing tools, selection tools, and clipboard
- object creation and object editing tools
- custom properties, custom enums, classes, and object references
- tile animations and tile collision editing
- Wang sets, terrain-aware placement, and stamp memory
- projects, templates, and worlds
- automapping
- export pipeline and image export
- future scripting and extension host

## Phase 0: Foundation

Goal:

- establish monorepo, package boundaries, typing, linting, testing, and documentation standards

Deliverables:

- workspace layout
- base tsconfig
- root scripts
- architecture docs

Acceptance:

- workspace builds type-check cleanly
- package boundaries are documented

## Phase 1: Domain Core

Goal:

- implement normalized, format-neutral domain entities for all core Tiled concepts

Deliverables:

- IDs and reference model
- map, layer, object, tile, tileset, project, template, world entities
- property type model
- orientation model
- chunk model for infinite maps

Acceptance:

- domain invariants are unit-tested
- model supports every required map orientation and layer type at type level

## Phase 2: Command Engine and Session State

Goal:

- make all future edits flow through a deterministic command stack

Deliverables:

- command interfaces
- history stack
- macro support
- session state model
- selection model

Acceptance:

- undo and redo work for representative entity edits
- no editor mutation path bypasses the command engine

## Phase 3: Format Compatibility Layer

Goal:

- support full read and write compatibility for Tiled core formats

Deliverables:

- `TMJ/TSJ` parser and writer
- `TMX/TSX` parser and writer
- asset reference resolver
- compatibility validation

Acceptance:

- round-trip fixtures preserve structure and semantics
- examples from the Tiled repository can be parsed into domain form

## Phase 4: Rendering Core

Goal:

- render maps accurately and support editor navigation

Deliverables:

- Pixi renderer bootstrap
- camera, zoom, pan, fit
- orthogonal grid and tile rendering
- picking infrastructure
- grid and selection overlays

Acceptance:

- representative maps render correctly
- interaction can identify tiles and objects consistently

## Phase 5: Map Editing Core

Goal:

- make tile map editing usable on orthogonal maps first without introducing architecture debt

Deliverables:

- new map flow
- tile layer editing
- stamp brush
- eraser
- bucket fill
- shape fill
- rectangular selection
- clipboard
- layer inspector and properties inspector

Acceptance:

- user can create, paint, erase, undo, redo, copy, paste, and save a basic map

## Phase 6: Infinite Maps

Goal:

- support chunked editing and rendering without redesigning the core

Deliverables:

- chunk-aware painting and selection
- chunk-aware rendering invalidation
- convert between fixed and infinite maps

Acceptance:

- edits across chunk boundaries remain correct
- undo and redo preserve chunk structure

## Phase 7: Non-Orthogonal Maps

Goal:

- extend projection and picking across all Tiled orientations

Deliverables:

- isometric rendering and picking
- staggered rendering and picking
- hexagonal rendering and picking
- oblique rendering and picking

Acceptance:

- each orientation can be created, rendered, edited, saved, and reopened

## Phase 8: Object System

Goal:

- reproduce Tiled's object-layer editing depth

Deliverables:

- rectangle, ellipse, point, polygon, polyline, text, tile object, and capsule objects
- move, rotate, resize, reorder, align, and snap behaviors
- object properties and references

Acceptance:

- object editing is fully undoable
- object serialization matches Tiled semantics

## Phase 9: Tileset Editor

Goal:

- support authoring and editing of Tiled-compatible tilesets

Deliverables:

- sprite sheet slicing
- image collection tilesets
- tileset metadata editing
- tile properties
- tile probability
- typed tiles
- animation editor
- collision editor

Acceptance:

- tilesets can be created, edited, saved, reopened, and reused across maps

## Phase 10: Advanced Layer Features

Goal:

- match Tiled's deeper rendering and organization model

Deliverables:

- image layers
- group layers
- opacity, lock, visibility
- tint, blend mode, offset
- parallax
- repeating image layers
- minimap

Acceptance:

- composite scenes match expected visual behavior in regression fixtures

## Phase 11: Terrain, Wang, and Stamp Memory

Goal:

- reproduce advanced tile placement workflows

Deliverables:

- Wang sets
- Wang colors
- terrain-aware brush behavior
- random placement
- tile stamp memory and variation probabilities

Acceptance:

- terrain and Wang workflows operate against real fixture tilesets

## Phase 12: Projects, Templates, and Worlds

Goal:

- support multi-asset editing workflows beyond single-map editing

Deliverables:

- project metadata
- project asset tree
- custom property types editor support
- object templates
- world definitions and world view

Acceptance:

- templates and worlds survive save/load cycles and integrate with map editing

## Phase 13: Automapping and Export

Goal:

- complete production workflows for automated editing and export

Deliverables:

- rule map execution engine
- project and map-level automapping rules
- export jobs
- export options
- image export pipeline

Acceptance:

- representative automapping fixtures match expected outputs
- export jobs produce deterministic artifacts

## Phase 14: Extension Host

Goal:

- add the long-term extensibility layer without destabilizing the core

Deliverables:

- extension manifest
- command registration
- format plugin hooks
- scripting bridge
- safe execution policy

Acceptance:

- third-party extensions can add commands or formats through supported APIs only

## Done Criteria For Any Phase

- package APIs are documented
- tests cover the new invariants or behaviors
- no new cross-layer dependency violations are introduced
- feature works through the command engine
- save and reload paths are validated when persistence is involved

