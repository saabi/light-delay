<script lang="ts">
	import type { Snippet } from 'svelte';
	import { GlyphCapacitySensor, emptyGlyphCapacityValue, type GlyphCapacityValue } from '$lib';
	import { LOREM_COPY, type Typeface } from '../types';

	let {
		body,
		children,
		typeface,
		useLoremCopy
	}: {
		body: string;
		children: Snippet;
		typeface: Typeface;
		useLoremCopy: boolean;
	} = $props();

	let panelFit = $state<GlyphCapacityValue>(emptyGlyphCapacityValue);

	function fitHeader(node: HTMLElement, _key: Typeface) {
		const h1El = node.querySelector('h1');
		const h2El = node.querySelector('h2');
		if (!(h1El instanceof HTMLElement) || !(h2El instanceof HTMLElement)) return;

		const h1 = h1El;
		const h2 = h2El;
		let h1Ratio = 0;
		let h2Ratio = 0;

		function measureRatio(el: HTMLElement) {
			const clone = el.cloneNode(true) as HTMLElement;
			const computed = window.getComputedStyle(el);
			clone.style.position = 'absolute';
			clone.style.left = '-10000px';
			clone.style.top = '0';
			clone.style.width = 'max-content';
			clone.style.maxWidth = 'none';
			clone.style.visibility = 'hidden';
			clone.style.pointerEvents = 'none';
			clone.style.fontFamily = computed.fontFamily;
			clone.style.fontWeight = computed.fontWeight;
			clone.style.fontStyle = computed.fontStyle;
			clone.style.fontStretch = computed.fontStretch;
			clone.style.letterSpacing = computed.letterSpacing;
			clone.style.lineHeight = computed.lineHeight;
			clone.style.fontSize = '100px';
			node.appendChild(clone);
			const width = clone.getBoundingClientRect().width;
			clone.remove();
			return width > 0 ? 100 / width : 0;
		}

		function apply() {
			const width = node.clientWidth;
			if (width <= 0) return;
			if (h1Ratio > 0) h1.style.fontSize = `${0.98 * width * h1Ratio}px`;
			if (h2Ratio > 0) h2.style.fontSize = `${0.98 * width * h2Ratio}px`;
		}

		function measure() {
			h1.style.fontSize = '';
			h2.style.fontSize = '';
			h1Ratio = measureRatio(h1);
			h2Ratio = measureRatio(h2);
			apply();
		}

		const ro = new ResizeObserver(apply);
		ro.observe(node);
		measure();

		return {
			update() {
				requestAnimationFrame(measure);
			},
			destroy() {
				ro.disconnect();
			}
		};
	}

	function measureIdentityRail(node: HTMLElement, _key: Typeface) {
		const shell = node.closest('.stage-shell');
		if (!(shell instanceof HTMLElement)) return;
		const shellEl = shell;

		function apply() {
			const rect = node.getBoundingClientRect();
			if (rect.height > 0) {
				shellEl.style.setProperty('--identity-rail-height', `${rect.height}px`);
			}
		}

		const ro = new ResizeObserver(apply);
		ro.observe(node);
		apply();

		return {
			update() {
				requestAnimationFrame(apply);
			},
			destroy() {
				ro.disconnect();
				shellEl.style.removeProperty('--identity-rail-height');
			}
		};
	}
</script>

