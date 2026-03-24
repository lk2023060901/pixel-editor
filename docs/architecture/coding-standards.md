# Coding Standards

## Core Rule

No implementation may trade away long-term maintainability in the name of early speed. If a shortcut would need to be rewritten for Tiled compatibility, it is not allowed.

## TypeScript and Public API Rules

- Use strict TypeScript everywhere.
- Export types deliberately from `src/index.ts` only.
- Prefer discriminated unions for document variants and tool variants.
- Avoid `any`, broad `unknown` casts, and stringly typed command payloads.
- Public APIs must be stable, named by domain meaning, and documented with short comments when the behavior is non-obvious.
- During active development, remove superseded compatibility shims instead of keeping parallel legacy APIs alive.

## Layering Rules

- UI components must never mutate domain entities directly.
- Pixi event handlers must dispatch typed actions through `app-services`.
- Domain code must not depend on React, browser globals, or Pixi.
- API routes must depend on contracts and services, not UI packages.
- Persistence code must serialize normalized domain state, not view state.

## Hardcoding Policy

The following are not allowed:

- hardcoded project paths in reusable modules
- hardcoded tileset assumptions in map editing code
- hardcoded layer names in generic features
- hardcoded object classes or property keys in shared editor behaviors
- hidden magic numbers without named constants or documented math

Required alternatives:

- typed configuration objects
- named constants in domain-specific modules
- registries for tool definitions, property editors, and exporters
- capability flags or feature descriptors where behavior varies by environment

## Command and State Rules

- Every mutating edit must be represented as a command.
- Commands must be reversible unless explicitly modeled as non-history actions.
- Batch operations must use macro commands or transactions.
- Selection changes that affect behavior must be handled explicitly, not as incidental side effects.
- Derived state must be recomputable and disposable.
- Temporary interaction state such as drag previews, ghost stamps, and rubber-band overlays must live in explicit editor-state slices, not controller-private ad hoc fields.

## React Rules

- Keep React components presentational whenever possible.
- Prefer capability-scoped hooks over generic global hooks.
- Do not store authoritative document state in component-local state.
- Use props and typed action handlers instead of implicit module singletons.
- Avoid premature memoization. Add it only for proven render pressure or existing project conventions.

## Pixi Rules

- Treat Pixi nodes as render artifacts, not business entities.
- Build renderer modules by layer type and overlay type.
- Normalize picking results before they leave `renderer-pixi`.
- Keep projection math isolated and tested by orientation.
- Any cache invalidation strategy must be explicit and measurable.

## File Format Rules

- Normalize external formats into domain entities before editing.
- Preserve compatibility-critical metadata even when the editor does not actively use it.
- Ignore unknown forward-compatible attributes when safe, and surface issues through validation instead of destructive rewrites.
- All writers must be deterministic.

## Testing Rules

- Add unit tests for domain invariants and command behavior.
- Add fixture round-trip tests for new format coverage.
- Add screenshot or end-to-end tests for visible editor behavior.
- Regressions in undo, serialization, or orientation math require dedicated tests before merge.

## Documentation Rules

- Any new package needs a short responsibility statement in its README or package header comment.
- Any non-trivial public interface needs a short contract comment.
- Architecture changes that affect dependency direction or extension seams must update the architecture docs in the same change.

## Review Checklist

Before merging any implementation:

- verify there is no direct cross-layer mutation
- verify new constants are named and justified
- verify new commands support undo and redo correctly
- verify tests cover the new behavior
- verify the implementation does not assume orthogonal-only or fixed-map-only behavior unless that limitation is explicitly scoped and documented
