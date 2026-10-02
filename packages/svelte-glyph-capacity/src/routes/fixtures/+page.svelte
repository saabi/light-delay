<!--
	Test fixtures for tests/glyph-capacity-fixtures.spec.ts. Not linked from the workbench.
-->
<script lang="ts">
	import { GlyphCapacitySensor, emptyGlyphCapacityValue, type GlyphCapacityValue } from '$lib';

	const record = (name: string, value: GlyphCapacityValue) => {
		const w = window as unknown as Record<string, unknown>;
		w[`__${name}`] = $state.snapshot(value);
		w[`__${name}Updates`] = ((w[`__${name}Updates`] as number) ?? 0) + 1;
	};

	let scroll = $state<GlyphCapacityValue>(emptyGlyphCapacityValue);
	let flags = $state<GlyphCapacityValue>(emptyGlyphCapacityValue);
	let flagsWidth = $state(200);
	let flagsHeight = $state(100);
	let loose = $state<GlyphCapacityValue>(emptyGlyphCapacityValue);
	let contained = $state<GlyphCapacityValue>(emptyGlyphCapacityValue);
	let invalid = $state<GlyphCapacityValue>(emptyGlyphCapacityValue);
	/* Read in the browser so the page still prerenders with the static demo build. */
	let oscillate = $state(false);

	const looseMode = $derived(loose.text.maxLines >= 4 ? 'full' : 'reduced');
	const containedMode = $derived(contained.text.maxLines >= 4 ? 'full' : 'reduced');

	$effect(() => record('scroll', scroll));
	$effect(() => record('flags', flags));
	$effect(() => record('loose', loose));
	$effect(() => record('contained', contained));
	$effect(() => record('invalid', invalid));
	$effect(() => {
		oscillate = new URLSearchParams(location.search).has('oscillate');
	});
	$effect(() => {
		const w = window as unknown as Record<string, unknown>;
		w.__setFlagsSize = (width: number, height: number) => {
			flagsWidth = width;
			flagsHeight = height;
		};
	});
</script>

<div class="fixtures">
	<GlyphCapacitySensor class="fixture-scroll" bind:value={scroll}>
		<div style="height: 1000px"></div>
	</GlyphCapacitySensor>

	<div style="width: {flagsWidth}px; height: {flagsHeight}px">
		<GlyphCapacitySensor class="fixture-fill" bind:value={flags} />
	</div>

	<!-- Sized by its content, which depends on its own capacity: oscillates. Opt-in (?oscillate) so
	     the other cases run without a ResizeObserver loop on the page. -->
	{#if oscillate}
		<div style="width: 400px">
			<GlyphCapacitySensor class="fixture-loose" bind:value={loose}>
				{#if looseMode === 'full'}<p>one line</p>{:else}<p>
						l1<br />l2<br />l3<br />l4<br />l5
					</p>{/if}
			</GlyphCapacitySensor>
		</div>
	{/if}

	<!-- Same content, but the size is determined by layout: stable. -->
	<div style="width: 400px; height: 100px">
		<GlyphCapacitySensor class="fixture-contained" bind:value={contained}>
			{#if containedMode === 'full'}<p>one line</p>{:else}<p>
					l1<br />l2<br />l3<br />l4<br />l5
				</p>{/if}
		</GlyphCapacitySensor>
	</div>

	<div style="width: 400px; height: 50px">
		<GlyphCapacitySensor class="fixture-fill" breakpoints={[90, 45]} bind:value={invalid} />
	</div>
</div>

<style>
	.fixtures {
		font: 16px/1.25 monospace;
	}
	.fixtures p {
		margin: 0;
	}
	:global(.fixture-scroll) {
		box-sizing: border-box;
		width: 400px;
		height: 200px;
		padding: 10px 20px;
		border: 3px solid;
		margin: 30px;
		overflow-y: scroll;
		position: relative;
	}
	:global(.fixture-scroll::-webkit-scrollbar) {
		width: 15px;
	}
	:global(.fixture-scroll::-webkit-scrollbar-thumb) {
		background: #888;
	}
	:global(.fixture-fill) {
		height: 100%;
		position: relative;
	}
	:global(.fixture-loose) {
		position: relative;
	}
	:global(.fixture-contained) {
		height: 100%;
		position: relative;
		container-type: size;
		overflow: hidden;
	}
</style>