<div class="stage-shell">
	<div class="identity-rail" use:measureIdentityRail={typeface}>
		<header class="site-header" use:fitHeader={typeface}>
			<h1>Sebastian Ferreyra Pons</h1>
			<h2>
				Staff Product Engineer & Software Architect<br />
				Data-Rich Web Systems · Technical Leadership
			</h2>
		</header>
		<nav class="stub-menu" aria-label="Section stubs">
			<a href="/">About</a>
			<a href="/">Work</a>
			<a href="/">Notes</a>
			<a href="/">Lab</a>
		</nav>
	</div>
	<div class="particle-icon-slot" aria-hidden="true">
		<div class="particle-icon-stub">selected icon</div>
	</div>
	<div class="utility-menu" aria-hidden="true">
		<span class="utility-menu__burger"></span>
	</div>
	<section class="stub-cv">
		<div class="content">
			<h2>Section panel</h2>
			<div class="content__body">
				<GlyphCapacitySensor class="panel-capacity-sensor" bind:value={panelFit} />
				<p>{useLoremCopy ? LOREM_COPY : body}</p>
				{@render children()}
				<p class="panel-fit-readout">
					panel box {panelFit.container.width.toFixed(0)}×{panelFit.container.height.toFixed(0)}
					· glyph area {panelFit.capacityBox.width.toFixed(0)}×{panelFit.capacityBox.height.toFixed(
						0
					)}
					· fit {panelFit.text.maxChars}×{panelFit.text.maxLines}
					= {panelFit.text.maxChars * panelFit.text.maxLines}
				</p>
			</div>
		</div>
	</section>
</div>

