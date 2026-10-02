<script lang="ts">
	import { onMount } from 'svelte';
	import { RotateCcw } from '@lucide/svelte';
	import { emptyGlyphCapacityValue, type GlyphCapacityBox, type GlyphCapacityValue } from '$lib';
	import SandboxWindow from './components/SandboxWindow.svelte';
	import StrategyStage from './components/StrategyStage.svelte';
	import {
		AVG_CHARS,
		CASCADE_OFFSETS,
		CASCADE_SIZE,
		SCENARIOS,
		WINDOW_ORDER,
		WIDTH_CUTOFF,
		createScenarioStates,
		emptyUnitMetrics,
		profiles,
		type CapacityMetrics,
		type DemoWindow,
		type Profile,
		type ScenarioId,
		type ScenarioStateMap,
		type ScenarioStates,
		type StageLayout,
		type StageUnit,
		type Typeface,
		type UnitMetrics,
		type WindowArrangement,
		type WindowId
	} from './types';

	const ARRANGEMENT_GAP = 10;
	const TITLES: Record<WindowId, string> = {
		px: '@container · px',
		rem: '@container · rem',
		em: '@container · em',
		emch: '@container · em/ch',
		sensor: 'GlyphCapacitySensor'
	};
	const cloneValue = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

	let rootFontPx = $state(16);
	let typeface = $state<Typeface>('normal');
	let profile = $state<Profile>('latin');
	let scenario = $state<ScenarioId>('site-shell');
	let sensorCapacityBox = $state<GlyphCapacityBox>('glyph-area');
	let syncWindowDimensions = $state(true);
	let syncInteractions = $state(true);
	let useLoremCopy = $state(false);
	let windowArrangement = $state<WindowArrangement>('grid');
	let stageParentEl: HTMLElement | undefined = $state();
	let isApplyingArrangement = false;
	let topZ = $state(5);
	let lastInteractedWindow = $state<WindowId>('sensor');
	let hydrated = $state(false);

	let stageSizes = $state<Record<Exclude<StageUnit, 'sensor'>, { width: number; height: number }>>({
		px: { width: 0, height: 0 },
		rem: { width: 0, height: 0 },
		em: { width: 0, height: 0 },
		emch: { width: 0, height: 0 }
	});
	let emchChPx = $state(8);
	let unitMetrics = $state<Record<StageUnit, UnitMetrics>>({
		px: { ...emptyUnitMetrics },
		rem: { ...emptyUnitMetrics },
		em: { ...emptyUnitMetrics },
		emch: { ...emptyUnitMetrics },
		sensor: { ...emptyUnitMetrics }
	});
	let sensorValue = $state<GlyphCapacityValue>(emptyGlyphCapacityValue);
	let layouts = $state<Record<WindowId, StageLayout>>({
		px: 'desktop',
		rem: 'desktop',
		em: 'desktop',
		emch: 'desktop',
		sensor: 'desktop'
	});
	let sharedStates = $state<ScenarioStates>(createScenarioStates());
	let localStates = $state<Record<WindowId, ScenarioStates>>(
		Object.fromEntries(
			WINDOW_ORDER.map((id) => [id, cloneValue(createScenarioStates())])
		) as Record<WindowId, ScenarioStates>
	);
	let windows = $state<Record<WindowId, DemoWindow>>({
		px: { ...CASCADE_OFFSETS.px, ...CASCADE_SIZE, z: 1 },
		rem: { ...CASCADE_OFFSETS.rem, ...CASCADE_SIZE, z: 2 },
		em: { ...CASCADE_OFFSETS.em, ...CASCADE_SIZE, z: 3 },
		emch: { ...CASCADE_OFFSETS.emch, ...CASCADE_SIZE, z: 4 },
		sensor: { ...CASCADE_OFFSETS.sensor, ...CASCADE_SIZE, z: 5 }
	});

	const activeProfile = $derived(profiles[profile]);
	const remThresholdPx = $derived(rootFontPx * WIDTH_CUTOFF);
	const unitMeasureKey = $derived(`${rootFontPx}:${typeface}:${profile}`);

	onMount(() => {
		hydrated = true;
	});

	function cloneStates(states: ScenarioStates) {
		return cloneValue(states);
	}

	function scenarioState(id: WindowId): ScenarioStateMap[ScenarioId] {
		return syncInteractions ? sharedStates[scenario] : localStates[id][scenario];
	}

	function updateScenarioState(id: WindowId, next: ScenarioStateMap[ScenarioId]) {
		lastInteractedWindow = id;
		if (syncInteractions) {
			sharedStates = { ...sharedStates, [scenario]: cloneValue(next) } as ScenarioStates;
			for (const windowId of WINDOW_ORDER) {
				localStates[windowId] = {
					...localStates[windowId],
					[scenario]: cloneValue(next)
				} as ScenarioStates;
			}
			localStates = { ...localStates };
			return;
		}
		localStates = {
			...localStates,
			[id]: { ...localStates[id], [scenario]: cloneValue(next) } as ScenarioStates
		};
	}

	function onInteractionSyncChange(event: Event) {
		const enabled = (event.currentTarget as HTMLInputElement).checked;
		if (enabled) {
			sharedStates = cloneStates(localStates[lastInteractedWindow]);
		} else {
			localStates = Object.fromEntries(
				WINDOW_ORDER.map((id) => [id, cloneStates(sharedStates)])
			) as Record<WindowId, ScenarioStates>;
		}
		syncInteractions = enabled;
	}

	function resetScenario() {
		const initial = createScenarioStates()[scenario];
		sharedStates = { ...sharedStates, [scenario]: cloneValue(initial) } as ScenarioStates;
		localStates = Object.fromEntries(
			WINDOW_ORDER.map((id) => [id, { ...localStates[id], [scenario]: cloneValue(initial) }])
		) as Record<WindowId, ScenarioStates>;
	}

	function onScenarioChange(event: Event) {
		scenario = (event.currentTarget as HTMLSelectElement).value as ScenarioId;
	}

	function applyRootFontSize(px: number, nudgeRemContainers = true) {
		document.documentElement.style.fontSize = `${px}px`;
		if (!nudgeRemContainers) return;
		for (const el of document.querySelectorAll<HTMLElement>(
			'.glyph-capacity-demo .stage[data-unit="rem"]'
		)) {
			el.style.containerType = 'normal';
			void el.offsetWidth;
			el.style.removeProperty('container-type');
		}
	}

	function onRootInput(event: Event) {
		rootFontPx = Math.round(Number((event.currentTarget as HTMLInputElement).value) * 10) / 10;
		applyRootFontSize(rootFontPx);
	}

	function bringToFront(id: WindowId) {
		topZ += 1;
		windows = { ...windows, [id]: { ...windows[id], z: topZ } };
	}

	function parentSize() {
		if (!stageParentEl) return null;
		const width = Math.floor(stageParentEl.clientWidth);
		const height = Math.floor(stageParentEl.clientHeight);
		return width > 0 && height > 0 ? { width, height } : null;
	}

	function mapWindows(project: (id: WindowId, current: DemoWindow, index: number) => DemoWindow) {
		windows = Object.fromEntries(
			WINDOW_ORDER.map((id, index) => [id, project(id, windows[id], index)])
		) as Record<WindowId, DemoWindow>;
	}

	function packArrangement(mode: WindowArrangement, cellWidth: number, cellHeight: number) {
		const gap = ARRANGEMENT_GAP;
		const parent = parentSize();
		if (mode === 'cascade') {
			mapWindows((id, current) => ({
				...current,
				...CASCADE_OFFSETS[id],
				width: cellWidth,
				height: cellHeight
			}));
			return;
		}
		if (mode === 'row') {
			mapWindows((_id, current, index) => ({
				...current,
				left: index * (cellWidth + gap),
				top: 0,
				width: cellWidth,
				height: cellHeight
			}));
			return;
		}
		const parentWidth = parent?.width ?? 3 * cellWidth + 2 * gap;
		const columns = parentWidth < 900 ? 1 : parentWidth < 1250 ? 2 : 3;
		const rows = Math.ceil(WINDOW_ORDER.length / columns);
		mapWindows((_id, current, index) => {
			const row = Math.floor(index / columns);
			const column = index % columns;
			const itemsInRow = row === rows - 1 ? WINDOW_ORDER.length - row * columns : columns;
			const rowWidth = itemsInRow * cellWidth + (itemsInRow - 1) * gap;
			const rowStart = Math.max(0, Math.floor((parentWidth - rowWidth) / 2));
			return {
				...current,
				left: rowStart + column * (cellWidth + gap),
				top: row * (cellHeight + gap),
				width: cellWidth,
				height: cellHeight
			};
		});
	}

	function applyWindowArrangement(mode: WindowArrangement) {
		isApplyingArrangement = true;
		if (mode === 'cascade') {
			packArrangement(
				mode,
				windows.px.width || CASCADE_SIZE.width,
				windows.px.height || CASCADE_SIZE.height
			);
		} else {
			const parent = parentSize();
			if (parent) {
				const gap = ARRANGEMENT_GAP;
				if (mode === 'row') {
					packArrangement(
						mode,
						Math.max(260, Math.floor((parent.width - 4 * gap) / 5)),
						Math.max(220, Math.min(parent.height, 560))
					);
				} else {
					const columns = parent.width < 900 ? 1 : parent.width < 1250 ? 2 : 3;
					const rows = Math.ceil(WINDOW_ORDER.length / columns);
					packArrangement(
						mode,
						Math.max(260, Math.floor((parent.width - (columns - 1) * gap) / columns)),
						Math.max(220, Math.floor((parent.height - (rows - 1) * gap) / rows))
					);
				}
			}
		}
		requestAnimationFrame(() => (isApplyingArrangement = false));
	}

	function onArrangementChange(event: Event) {
		windowArrangement = (event.currentTarget as HTMLSelectElement).value as WindowArrangement;
		applyWindowArrangement(windowArrangement);
	}

	function bindStageParent(node: HTMLElement) {
		stageParentEl = node;
		const tryApply = () => {
			if (!parentSize()) return false;
			applyWindowArrangement(windowArrangement);
			return true;
		};
		if (!tryApply())
			requestAnimationFrame(() => {
				if (!tryApply()) requestAnimationFrame(tryApply);
			});
		return {
			destroy() {
				if (stageParentEl === node) stageParentEl = undefined;
			}
		};
	}

	function resizeWindow(id: WindowId, size: { width: number; height: number }) {
		if (isApplyingArrangement) return;
		const width = Math.round(size.width);
		const height = Math.round(size.height);
		if (width <= 0 || height <= 0) return;
		if (syncWindowDimensions) {
			windows = Object.fromEntries(
				Object.entries(windows).map(([key, value]) => [key, { ...value, width, height }])
			) as Record<WindowId, DemoWindow>;
		} else {
			windows = { ...windows, [id]: { ...windows[id], width, height } };
		}
	}

	function startWindowDrag(event: PointerEvent, id: WindowId) {
		const node = event.currentTarget as HTMLElement;
		const target = event.target as Element;
		if (target.closest('button, input, select, textarea, a, [role="tab"], [role="menuitem"]')) {
			bringToFront(id);
			return;
		}
		const rect = node.getBoundingClientRect();
		bringToFront(id);
		if (event.clientX > rect.right - 22 && event.clientY > rect.bottom - 22) return;
		event.preventDefault();
		node.setPointerCapture(event.pointerId);
		const startX = event.clientX;
		const startY = event.clientY;
		const startLeft = windows[id].left;
		const startTop = windows[id].top;
		const onMove = (move: PointerEvent) => {
			windows = {
				...windows,
				[id]: {
					...windows[id],
					left: Math.max(0, startLeft + move.clientX - startX),
					top: Math.max(0, startTop + move.clientY - startY)
				}
			};
		};
		const onUp = (up: PointerEvent) => {
			node.releasePointerCapture(up.pointerId);
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerup', onUp);
			node.removeEventListener('pointercancel', onUp);
		};
		node.addEventListener('pointermove', onMove);
		node.addEventListener('pointerup', onUp);
		node.addEventListener('pointercancel', onUp);
	}

	function measureStage(node: HTMLElement, unit: StageUnit) {
		if (unit === 'sensor') return;
		const apply = () => {
			stageSizes = {
				...stageSizes,
				[unit]: { width: node.clientWidth, height: node.clientHeight }
			};
		};
		apply();
		let frame = 0;
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(apply);
		};
		const observer = new ResizeObserver(schedule);
		observer.observe(node);
		return {
			destroy() {
				cancelAnimationFrame(frame);
				observer.disconnect();
			}
		};
	}

	function measureCh(node: HTMLElement) {
		const apply = () => (emchChPx = node.getBoundingClientRect().width || emchChPx);
		apply();
		let frame = 0;
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(apply);
		};
		const observer = new ResizeObserver(schedule);
		observer.observe(node);
		return {
			destroy() {
				cancelAnimationFrame(frame);
				observer.disconnect();
			}
		};
	}

	function measureUnits(node: HTMLElement, _key: string) {
		const unit = node.dataset.unit as StageUnit;
		const probe = document.createElement('span');
		probe.textContent = '0';
		Object.assign(probe.style, {
			position: 'absolute',
			left: '-10000px',
			top: '0',
			display: 'block',
			visibility: 'hidden',
			pointerEvents: 'none',
			whiteSpace: 'nowrap'
		});
		node.appendChild(probe);
		const measureWidth = (width: string) => {
			probe.style.width = width;
			probe.style.height = '1px';
			return probe.getBoundingClientRect().width;
		};
		const measureHeight = (height: string) => {
			probe.style.width = '1px';
			probe.style.height = height;
			return probe.getBoundingClientRect().height;
		};
		const apply = () => {
			const rem = measureWidth('1rem');
			const em = measureWidth('1em');
			const ch = measureWidth('1ch');
			const lh = measureHeight('1lh');
			unitMetrics = {
				...unitMetrics,
				[unit]: { rem, em, ch, lh, emch: activeProfile.em * em + activeProfile.ch * ch }
			};
		};
		let frame = 0;
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(apply);
		};
		const observer = new ResizeObserver(schedule);
		observer.observe(node);
		observer.observe(probe);
		apply();
		return {
			update() {
				schedule();
			},
			destroy() {
				cancelAnimationFrame(frame);
				observer.disconnect();
				probe.remove();
			}
		};
	}

	function estimateCapacity(
		width: number,
		height: number,
		inline: number,
		line: number
	): CapacityMetrics {
		const maxChars = inline > 0 ? Math.floor(width / inline) : 0;
		const maxLines = line > 0 ? Math.floor(height / line) : 0;
		return { maxChars, maxLines, aspectRatio: maxLines > 0 ? maxChars / maxLines : 0 };
	}

	function snapshotFor(unit: StageUnit) {
		if (unit === 'sensor')
			return {
				width: sensorValue.container.width,
				height: sensorValue.container.height,
				capacity: {
					maxChars: sensorValue.text.maxChars,
					maxLines: sensorValue.text.maxLines,
					aspectRatio: sensorValue.text.aspectRatio
				}
			};
		const size = stageSizes[unit];
		const inline =
			unit === 'px'
				? unitMetrics.px.em
				: unit === 'rem'
					? unitMetrics.rem.rem
					: unit === 'em'
						? unitMetrics.em.em
						: unitMetrics.emch.emch;
		return {
			...size,
			capacity: estimateCapacity(size.width, size.height, inline, unitMetrics[unit].lh)
		};
	}

	function unitLabel(metrics: UnitMetrics) {
		return `rem ${metrics.rem.toFixed(1)} · em ${metrics.em.toFixed(1)} · em/ch ${metrics.emch.toFixed(1)} · lh ${metrics.lh.toFixed(1)}`;
	}

	function rootFontBoot(_node: HTMLElement) {
		applyRootFontSize(rootFontPx, false);
		return {
			destroy() {
				document.documentElement.style.fontSize = '';
			}
		};
	}
