# svelte-glyph-capacity

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Svelte 5 sensor that measures rendered glyph dimensions and reports how much text fits in a
local container. It exposes raw pixel measurements, `maxChars × maxLines` capacity, pixel and text
orientations, and breakpoint flags as reactive data.

The repository also includes a workbench that compares measured glyph capacity with `px`, `rem`,
`em`, and calibrated `em/ch` container-query strategies across several adaptive layouts.

## Status and install

Pre-release. The package is not yet published to npm. It is developed in the
[light-delay](https://github.com/saabi/light-delay) repository under
`packages/svelte-glyph-capacity` as an npm workspace package; workspace consumers depend on it by
name:

```json
{ "dependencies": { "svelte-glyph-capacity": "0.1.0" } }
```

Once published it will install with `npm install svelte-glyph-capacity`.

## Basic usage

```svelte
<script lang="ts">
	import {
		GlyphCapacitySensor,
		emptyGlyphCapacityValue,
		type GlyphCapacityValue
	} from 'svelte-glyph-capacity';

	let capacity = $state<GlyphCapacityValue>(emptyGlyphCapacityValue);
</script>

<GlyphCapacitySensor class="panel" bind:value={capacity}>
	<p>{capacity.text.maxChars} characters × {capacity.text.maxLines} lines</p>
</GlyphCapacitySensor>
```

The child snippet can also receive the current value directly:

```svelte
<GlyphCapacitySensor>
	{#snippet children(capacity)}
		<p>{capacity.text.maxChars} × {capacity.text.maxLines}</p>
	{/snippet}
</GlyphCapacitySensor>
```

The measured element must have a rendered size. The component inherits its font properties from
its parent, so place typography such as `font-family`, `font-size`, `font-stretch`, and
`line-height` on the component or an ancestor.

## Props

| Prop          | Type                             | Default              | Purpose                                                    |
| ------------- | -------------------------------- | -------------------- | ---------------------------------------------------------- |
| `breakpoints` | `number[]`                       | `[45, 90, 135, 180]` | Character-capacity thresholds used for size flags.         |
| `capacityBox` | `'glyph-area' \| 'measured-box'` | `'glyph-area'`       | Selects the dimensions used for capacity calculations.     |
| `children`    | `Snippet<[GlyphCapacityValue]>`  | —                    | Renders content with the current measurement.              |
| `class`       | `string`                         | `''`                 | Class applied to the measured wrapper.                     |
| `dataUnit`    | `string`                         | —                    | Optional `data-unit` value for the wrapper.                |
| `isDev`       | `boolean`                        | `false`              | Shows a compact measurement overlay.                       |
| `lineHeight`  | `number`                         | —                    | Unitless line-height override used for `maxLines`.         |
| `sampleText`  | `string`                         | Latin alphabet       | Hidden glyph sample used to calculate average glyph width. |
| `style`       | `string`                         | —                    | Inline style applied to the measured wrapper.              |
| `value`       | `GlyphCapacityValue`             | empty value          | Bindable reactive measurement result.                      |

## Measurement result

`GlyphCapacityValue` contains:

- `container`: the observed border-box width, height, and pixel aspect ratio.
- `capacityBox`: the dimensions actually used for capacity calculations.
- `glyph`: average sample-glyph width and rendered sample height.
- `text`: `maxChars`, `maxLines`, and their text-capacity aspect ratio.
- `orientations`: independent pixel and text landscape/portrait flags.
- `sizes`: cumulative `xSmall`, `small`, `medium`, `large`, and `xLarge` flags.
- `classes`: enabled size and orientation names as a space-separated string.

`value.classes` is data only. The component does not append those generic names to the wrapper;
consumers can map the flags to locally scoped classes or application state.

## Capacity semantics

The sensor answers one question: how many glyphs fit in the container's text area? Only space that
actually reduces that area is excluded.

The default `glyph-area` mode uses the observed **content box** on both axes. Borders, padding and
scrollbars are excluded, because text cannot be laid out there. Margins are never deducted: they
sit outside the element and do not change how much text fits inside it.

```text
glyph-area width = border-box width − borders − padding − vertical scrollbar
```

Content-box changes are observed directly, so padding, border and scrollbar changes that leave the
border box unchanged still update the result. The raw border box remains available through
`value.container`.

Use `capacityBox="measured-box"` to calculate capacity from the border box without deductions.

The glyph sample is measured at `line-height: 1`. Horizontal capacity is:

```text
floor(capacityBox.width / averageGlyphWidth)
```

Vertical capacity uses the container's rendered line box by default:

```text
floor(capacityBox.height / lineBoxHeight)
```

When `lineHeight` is supplied, it is treated as a unitless multiplier of the measured glyph height.

## Breakpoint flags

`breakpoints` must be four finite, positive, strictly ascending numbers. Any other value logs one
console warning and the defaults are used instead.

With the default breakpoints:

- `xSmall` is enabled below 45 characters.
- `small` is always enabled as the baseline size.
- `medium` is enabled from 90 characters.
- `large` is enabled from 135 characters.
- `xLarge` is enabled from 180 characters.

The orientation names included in `classes` are `pixelLandscape`, `pixelPortrait`,
`textLandscape`, and `textPortrait`.

## Containment: give sensed containers a layout-determined size

The sensor measures the container, and consumers usually change the container's content based on
the measurement. If the container is sized by that content (for example an auto-height block whose
content grows when capacity drops), the two form a feedback loop: a smaller mode makes the content
shorter, the shorter container reports more capacity, the larger mode makes it taller again, and
the value flips every frame.

Size sensed containers from layout instead of content, for example:

- `container-type: size` (or `inline-size` when only width drives decisions) on the container;
- a grid or flex track that fixes its size;
- explicit dimensions.

In development, the sensor detects this loop (capacity alternating between the same two values
within half a second) and logs one console warning naming the two capacities. The fix is in the
layout, not in the sensor.

## Update behavior

`value` is reassigned only when a measured field changes. Resize notifications that produce the
same capacity, glyph and container dimensions do not publish a new object, so derived state and
effects that depend on `value` do not re-run on every resize frame.

## Font loading

Measurements update through `ResizeObserver` when the container, glyph sample, or inherited line
box changes. For deterministic initial measurements with web fonts, wait for `document.fonts.ready`
before treating the first non-empty value as final.

The component requires browser support for `ResizeObserver` (with `box: 'content-box'`) and
`requestAnimationFrame`. It can be server-rendered, but measurements remain empty until hydration
and layout occur in the browser.

## Demo and development

```sh
npm install
npm run dev
```

Then open the local URL printed by Vite. The demo compares five strategies using the same font
environment and scenarios. `/fixtures` holds the deterministic cases used by
`tests/glyph-capacity-fixtures.spec.ts` (scrollbar exclusion, size flags, oscillation, invalid
breakpoints).

Inside light-delay, run the scripts from the repository root with
`npm run <script> -w svelte-glyph-capacity`. To use an existing Chromium instead of Playwright's
bundled browser, set `PLAYWRIGHT_CHROMIUM_PATH`.

Useful commands:

```sh
npm run check       # Svelte and TypeScript diagnostics
npm test            # Playwright sensor, fixture and demo tests
npm run build       # static demo build
npm run package     # generate the publishable dist directory
npm run publint     # validate package metadata and exports
npm run validate    # full local validation
```

## License

The component source is available under the [MIT License](LICENSE). The bundled Archivo files are
demo-only assets licensed separately under the SIL Open Font License 1.1; see
[`static/fonts/archivo/OFL.txt`](static/fonts/archivo/OFL.txt).