<style>
	.stage-shell {
		--selected-icon-size: var(--identity-rail-height, 6.3em);
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns:
			minmax(14em, min(31.25em, calc(100% - var(--selected-icon-size) - 4em)))
			minmax(0, 1fr)
			var(--selected-icon-size);
		grid-template-rows: auto minmax(0, 1fr);
		grid-template-areas:
			'identity spacer selected'
			'panel panel panel';
		gap: 0.85em 1.2em;
		box-sizing: border-box;
		padding: 1.2em 1.2em 1.2em;
		overflow: hidden;
	}

	.identity-rail {
		grid-area: identity;
		z-index: 4;
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.45em;
		align-self: start;
	}

	.site-header {
		width: 100%;
		margin: 0;
		pointer-events: none;
	}

	.site-header h1,
	.site-header h2 {
		display: inline-block;
		white-space: nowrap;
	}

	.site-header h1 {
		margin: 0;
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: 0;
	}

	.site-header h2 {
		margin: 0.2em 0 0;
		font-weight: 400;
		line-height: 1.2;
		color: #d4a34d;
	}

	.stub-menu {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.35em 0.8em;
		width: 100%;
		margin: 0;
		padding: 0;
	}

	.stub-menu a {
		color: #f1f6ff;
		font-size: 0.82em;
		text-decoration: underline;
		text-underline-offset: 0.12em;
	}

	.particle-icon-slot {
		grid-area: selected;
		z-index: 4;
		container-type: size;
		display: grid;
		place-items: center;
		min-width: 0;
		min-height: 0;
		pointer-events: none;
	}

	.particle-icon-stub {
		box-sizing: border-box;
		aspect-ratio: 1;
		width: min(75cqw, 75cqh);
		height: auto;
		display: grid;
		place-items: center;
		border: 1px dashed rgba(180, 220, 255, 0.65);
		border-radius: 0.25rem;
		background: rgba(80, 140, 200, 0.2);
		color: rgba(230, 242, 255, 0.82);
		font-family: ui-monospace, monospace;
		font-size: 0.62em;
		line-height: 1.1;
		text-align: center;
		text-transform: uppercase;
	}

	.utility-menu {
		position: absolute;
		z-index: 5;
		top: 2em;
		right: 1em;
		width: 2em;
		height: 2em;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.35);
	}

	.utility-menu__burger {
		display: block;
		width: 1em;
		height: 0.65em;
		border-top: 0.125rem solid #ead583;
		border-bottom: 0.125rem solid #ead583;
		box-shadow: 0 -0.3125rem 0 #ead583;
		box-sizing: border-box;
	}

	.stub-cv {
		grid-area: panel;
		z-index: 4;
		display: flex;
		flex-direction: column;
		min-height: 0;
		height: 100%;
		overflow: hidden;
		border-radius: 0.375rem;
		background: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.65);
		color: #000000;
	}

	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		height: 100%;
		padding: 0;
	}

	.content h2 {
		position: sticky;
		top: 0;
		z-index: 2;
		flex-shrink: 0;
		margin: 0 0 1em;
		padding: 0.55em 0.9em;
		font-size: 1.05em;
		line-height: 1.15;
		background: #774000;
		color: #ffffff;
	}

	.content__body {
		position: relative;
		flex: 1;
		min-height: 0;
		line-height: 1.42;
	}

	.content__body :global(.panel-capacity-sensor) {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.content :global(p) {
		width: min(36em, calc(100% - 2em));
		margin: 0 auto;
		font-size: 0.95em;
		line-height: inherit;
	}

	.content :global(.metric-readout),
	.content :global(.unit-readout),
	.content :global(.capacity-readout),
	.content :global(.panel-fit-readout) {
		margin-top: 0.8em;
		padding: 0.35em 0.5em;
		overflow: hidden;
		border-radius: 0.1875rem;
		background: #eef2f7;
		color: #162033;
		font-family: ui-monospace, monospace;
		font-size: 0.72em;
		line-height: 1.25;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.content :global(.metric-readout) {
		background: #e7f0ff;
	}

	.content :global(.capacity-readout),
	.content :global(.panel-fit-readout) {
		margin-top: 0.35em;
		background: #fff1b8;
		font-weight: 700;
	}

	@container stage-px (max-width: 768px) {
		.stage-shell {
			--selected-icon-size: 4.9em;
			grid-template-columns: minmax(0, 1fr) var(--selected-icon-size);
			grid-template-rows: auto minmax(0, 1fr);
			grid-template-areas:
				'identity selected'
				'panel panel';
			gap: 0.85em 0.8em;
			padding: 1.2em 1em 1em;
		}
		.stub-menu {
			justify-content: space-between;
		}
		.content :global(p) {
			width: calc(100% - 1.6em);
		}
	}

	@container stage-rem (max-width: 48rem) {
		.stage-shell {
			--selected-icon-size: 4.9em;
			grid-template-columns: minmax(0, 1fr) var(--selected-icon-size);
			grid-template-rows: auto minmax(0, 1fr);
			grid-template-areas:
				'identity selected'
				'panel panel';
			gap: 0.85em 0.8em;
			padding: 1.2em 1em 1em;
		}
		.stub-menu {
			justify-content: space-between;
		}
		.content :global(p) {
			width: calc(100% - 1.6em);
		}
	}

	@container stage-em (max-width: 48em) {
		.stage-shell {
			--selected-icon-size: 4.9em;
			grid-template-columns: minmax(0, 1fr) var(--selected-icon-size);
			grid-template-rows: auto minmax(0, 1fr);
			grid-template-areas:
				'identity selected'
				'panel panel';
			gap: 0.85em 0.8em;
			padding: 1.2em 1em 1em;
		}
		.stub-menu {
			justify-content: space-between;
		}
		.content :global(p) {
			width: calc(100% - 1.6em);
		}
	}

	@container stage-px (max-width: 1200px) and (max-height: 512px) and (orientation: landscape) {
		.stage-shell {
			--selected-icon-height: min(27.3cqw, 26cqh);
			grid-template-columns: 35% minmax(0, 1fr);
			grid-template-rows: auto var(--selected-icon-height) minmax(0, 1fr);
			grid-template-areas:
				'identity panel'
				'selected panel'
				'utility panel';
			gap: 0.55em 2%;
			padding: 5% 2%;
		}
		.stub-menu {
			justify-content: flex-start;
			gap: 0.3em;
		}
		.stub-menu a {
			flex: 1 1 0;
			font-size: 0.72em;
		}
		.utility-menu {
			position: relative;
			grid-area: utility;
			top: auto;
			right: auto;
			left: auto;
			bottom: auto;
			align-self: end;
		}
	}

	@container stage-rem (max-width: 75rem) and (max-height: 32rem) and (orientation: landscape) {
		.stage-shell {
			--selected-icon-height: min(27.3cqw, 26cqh);
			grid-template-columns: 35% minmax(0, 1fr);
			grid-template-rows: auto var(--selected-icon-height) minmax(0, 1fr);
			grid-template-areas:
				'identity panel'
				'selected panel'
				'utility panel';
			gap: 0.55em 2%;
			padding: 5% 2%;
		}
		.stub-menu {
			justify-content: flex-start;
			gap: 0.3em;
		}
		.stub-menu a {
			flex: 1 1 0;
			font-size: 0.72em;
		}
		.utility-menu {
			position: relative;
			grid-area: utility;
			top: auto;
			right: auto;
			left: auto;
			bottom: auto;
			align-self: end;
		}
	}

	@container stage-em (max-width: 75em) and (max-height: 32em) and (orientation: landscape) {
		.stage-shell {
			--selected-icon-height: min(27.3cqw, 26cqh);
			grid-template-columns: 35% minmax(0, 1fr);
			grid-template-rows: auto var(--selected-icon-height) minmax(0, 1fr);
			grid-template-areas:
				'identity panel'
				'selected panel'
				'utility panel';
			gap: 0.55em 2%;
			padding: 5% 2%;
		}
		.stub-menu {
			justify-content: flex-start;
			gap: 0.3em;
		}
		.stub-menu a {
			flex: 1 1 0;
			font-size: 0.72em;
		}
		.utility-menu {
			position: relative;
			grid-area: utility;
			top: auto;
			right: auto;
			left: auto;
			bottom: auto;
			align-self: end;
		}
	}

	@container stage-emch (max-width: calc(12.6em + 24.75ch)) {
		:global(.stage.profile-latin[data-unit='emch']) .stage-shell {
			--selected-icon-size: 4.9em;
			grid-template-columns: minmax(0, 1fr) var(--selected-icon-size);
			grid-template-rows: auto minmax(0, 1fr);
			grid-template-areas:
				'identity selected'
				'panel panel';
			gap: 0.85em 0.8em;
			padding: 1.2em 1em 1em;
		}
		:global(.stage.profile-latin[data-unit='emch']) .stub-menu {
			justify-content: space-between;
		}
		:global(.stage.profile-latin[data-unit='emch']) .content :global(p) {
			width: calc(100% - 1.6em);
		}
	}

	@container stage-emch (max-width: calc(9.9em + 22.5ch)) {
		:global(.stage.profile-ui[data-unit='emch']) .stage-shell {
			--selected-icon-size: 4.9em;
			grid-template-columns: minmax(0, 1fr) var(--selected-icon-size);
			grid-template-rows: auto minmax(0, 1fr);
			grid-template-areas:
				'identity selected'
				'panel panel';
			gap: 0.85em 0.8em;
			padding: 1.2em 1em 1em;
		}
		:global(.stage.profile-ui[data-unit='emch']) .stub-menu {
			justify-content: space-between;
		}
		:global(.stage.profile-ui[data-unit='emch']) .content :global(p) {
			width: calc(100% - 1.6em);
		}
	}

	@container stage-emch (max-width: calc(16.2em + 27.9ch)) {
		:global(.stage.profile-headings[data-unit='emch']) .stage-shell {
			--selected-icon-size: 4.9em;
			grid-template-columns: minmax(0, 1fr) var(--selected-icon-size);
			grid-template-rows: auto minmax(0, 1fr);
			grid-template-areas:
				'identity selected'
				'panel panel';
			gap: 0.85em 0.8em;
			padding: 1.2em 1em 1em;
		}
		:global(.stage.profile-headings[data-unit='emch']) .stub-menu {
			justify-content: space-between;
		}
		:global(.stage.profile-headings[data-unit='emch']) .content :global(p) {
			width: calc(100% - 1.6em);
		}
	}

	@container stage-emch (max-width: calc(21em + 41.25ch)) and (max-height: 32em) and (orientation: landscape) {
		:global(.stage.profile-latin[data-unit='emch']) .stage-shell {
			--selected-icon-height: min(27.3cqw, 26cqh);
			grid-template-columns: 35% minmax(0, 1fr);
			grid-template-rows: auto var(--selected-icon-height) minmax(0, 1fr);
			grid-template-areas:
				'identity panel'
				'selected panel'
				'utility panel';
			gap: 0.55em 2%;
			padding: 5% 2%;
		}
		:global(.stage.profile-latin[data-unit='emch']) .stub-menu {
			justify-content: flex-start;
			gap: 0.3em;
		}
		:global(.stage.profile-latin[data-unit='emch']) .stub-menu a {
			flex: 1 1 0;
			font-size: 0.72em;
		}
		:global(.stage.profile-latin[data-unit='emch']) .utility-menu {
			position: relative;
			grid-area: utility;
			top: auto;
			right: auto;
			left: auto;
			bottom: auto;
			align-self: end;
		}
	}

	@container stage-emch (max-width: calc(16.5em + 37.5ch)) and (max-height: 32em) and (orientation: landscape) {
		:global(.stage.profile-ui[data-unit='emch']) .stage-shell {
			--selected-icon-height: min(27.3cqw, 26cqh);
			grid-template-columns: 35% minmax(0, 1fr);
			grid-template-rows: auto var(--selected-icon-height) minmax(0, 1fr);
			grid-template-areas:
				'identity panel'
				'selected panel'
				'utility panel';
			gap: 0.55em 2%;
			padding: 5% 2%;
		}
		:global(.stage.profile-ui[data-unit='emch']) .stub-menu {
			justify-content: flex-start;
			gap: 0.3em;
		}
		:global(.stage.profile-ui[data-unit='emch']) .stub-menu a {
			flex: 1 1 0;
			font-size: 0.72em;
		}
		:global(.stage.profile-ui[data-unit='emch']) .utility-menu {
			position: relative;
			grid-area: utility;
			top: auto;
			right: auto;
			left: auto;
			bottom: auto;
			align-self: end;
		}
	}

	@container stage-emch (max-width: calc(27em + 46.5ch)) and (max-height: 32em) and (orientation: landscape) {
		:global(.stage.profile-headings[data-unit='emch']) .stage-shell {
			--selected-icon-height: min(27.3cqw, 26cqh);
			grid-template-columns: 35% minmax(0, 1fr);
			grid-template-rows: auto var(--selected-icon-height) minmax(0, 1fr);
			grid-template-areas:
				'identity panel'
				'selected panel'
				'utility panel';
			gap: 0.55em 2%;
			padding: 5% 2%;
		}
		:global(.stage.profile-headings[data-unit='emch']) .stub-menu {
			justify-content: flex-start;
			gap: 0.3em;
		}
		:global(.stage.profile-headings[data-unit='emch']) .stub-menu a {
			flex: 1 1 0;
			font-size: 0.72em;
		}
		:global(.stage.profile-headings[data-unit='emch']) .utility-menu {
			position: relative;
			grid-area: utility;
			top: auto;
			right: auto;
			left: auto;
			bottom: auto;
			align-self: end;
		}
	}

	:global(.stage[data-unit='sensor'].sensor-narrow) .stage-shell {
		--selected-icon-size: 4.9em;
		grid-template-columns: minmax(0, 1fr) var(--selected-icon-size);
		grid-template-rows: auto minmax(0, 1fr);
		grid-template-areas:
			'identity selected'
			'panel panel';
		gap: 0.85em 0.8em;
		padding: 1.2em 1em 1em;
	}

	:global(.stage[data-unit='sensor'].sensor-narrow) .stub-menu {
		justify-content: space-between;
	}

	:global(.stage[data-unit='sensor'].sensor-narrow) .content :global(p) {
		width: calc(100% - 1.6em);
	}

	:global(.stage[data-unit='sensor'].sensor-compact) .stage-shell {
		--selected-icon-height: min(27.3cqw, 26cqh);
		grid-template-columns: 35% minmax(0, 1fr);
		grid-template-rows: auto var(--selected-icon-height) minmax(0, 1fr);
		grid-template-areas:
			'identity panel'
			'selected panel'
			'utility panel';
		gap: 0.55em 2%;
		padding: 5% 2%;
	}

	:global(.stage[data-unit='sensor'].sensor-compact) .stub-menu {
		justify-content: flex-start;
		gap: 0.3em;
	}

	:global(.stage[data-unit='sensor'].sensor-compact) .stub-menu a {
		flex: 1 1 0;
		font-size: 0.72em;
	}

	:global(.stage[data-unit='sensor'].sensor-compact) .utility-menu {
		position: relative;
		grid-area: utility;
		top: auto;
		right: auto;
		left: auto;
		bottom: auto;
		align-self: end;
	}
</style>
