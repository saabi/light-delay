# Changelog

All notable changes to this project will be documented in this file. This project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- `glyph-area` capacity is the observed content box. Borders, padding and scrollbars are
  excluded; margins are no longer deducted, since they do not reduce the space available for
  glyphs. Previously margins were subtracted and scrollbars were not.
- `value` is reassigned only when a measured field changes, instead of on every resize frame.
- The package lives in the light-delay repository as a workspace package until its first release;
  package metadata points there.

### Added

- Development warning when capacity oscillates between two values because the container is sized
  by content that depends on its own capacity.
- `breakpoints` validation: anything other than four finite, positive, strictly ascending numbers
  logs one warning and falls back to the defaults.
- Fixture page and Playwright tests for scrollbar exclusion, size and orientation flags,
  oscillation, no-op updates and invalid breakpoints.

### Removed

- The `MutationObserver` that re-read computed margins, borders and padding on `class`/`style`
  changes; a content-box `ResizeObserver` covers the same cases.

## [0.1.0] - 2026-08-20 (unpublished)

### Added

- `GlyphCapacitySensor` with reactive glyph, container, and text-capacity measurements.
- Configurable sample text, line-height override, capacity-box semantics, and breakpoints.
- Pixel and text orientation data plus cumulative size flags.
- Interactive comparison workbench and adaptive layout scenarios.
- Playwright coverage for measurement semantics and demo behavior.
