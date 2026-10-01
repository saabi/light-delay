# svelte-glyph-capacity

[![CI](https://github.com/saabi/svelte-glyph-capacity/actions/workflows/ci.yml/badge.svg)](https://github.com/saabi/svelte-glyph-capacity/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/svelte-glyph-capacity.svg)](https://www.npmjs.com/package/svelte-glyph-capacity)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Svelte 5 sensor that measures rendered glyph dimensions and reports how much text fits in a
local container. It exposes raw pixel measurements, `maxChars × maxLines` capacity, pixel and text
orientations, and breakpoint flags as reactive data.

The repository also includes a workbench that compares measured glyph capacity with `px`, `rem`,
`em`, and calibrated `em/ch` container-query strategies across several adaptive layouts.

## Install

```sh
npm install svelte-glyph-capacity
```

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

The default `glyph-area` mode starts with the observed border box and subtracts computed margins,
borders, and padding on both axes. Margin deduction is intentionally conservative even though CSS
margins sit outside the observed border box. The raw observed dimensions remain available through
`value.container`.

Use `capacityBox="measured-box"` to calculate capacity from the observed box without deductions.

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

With the default breakpoints:

- `xSmall` is enabled below 45 characters.
- `small` is always enabled as the baseline size.
- `medium` is enabled from 90 characters.
- `large` is enabled from 135 characters.
- `xLarge` is enabled from 180 characters.

The orientation names included in `classes` are `pixelLandscape`, `pixelPortrait`,
`textLandscape`, and `textPortrait`.

## Font loading

Measurements update through `ResizeObserver` when the container, glyph sample, or inherited line
box changes. For deterministic initial measurements with web fonts, wait for `document.fonts.ready`
before treating the first non-empty value as final.

The component requires browser support for `ResizeObserver`, `MutationObserver`, and
`requestAnimationFrame`. It can be server-rendered, but measurements remain empty until hydration
and layout occur in the browser.

## Demo and development

```sh
npm install
npm run dev
```

Then open the local URL printed by Vite. The demo compares five strategies using the same font
environment and scenarios.

Useful commands:

```sh
npm run check       # Svelte and TypeScript diagnostics
npm test            # Playwright sensor and demo tests
npm run build       # static demo build
npm run package     # generate the publishable dist directory
npm run publint     # validate package metadata and exports
npm run validate    # full local validation
```

## License

The component source is available under the [MIT License](LICENSE). The bundled Archivo files are
demo-only assets licensed separately under the SIL Open Font License 1.1; see
[`static/fonts/archivo/OFL.txt`](static/fonts/archivo/OFL.txt).