</script>

<div
	class="glyph-capacity-demo"
	data-active-scenario={scenario}
	data-hydrated={hydrated}
	use:rootFontBoot
>
	<header class="controls">
		<p class="controls__title">Glyph capacity workbench</p>
		<label
			>Scenario <select aria-label="Scenario" value={scenario} onchange={onScenarioChange}
				>{#each SCENARIOS as item}<option value={item.id}>{item.label}</option>{/each}</select
			></label
		>
		<button
			class="reset-button"
			title="Reset current scenario"
			aria-label="Reset current scenario"
			onclick={resetScenario}><RotateCcw size={16} /></button
		>
		<label class="controls__root-font"
			><span>Root font-size</span><input
				type="range"
				min="10"
				max="28"
				step="0.1"
				value={rootFontPx}
				oninput={onRootInput}
			/><span>{rootFontPx.toFixed(1)}px · 48rem = {remThresholdPx.toFixed(1)}px</span></label
		>
		<label
			>Typeface <select bind:value={typeface}
				><option value="narrow">Narrow (Archivo 75%)</option><option value="normal"
					>Normal (Archivo 100%)</option
				><option value="wide">Wide (Archivo 125%)</option></select
			></label
		>
		<label
			>em/ch profile <select bind:value={profile}
				>{#each Object.entries(profiles) as [key, item]}<option value={key}>{item.label}</option
					>{/each}</select
			></label
		>
		<label
			>Sensor capacity box <select bind:value={sensorCapacityBox}
				><option value="glyph-area">Glyph area</option><option value="measured-box"
					>Measured box</option
				></select
			></label
		>
		<label
			>Window layout <select value={windowArrangement} onchange={onArrangementChange}
				><option value="grid">Grid</option><option value="cascade">Cascade</option><option
					value="row">Row</option
				></select
			></label
		>
		<label><input type="checkbox" bind:checked={syncWindowDimensions} />Sync dimensions</label>
		<label
			><input type="checkbox" checked={syncInteractions} onchange={onInteractionSyncChange} />Sync
			interactions</label
		>
		<label><input type="checkbox" bind:checked={useLoremCopy} />Lorem copy</label>
		<p class="legend">
			Resize the same scenario across five strategies. Stage badges report the branch selected by
			each CSS sentinel or by measured glyph capacity; nested widgets make their own local
			decisions.
		</p>
	</header>

	<main class="stage-parent" style="--sandbox-root-font-size: {rootFontPx}px;" use:bindStageParent>
		{#each WINDOW_ORDER as id}
			{@const snapshot = snapshotFor(id)}
			<SandboxWindow
				ariaLabel={`${TITLES[id]} sandbox window`}
				height={windows[id].height}
				layout={layouts[id]}
				left={windows[id].left}
				onResize={(size) => resizeWindow(id, size)}
				title={TITLES[id]}
				top={windows[id].top}
				width={windows[id].width}
				z={windows[id].z}
				onPointerDown={(event) => startWindowDrag(event, id)}
			>
				<StrategyStage
					strategy={id}
					bind:layout={layouts[id]}
					bind:sensorValue
					capacity={snapshot.capacity}
					height={snapshot.height}
					{measureCh}
					{measureStage}
					{measureUnits}
					onStateChange={(next) => updateScenarioState(id, next)}
					{profile}
					{scenario}
					{sensorCapacityBox}
					state={scenarioState(id)}
					{typeface}
					unitLabel={unitLabel(unitMetrics[id])}
					{unitMeasureKey}
					{useLoremCopy}
					width={snapshot.width}
				/>
			</SandboxWindow>
		{/each}
	</main>
</div>

<style>
	:global(body:has(.glyph-capacity-demo)) {
		margin: 0;
		min-height: 100vh;
		background: #11151b;
		color: #edf2f7;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}
	.glyph-capacity-demo {
		box-sizing: border-box;
		min-height: 100vh;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		background: #11151b;
		color: #edf2f7;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 16px;
	}
	.controls {
		flex: 0 0 auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 18px;
		padding: 10px 14px;
		background: #202832;
		border: 1px solid #3a4652;
		border-radius: 6px;
	}
	.controls__title {
		margin: 0;
		font-weight: 700;
		font-size: 15px;
	}
	.controls label {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
	}
	.controls input[type='range'] {
		width: 112px;
	}
	.controls__root-font {
		flex-wrap: wrap;
	}
	.controls__root-font input[type='range'] {
		flex: 1 1 220px;
		width: min(360px, 42vw);
		min-width: 220px;
	}
	.controls__root-font > span:first-child {
		white-space: nowrap;
	}
	.controls__root-font > span:last-child {
		white-space: nowrap;
	}
	.controls select {
		font: inherit;
		font-size: 13px;
	}
	.reset-button {
		width: 32px;
		height: 32px;
		display: grid;
		place-items: center;
		border: 1px solid #657281;
		border-radius: 4px;
		background: #2c3742;
		color: #fff;
	}
	.reset-button:focus-visible {
		outline: 3px solid #68a8e6;
		outline-offset: 2px;
	}
	.legend {
		flex: 1 1 100%;
		margin: 0;
		font-size: 12px;
		line-height: 1.35;
		opacity: 0.85;
	}
	.stage-parent {
		--sandbox-root-font-size: 16px;
		flex: 1 1 auto;
		position: relative;
		min-height: min(80vh, 760px);
		overflow: hidden;
		font-size: var(--sandbox-root-font-size);
	}
	@media (max-width: 980px) {
		.stage-parent {
			min-height: 760px;
			overflow: auto;
		}
	}
</style>
