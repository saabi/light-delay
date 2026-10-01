# Studio UI design system

Status: **product design baseline**, revised Oct 1, 2026 after the [Write UX review](reviews/2026-10-01-studio-write-ux-review-claude.md).

Studio is a professional creative application, not a visual extension of the Light Delay film identity.

## How to read this document

The character section describes the feel. The rest are requirements. **Must** is a requirement that a review fails without; **should** is a default that needs a stated reason to break. Most requirements have a matching item in the [review checklist](#review-checklist). A design that satisfies the prohibitions here while lacking the capabilities is not compliant: minimal means removing noise, never removing what the task needs.

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

The application always identifies itself in a fixed place (see [Shell anatomy](#shell-anatomy)). A project name never occupies that place.

## Shell anatomy

One application bar, at most `2.75rem` tall at 100% text scale. From left to right:

1. **Identity slot.** The application mark, plus the wordmark when the [size class](#breakpoints-measured-in-characters) is `small` or larger. It is fixed in position and width, links to the workspace home, is monochrome, and is sized in `rem` so it follows text scaling. It never shows a project name, project art or document title. Until the product has a name and mark, the slot holds a neutral text wordmark ("Studio") and keeps its reserved width.
2. **Context breadcrumb.** `Project ▾ / Document · Cut ▾`. Each part is a menu: the project switcher, the document switcher and the cut/version switcher.
3. **Save state**, immediately after the breadcrumb. It is the only place the document's save state appears (see [State and vocabulary](#state-and-vocabulary)).
4. **Lens switcher**, centred, shown only when two or more lenses exist. A single lens is not shown as a tab.
5. **Contextual actions** at the right: History, the commit action when there is something to commit, and later the command palette and assistant entry.

The shell must not have a second persistent bar or a footer. The document's own title belongs to the document surface, as a quiet running header above the page, not to the application bar's identity slot.

## Units, type and responsive mechanics

This section adopts the method the owner uses in Color Lab, Spanwise and svizzle, described in [*Glyph metrics and responsive design*](https://ferreyrapons.com/notes/glyph-metrics-responsive-design): layout decisions follow how many characters and lines fit, not how many pixels the screen has.

### Units

- `html { font-size: calc(100% * var(--studio-font-scale)) }`. The root follows the browser's default text size, multiplied by the in-app [readability scale](#readability-preferences). Color Lab fixes its root at 13 px for a dense audience; Studio keeps the browser default so a user's system text setting is honoured.
- Every font size, spacing, measure and control size must be in `rem` (global) or `em`/`ch`/`lh` (local to a component's own text). `px` is allowed only for hairlines, borders, outlines, shadows and canvas internals.
- Spacing inside a component should be in `em`, so it scales with that component's text. Spacing between regions uses the `rem` scale.
- Application type must not scale with viewport width (`vw` or `clamp()` with `vw`). Type is stable; layouts step between size classes.

### Type and line-height tokens

| Token | Value | Use |
| --- | --- | --- |
| `--studio-text-xs` | `0.75rem` | Floor. Metadata only, never body or controls |
| `--studio-text-sm` | `0.8125rem` | Secondary labels |
| `--studio-text-ui` | `0.875rem` | Default interface text and controls |
| `--studio-text-md` | `1rem` | Panel headings, prose |
| `--studio-text-lg` | `1.125rem` | Rare section titles |
| `--studio-line-height` | `1.45` | Interface default; the readability preference overrides it |

Interface line heights are multiples of `--studio-line-height` (for example `--studio-line-height-snug: calc(var(--studio-line-height) * 0.93)`), so the readability preference reaches every one of them. Weight changes carry hierarchy before size changes do.

### Screenplay geometry in characters

The screenplay format is itself defined in glyph units: Courier at 12 pt, 10 characters per inch, 6 lines per inch. Studio sets the screenplay face (Courier Prime) at `1rem`, which is exactly 12 pt at 100% scale, and expresses all page geometry in `ch` and `lh` of that face. Because the face is monospaced, `ch` is exact, the on-screen page has the same measure as the printed page, and the whole page follows text scaling.

| Element | Indent from text margin | Width |
| --- | --- | --- |
| Page | margins `15ch` left, `10ch` right | `85ch` total |
| Scene heading, action | `0` | `60ch` |
| Character cue | `22ch` | to `60ch` |
| Parenthetical | `16ch` | ≈ `20ch` |
| Dialogue | `10ch` | `35ch` |
| Transition | right-aligned | ends at `60ch` |

Line spacing on the page is single (`line-height: 1`, one 12 pt line), with one blank line between elements, so on-screen page length tracks the printed page. These values follow common industry practice and should be checked against a reference PDF export when export exists.

Below the size class that fits the page, the page drops its paper margins and the indents compress proportionally (character cue ≈ 40% of the measure, dialogue indent ≈ 15%, dialogue width ≈ 70%). The face and size never shrink.

### Breakpoints measured in characters

A single screen sensor, equivalent to svizzle's `ScreenSensor`, measures the interface face:

```text
glyph.width  = sampleWidth / sampleLength   (hidden alphabet sample at 1rem, ResizeObserver)
glyph.height = sample line block size
maxChars     = floor(viewportWidth  / glyph.width)
maxLines     = floor(viewportHeight / glyph.height)
```

- It measures only after the bundled fonts have loaded (Font Loading API), so a fallback face never decides the layout.
- It is the single source of layout classes. Components read its result; they do not query viewport pixels.
- Because sizes are in `rem`, raising the text scale lowers `maxChars`, and the layout steps down on its own. This is intended and must be tested.

| Class | `maxChars` | Write layout |
| --- | --- | --- |
| `xSmall` | < 45 | Phone. Page without paper margins, compressed indents. Panels are full-height sheets. Identity shows the mark only |
| `small` | 45–89 | Page without paper margins. Panels are sheets over the page |
| `medium` | 90–134 | Full page with margins. Panels float over the margin area |
| `large` | 135–179 | As medium. A pinned inspector may sit beside the page (see [Layout stability](#layout-stability)) |
| `xLarge` | ≥ 180 | A panel fits beside the centred page without covering or moving it |

Thresholds start at svizzle's defaults `[45, 90, 135, 180]`. At 100% scale a full screenplay page needs about 92 interface characters and a page plus a `20rem` panel about 135, so the defaults fall on Studio's real needs; recalibrate when the faces are final.

Height uses `maxLines` instead of pixels: below 30 lines the shell hides everything optional (for example a phone in landscape). Studio does not use pixel orientation, which avoids the disagreement between pixel orientation and character size classes noted in the article.

### Container-level character breakpoints

A component that lives in variable space (a panel, a pane, a list) adapts to its own width with container queries written in `ch`, for example `@container (min-width: 40ch)`. CSS evaluates `ch` in a container query against the query container's own font; this was verified in Chromium 141 and must be covered by a browser test. This gives each container the same "what fits" logic as the global sensor, which the article lists as an open limitation. Media queries must not use `em` or `ch` as if they referred to the application's face: in media queries those units refer to the browser's initial font.

### Fonts

- Inter (interface) and Courier Prime (screenplay) must be bundled with Studio as WOFF2, with subsets as needed. Studio must not load fonts from remote services.
- Fallback faces should declare metric overrides (`size-adjust`, `ascent-override`) close to the real faces, to minimise layout shift before load.

### Readability preferences

Adopted from Color Lab's accessibility controls and svizzle's accessibility menu:

| Preference | Values | Effect |
| --- | --- | --- |
| Text scale | 100, 112, 125, 150, 175 % | `--studio-font-scale` on the root |
| Secondary contrast | normal, high, maximum | Overrides the muted text tokens |
| Line height | 125, 145, 165, 185 % | `--studio-line-height` |

- Preferences are local to the browser, not project data, and not part of any document.
- They are applied before first paint by an inline script in `app.html`, so the page never renders at the wrong scale first.
- The preferences menu is always readable: it never applies dense styling to itself.
- Studio also follows `prefers-contrast` and `prefers-reduced-motion`.
- The screenplay page keeps single line spacing for page fidelity. A separate, explicit "comfortable spacing" view may relax it.

Right-to-left scripts, vertical text and CJK line breaking are out of scope for now, as in the article. Layouts where images and text compete for space (Direct) are to be revisited when that lens exists.

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
- prose measure between `52ch` and `72ch`;
- document geometry stays stable when inspectors appear or disappear (see [Layout stability](#layout-stability)).

## Typography

Typography carries hierarchy.

Use:

- Inter for chrome and data, with tabular numerals where timing, frame or count data benefits;
- Courier Prime for the screenplay, in the [character geometry](#screenplay-geometry-in-characters) above;
- restrained weight changes rather than size jumps;
- compact labels and metadata, never below `--studio-text-xs`.

Do not make every section title a large display heading.

## Color

Light mode is the first baseline.

Use a neutral background/surface/text system with a restrained accent for:

- selection/focus;
- primary action;
- links;
- semantic attention when warranted.

Status colors communicate meaning and must not become decoration. No state may be shown by color alone.

Every text token must meet WCAG AA (4.5:1) on every surface it is used on, at the default contrast preference. A unit test computes these ratios from the tokens.

Dark mode should later be designed as a first-class theme, not created by simply inverting the Light Delay palette.

## Borders and elevation

Default border: none.

When separation is required, prefer a single low-contrast hairline. Avoid borders around every row/item/paragraph.

Persistent surfaces should generally be flat. Popovers, menus, floating panels, sheets and temporary overlays may use modest elevation.

## Density

Density follows the task.

**Write:** low chrome, generous reading rhythm.

**Story/World:** moderate density, compact relationships and metadata.

**Navigate:** graphical working canvas plus compact controls.

**Direct:** image-forward, narrow gutters, quiet metadata.

**Produce:** intentionally dense tables/lists/timelines.

**Review:** dense findings/annotations without oversized alert cards.

## Write

The resting Write surface must behave as a professional screenplay editor, not as a form.

### Editor model

- The screenplay is **one continuous editable document**. Elements are typed blocks within it, not separate input fields.
- **Enter** ends the current element and starts the conventional next one: action → action, character cue → dialogue, dialogue → action, scene heading → action.
- **Tab / Shift+Tab** on an empty or new element cycles its type (action → character → transition → scene heading …), following screenwriting-software convention.
- Every element type can be created from the keyboard. No element type depends on a button.
- Selection, clipboard, undo and redo work across elements.
- Each block keeps its stable element ID underneath. Splitting, merging and pasting must preserve or explicitly create IDs, so semantic anchors survive editing.
- Text is never clipped, scrolled inside an element, or hidden. Elements grow with their content.
- No form artifacts: no resize grips, field borders, or per-element scroll bars.
- Element actions (move, change type, remove) live in a gutter handle that opens a small menu, with keyboard equivalents (for example Alt+↑/↓ to move). They are not hover-only text.

### Never lose typed text

- An action that would replace unsaved text (switching cut or document, reloading, closing) must save it first, or ask.
- The interface must never promise a protection that does not exist. "Kept on this device" appears only when local persistence actually holds the text.
- Autosave failures are visible in the save state and never silently retried forever.

### Saving and committing

Per the [ADR-0004 addendum](ADR-0004-AUTHORING-STORY-STATE-AND-PROVISIONAL-WORK.md#addendum--saving-and-committing-in-write-oct-1-2026):

- Typing autosaves the Draft (debounced). There is no Save button in the normal flow.
- One deliberate **commit** action appears only when there are uncommitted changes. It shows the changes inline in the page as track changes and commits on confirmation. Its final label is chosen in the prototype ("Commit changes" is the working label).
- The proposal review surface is for proposals that did not come from the author's own typing: AI suggestions, imports, collaborators.

### Review and history

- Changes are reviewed where they live: inline in the document, with removed text struck and inserted text marked, not only by colour. A side list may summarise several changes and jump to each.
- History is newest first. Entries read like "You · 10:42 · Revised Mara's line"; they never show IDs.
- Restore shows the restored text before it happens and asks for confirmation. Restore is not offered for the current state.

### Ambient intelligence

- semantic markers stay in the margin/gutter;
- selection actions float temporarily;
- the assistant and the inspector are summonable;
- model terminology remains hidden unless requested.

## State and vocabulary

The save state is shown in one place, beside the breadcrumb. It is short, plain and never duplicated in another bar, header or footer.

| Situation | Studio shows |
| --- | --- |
| Draft persisted | Saved |
| Save in flight | Saving… |
| Retrying after a connection failure | Reconnecting… |
| Not persisted, held locally | Offline — kept on this device (only when true) |
| Not persisted, not held locally | Not saved — Retry |
| Save outcome unknown | Couldn't confirm save — Retry |
| Uncommitted changes exist | the commit action appears |
| Committed | Committed, briefly; History holds the detail |
| Suggestions from elsewhere pending | Suggested changes · n |

Words that must not appear on normal surfaces: authoritative, projection, provisional, Proposal (as a type name), ChangeSet, revision number, principal, schema, scope, any internal ID. Advanced or engineering views may show them on request.

## Layout stability

- Opening or closing a transient panel, sheet, popover or notice must not move the document text. Panels float over the margin or page edge, or sit in space that is already free.
- A user may **pin** an inspector, which repositions the page once as a deliberate, persisted layout choice. Unpinning returns it.
- Connectivity and other notices are non-blocking overlays (toasts or the save state), not bars inserted above the document.

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

Consequential operations (restore, discard, remove a cut, reject a suggestion set) must show what will change before it changes and must ask for confirmation. An operation that would change nothing must not be offered. The primary action is disabled or hidden when it has nothing to act on.

## Accessibility

Professional restraint must not reduce usability. Minimums at 100% text scale:

- text: `0.75rem` (12 px) absolute floor, `0.875rem` for controls and body;
- contrast: WCAG AA for all text tokens, checked by test;
- hit targets: at least `1.5rem` (24 px) square, even when the visual mark is smaller;
- focus: a visible indicator on every focusable element, including the editor's current element (not only a caret);
- semantic HTML and correct roles for the editor, menus, sheets and dialogs;
- no state communicated only by color;
- zoom and text scaling up to 200% keep the working surface usable (verified through the size classes);
- reduced-motion support.

## Design tokens

These are semantic roles, not a frozen palette:

```text
--studio-bg  --studio-surface  --studio-surface-subtle
--studio-text  --studio-text-muted  --studio-hairline
--studio-accent  --studio-focus  --studio-danger  --studio-warning  --studio-success

--studio-font-scale  --studio-line-height  --studio-line-height-*
--studio-text-xs  --studio-text-sm  --studio-text-ui  --studio-text-md  --studio-text-lg
--studio-font-ui  --studio-font-screenplay

--studio-space-*          (rem scale: 0.25, 0.5, 0.75, 1, 1.5, 2, 3)
--studio-radius-sm  --studio-radius-md
--studio-measure-prose    (52ch–72ch)
--studio-panel-width      (rem)
--studio-target-min       (1.5rem)
--studio-sp-*             (screenplay geometry in ch, see table)
--studio-breakpoints      (45, 90, 135, 180 characters)
```

Components consume semantic tokens rather than project colors. Muted text starts at about `#666661` on `#f7f7f5` (5.4:1).

## Shared UI rule

Share domain/application behavior aggressively. Share generic UI deliberately. Do not share product UI merely because the legacy app contains something visually similar.

Initial shared UI candidates are primitives such as Button, Popover, Dialog, Sheet, SplitPane, Tooltip, CommandPalette, the screen sensor and the readability-preferences driver. ScreenplayEditor, StoryTimeline, WorldInspector and ShotPlanner belong to Studio until reuse is demonstrated.

## Reference states

Wireframes of the required states. Proportions are indicative; behaviour is normative.

Write at rest (`medium` or larger):

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ ◇ Studio   Harbor Light ▾ / Scene · Feature ▾   Saved       History      │
├──────────────────────────────────────────────────────────────────────────┤
│                 Harbor Light — Scene                                     │
│           ┌─────────────────────────────────────────┐                    │
│           │ EXT. HARBOR LIGHT — NIGHT               │                    │
│           │                                         │                    │
│           │ Mara steadies the lamp as the last      │                    │
│           │ ferry clears the breakwater.            │                    │
│           │                                         │                    │
│           │                MARA                     │                    │
│           │      Leave the channel open.            │                    │
│           └─────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────────────┘
```

Editing, with uncommitted changes:

```text
│ ◇ Studio   Harbor Light ▾ / Scene · Feature ▾   Saving…   History  [Commit changes] │
```

Commit review, inline in the page (the page does not move):

```text
│           │                MARA                     │   ┌ Commit changes ─────┐ │
│           │      Leave the channel open. +Keep the  │   │ 1 change in Feature │ │
│           │      +lamp lit.+                        │   │ [Cancel]  [Commit]  │ │
│           │                                         │   └─────────────────────┘ │
```

History with restore preview:

```text
│   ┌ History ──────────────────────────┐
│   │ You · 10:42 · Revised Mara's line │  ← current, no Restore
│   │ You · 10:15 · Added action        │  [Preview]
│   │ Initial screenplay                │  [Preview]
│   └───────────────────────────────────┘
│   Preview shows the restored page; [Restore this version] asks for confirmation.
```

Offline:

```text
│ ◇ Studio   Harbor Light ▾ / Scene · Feature ▾   Offline — kept on this device  ↻ │
```

Phone (`xSmall`):

```text
┌───────────────────────────┐
│ ◇  Scene · Feature ▾  Saved│
├───────────────────────────┤
│ EXT. HARBOR LIGHT — NIGHT │
│                           │
│ Mara steadies the lamp as │
│ the last ferry clears the │
│ breakwater.               │
│                           │
│           MARA            │
│   Leave the channel open. │
└───────────────────────────┘
```

## Review checklist

Pass/fail for any Studio UI change. Each item should have an automated check where practical.

1. The identity slot shows the application, never the project; the document title is on the document surface.
2. One application bar; no second persistent bar; no footer; no single-item lens switcher.
3. No `px` font sizes; no `vw` type; sizes in `rem`/`em`/`ch`/`lh`.
4. Layout classes come from the character sensor or `ch` container queries, not pixel media queries.
5. Raising text scale to 175% steps the layout down and keeps Write usable.
6. Screenplay page geometry is in `ch` of the screenplay face and matches the table.
7. Fonts are bundled; nothing loads from remote services; the sensor measures after fonts load.
8. Readability preferences apply before first paint and persist locally.
9. Enter, Tab and Shift+Tab follow screenplay conventions; every element type is creatable by keyboard; selection and undo cross elements.
10. No text is clipped at any size class (test compares content height to box height).
11. No action discards unsaved text without saving or asking.
12. Save state appears once, uses the vocabulary table, and never claims protection that does not exist.
13. No forbidden internal vocabulary or IDs on normal surfaces.
14. Opening or closing any transient panel or notice does not move document text (test compares element positions).
15. Consequential actions preview and confirm; no-op actions are not offered.
16. Text tokens pass AA; text ≥ `0.75rem`; targets ≥ `1.5rem`; focus visible on every focusable element.
17. Phone layout (`xSmall`) shows the full text of every element.

## Review question

At every UI review ask:

> Is this visual boundary communicating something the user needs, or merely exposing our component/domain structure?

If the latter, remove it. Then ask the converse:

> Can the user do everything this surface exists for, from the keyboard, without losing work?

If not, the surface is incomplete however quiet it looks.
