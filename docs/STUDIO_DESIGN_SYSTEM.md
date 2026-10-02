# Studio UI design system

Status: **product design baseline**.

Studio is a professional creative application, not a visual extension of the Light Delay film identity.

## Character

The interface should feel:
- quiet;
- precise;
- editorial;
- contemporary without chasing UI fashion;
- capable of high information density;
- neutral enough that the project artwork, screenplay and footage remain the visual subject.

Minimal does **not** mean sparse. Reduce visual noise before reducing information.

## Application versus project identity

Studio chrome is neutral. A project's branding, palette, key art and cinematic language may appear inside project/content surfaces, but must not recolor the application shell by default.

Light Delay's dark/cinematic styling remains appropriate to the legacy project app and its media. It is not the Studio design system.

## Surface hierarchy

Prefer, in order:

1. whitespace and alignment;
2. typography;
3. subtle tonal surface changes;
4. hairline separators;
5. borders only where an actual boundary matters;
6. shadows only for temporary elevation such as popovers/menus.

Do not turn semantic units into cards by default.

A scene, beat, paragraph, shot or storyboard frame is not automatically a card.

Use a card/container when the object genuinely needs independent selection, movement, grouping, comparison or status as a discrete unit.

## Geometry

- restrained corner radii;
- avoid large rounded rectangles around routine content;
- avoid nested bordered boxes;
- use compact gutters in dense working surfaces;
- maintain comfortable reading measure in prose surfaces;
- preserve stable document geometry when inspectors appear/disappear where practical.

## Typography

Typography carries hierarchy.

Use:
- a highly legible UI sans-serif/system stack for chrome and data;
- screenplay/document typography appropriate to the authored artifact;
- tabular numerals where timing/frame/count data benefits;
- restrained weight changes rather than excessive size jumps;
- compact labels and metadata.

Do not make every section title a large display heading.

## Color

Light mode is the first baseline.

Use a neutral background/surface/text system with a restrained accent for:
- selection/focus;
- primary action;
- links;
- semantic attention when warranted.

Status colors communicate meaning and must not become decoration.

Dark mode should later be designed as a first-class theme, not created by simply inverting the Light Delay palette.

## Borders and elevation

Default border: none.

When separation is required, prefer a single low-contrast hairline. Avoid borders around every row/item/paragraph.

Persistent surfaces should generally be flat. Popovers, menus, floating contextual tools and temporary overlays may use modest elevation.

## Density

Density follows the task.

**Write:** low chrome, generous reading rhythm.

**Story/World:** moderate density, compact relationships and metadata.

**Navigate:** graphical working canvas plus compact controls.

**Direct:** image-forward, narrow gutters, quiet metadata.

**Produce:** intentionally dense tables/lists/timelines.

**Review:** dense findings/annotations without oversized alert cards.

## Write

The resting Write surface should approach a plain professional text/screenplay editor:
- document centered at an appropriate measure;
- no permanent card around each scene or element;
- paragraphs flow continuously;
- semantic markers stay in margin/gutter;
- selection actions float temporarily;
- assistant/inspector are summonable;
- model terminology remains hidden unless requested.

## Storyboards and animatics

Frames should read as sequences, not dashboards.

Prefer:
- clean grids or filmstrips;
- narrow consistent gutters;
- image itself dominant;
- metadata beneath/alongside with low visual weight;
- selection indicated by a subtle outline/background;
- playback controls consolidated at sequence/view level.

Avoid:
- thick frame borders;
- large per-frame card padding;
- repeated headings inside every frame;
- deep nested panels.

## Lists, outlines and script structure

Prefer continuous editorial structures with indentation, alignment, compact disclosure controls and subtle separators.

Do not create a large visual gap merely because two adjacent paragraphs belong to different semantic objects.

## Interaction

Controls should appear in proportion to need:
- persistent when continuously necessary;
- contextual on selection/hover/focus;
- command-palette/shortcut accessible;
- advanced metadata in inspector;
- destructive/consequential operations explicit.

Hover-only behavior must have keyboard/focus/touch equivalents.

## Accessibility

Professional restraint must not reduce usability:
- WCAG-compliant contrast;
- visible keyboard focus;
- semantic HTML;
- minimum usable hit targets even when visuals are compact;
- reduced-motion support;
- no state communicated only by color;
- zoom/text scaling must not destroy the working surface.

## Initial design tokens

These are semantic roles, not a frozen palette:

```text
--studio-bg
--studio-surface
--studio-surface-subtle
--studio-text
--studio-text-muted
--studio-hairline
--studio-accent
--studio-focus
--studio-danger
--studio-warning
--studio-success

--studio-radius-sm
--studio-radius-md
--studio-space-*
--studio-reading-width
--studio-panel-width
```

Components consume semantic tokens rather than project colors.

## Shared UI rule

Share domain/application behavior aggressively. Share generic UI deliberately. Do not share product UI merely because the legacy app contains something visually similar.

Initial shared UI candidates are primitives such as Button, Popover, Dialog, SplitPane, Tooltip and CommandPalette. ScreenplayEditor, StoryTimeline, WorldInspector and ShotPlanner belong to Studio until reuse is demonstrated.

## Review question

At every UI review ask:

> Is this visual boundary communicating something the user needs, or merely exposing our component/domain structure?

If the latter, remove it.
