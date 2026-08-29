<script lang="ts">
	import ShotCard from './ShotCard.svelte';
	import ShotDetailsPanel from './ShotDetailsPanel.svelte';
	import ContinuityWarnings from './ContinuityWarnings.svelte';
	import DurationPair from '$lib/components/timing/DurationPair.svelte';
	import {
		analyzeShotDialogue,
		estimateSceneSpokenMs,
		estimateScriptSpokenMs,
		montageSceneMs,
		montageScriptMs
	} from '$lib/data/selectors/dialogueTiming';
	import {
		countScriptTakesNeedingRegeneration,
		getShotReadinessChips
	} from '$lib/data/selectors/editorialReadiness';
	import {
		durationFromEdits,
		effectiveTotalMs,
		loadAnimaticEdits,
		persistAnimaticEdits,
		type AnimaticEdits
	} from '$lib/state/animatic-overlay';
	import { getLanguageState } from '$lib/state/language.svelte';
	import { getCueById, type ShotMedia } from '$lib/data/repositories/lookups';
	import { formatClock } from '$lib/utils/duration';
	import type { ScriptId } from '$lib/types/ids';
	import type { Cue, Scene, ScriptFile, Shot } from '$lib/types/script';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';

	type SceneGroup = {
		scene: Scene;
		shots: Shot[];
		mediaByShotId: Record<string, ShotMedia>;
	};

	let {
		groups,
		script,
		scriptId,
		scriptVersion,
		playerHref,
		targetDurationMs,
		warnings = [],
		initialShotId
	}: {
		groups: SceneGroup[];
		script: ScriptFile;
		scriptId: ScriptId;
		scriptVersion: string;
		playerHref: string;
		targetDurationMs?: number;
		warnings?: string[];
		initialShotId?: string;
	} = $props();

	const lang = $derived(getLanguageState());

	let localDurations = $state<Record<string, number>>({});
	let selectedShotId = $state<string | undefined>(undefined);
	let detailsOpen = $state(false);

	const persisted = $derived(loadAnimaticEdits(scriptId, scriptVersion));
	const edits = $derived.by((): AnimaticEdits => ({
		scriptId,
		scriptVersion,
		shotDurations: { ...persisted.shotDurations, ...localDurations }
	}));

	const allShots = $derived(groups.flatMap((g) => g.shots));
	const totalMs = $derived(effectiveTotalMs(edits, allShots));
	const scriptMontageMs = $derived(montageScriptMs(script, edits));
	const scriptSpokenMs = $derived(estimateScriptSpokenMs(script, lang.dialogueLanguage));
	const regenCount = $derived(countScriptTakesNeedingRegeneration(script));

	const mediaByShotId = $derived.by(() => {
		const map: Record<string, ShotMedia> = {};
		for (const group of groups) Object.assign(map, group.mediaByShotId);
		return map;
	});

	const selectedIndex = $derived(
		selectedShotId ? allShots.findIndex((shot) => shot.id === selectedShotId) : -1
	);
	const selectedShot = $derived(selectedIndex >= 0 ? allShots[selectedIndex] : undefined);
	const selectedCues = $derived.by((): Cue[] => {
		if (!selectedShot) return [];
		return selectedShot.cuePlacements
			.map((placement) => getCueById(script, placement.cueId))
			.filter((cue): cue is Cue => cue != null);
	});
	const selectedDurationMs = $derived(
		selectedShot ? durationFromEdits(edits, selectedShot.id, selectedShot.durationMs) : 0
	);
	const selectedAbsoluteInMs = $derived.by(() => {
		if (selectedIndex < 0) return 0;
		let sum = 0;
		for (let i = 0; i < selectedIndex; i++) {
			const shot = allShots[i];
			sum += durationFromEdits(edits, shot.id, shot.durationMs);
		}
		return sum;
	});

	onMount(() => {
		if (!initialShotId) return;
		if (!allShots.some((shot) => shot.id === initialShotId)) return;
		selectedShotId = initialShotId;
		detailsOpen = true;
	});

	function setDuration(shotId: string, ms: number) {
		const nextLocal = {
			...localDurations,
			[shotId]: Math.max(0, Math.round(ms))
		};
		localDurations = nextLocal;
		persistAnimaticEdits({
			scriptId,
			scriptVersion,
			shotDurations: { ...persisted.shotDurations, ...nextLocal }
		});
	}

	function selectShot(shotId: string) {
		selectedShotId = shotId;
		detailsOpen = true;
	}

	function toggleDetails() {
		detailsOpen = !detailsOpen;
	}

	function onKey(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		if (target?.matches('input, select, textarea, button, a')) return;
		if (event.key === 'd' || event.key === 'D') {
			event.preventDefault();
			toggleDetails();
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<div class="editor" class:details-open={detailsOpen}>
	<div class="editor-main">
		<div class="dashboard">
			<div>
				<DurationPair montageMs={scriptMontageMs} spokenMs={scriptSpokenMs} />
				<small>
					{m.animatic_regen_count({ count: regenCount })}
					· {m.animatic_effective()} {formatClock(totalMs)}
					{#if targetDurationMs !== undefined}
						/ {m.animatic_target().toLowerCase()} {formatClock(targetDurationMs)}
					{/if}
				</small>
			</div>
			<div class="progress" aria-hidden="true">
				<span
					style:width={`${targetDurationMs ? Math.min(100, (totalMs / targetDurationMs) * 100) : 0}%`}
				></span>
			</div>
			<button
				type="button"
				class="details-toggle"
				aria-expanded={detailsOpen}
				aria-controls="animatic-editor-details"
				onclick={toggleDetails}
			>
				<span aria-hidden="true">{detailsOpen ? '▾' : '▸'}</span>
				{m.animatic_details()}
			</button>
			<a class="play-link" href={playerHref}>{m.action_view_movie()}</a>
		</div>

		<ContinuityWarnings {warnings} />

		{#each groups as group (group.scene.id)}
			{@const sceneMontageMs = montageSceneMs(script, group.scene.id, edits)}
			{@const sceneSpokenMs = estimateSceneSpokenMs(script, group.scene.id, lang.dialogueLanguage)}
			<section class="scene-group">
				<header>
					<h2>{m.script_scene()} {group.scene.number}</h2>
					<p>{group.scene.summary || group.scene.title}</p>
					<small>
						<DurationPair montageMs={sceneMontageMs} spokenMs={sceneSpokenMs} compact />
						· {group.shots.length}
						{m.animatic_shots()}
					</small>
				</header>
				<div class="shots">
					{#each group.shots as shot (shot.id)}
						{@const shotMontageMs = durationFromEdits(edits, shot.id, shot.durationMs)}
						{@const shotAnalysis = analyzeShotDialogue(script, shot, lang.dialogueLanguage)}
						{@const readinessChips = getShotReadinessChips(script, shot)}
						{@const cues: Cue[] = shot.cuePlacements
							.map((placement) => getCueById(script, placement.cueId))
							.filter((cue): cue is Cue => cue != null)}
						<ShotCard
							{shot}
							media={group.mediaByShotId[shot.id]}
							durationMs={shotMontageMs}
							spokenMs={shotAnalysis.spokenMs}
							dialogueFlags={shotAnalysis}
							{cues}
							{readinessChips}
							selected={shot.id === selectedShotId}
							playerHref={`${playerHref}?shot=${encodeURIComponent(shot.id)}`}
							onselect={() => selectShot(shot.id)}
							onduration={(ms) => setDuration(shot.id, ms)}
						/>
					{/each}
				</div>
			</section>
		{/each}
	</div>

	{#if detailsOpen}
		<button
			type="button"
			class="details-backdrop"
			aria-label={m.animatic_details_close()}
			onclick={toggleDetails}
		></button>
	{/if}

	<aside
		class="editor-details"
		class:open={detailsOpen}
		id="animatic-editor-details"
		aria-hidden={!detailsOpen}
	>
		<div class="details-chrome">
			<button
				type="button"
				class="details-toggle sheet"
				aria-expanded={detailsOpen}
				aria-controls="animatic-editor-details-body"
				onclick={toggleDetails}
			>
				<span aria-hidden="true">{detailsOpen ? '▾' : '▸'}</span>
				{m.animatic_details()}
			</button>
			{#if detailsOpen}
				<div class="details-body" id="animatic-editor-details-body">
					{#if selectedShot}
						<ShotDetailsPanel
							{script}
							shot={selectedShot}
							cues={selectedCues}
							media={mediaByShotId[selectedShot.id]}
							effectiveDurationMs={selectedDurationMs}
							absoluteInMs={selectedAbsoluteInMs}
							shotIndex={selectedIndex}
							totalShots={allShots.length}
						/>
					{:else}
						<p class="empty">{m.animatic_details_empty()}</p>
					{/if}
				</div>
			{/if}
		</div>
	</aside>
</div>

<style>
	.editor {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		align-items: start;
	}

	.editor-main {
		min-width: 0;
	}

	.dashboard {
		position: sticky;
		top: calc(var(--site-top-offset) + 0.75rem);
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.85rem 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: #091722ee;
		backdrop-filter: blur(12px);
		margin-bottom: 1.5rem;
	}

	.dashboard small {
		display: block;
		color: var(--muted);
	}

	.progress {
		flex: 1;
		height: 7px;
		border-radius: 999px;
		background: var(--panel2);
		overflow: hidden;
	}

	.progress span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--cyan), var(--gold));
	}

	.details-toggle,
	.play-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		padding: 0.55rem 0.85rem;
		border-radius: 8px;
		font: inherit;
		font-weight: 800;
		text-decoration: none;
		cursor: pointer;
		white-space: nowrap;
	}

	.details-toggle {
		border: 1px solid var(--line);
		background: #132837;
		color: var(--gold);
	}

	.details-toggle:hover,
	.details-toggle:focus-visible {
		border-color: var(--cyan);
		outline: none;
	}

	.details-toggle.sheet {
		width: 100%;
		justify-content: flex-start;
		border: 0;
		border-radius: 0;
		background: transparent;
		padding: 12px 14px;
	}

	.play-link {
		background: var(--cyan);
		color: #03111a;
		border: 1px solid var(--cyan);
	}

	.scene-group {
		margin: 2rem 0;
	}

	.scene-group header h2 {
		margin: 0 0 0.25rem;
		font: 700 1.35rem/1.2 var(--font-serif);
	}

	.scene-group header p {
		margin: 0;
		color: var(--muted);
	}

	.scene-group header small {
		display: block;
		margin-top: 0.35rem;
		color: var(--gold);
		font-family: var(--font-mono);
	}

	.shots {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		margin-top: 1rem;
	}

	.details-backdrop {
		display: none;
	}

	.editor-details {
		display: none;
	}

	.editor-details.open {
		display: block;
	}

	.details-chrome {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: #06101bed;
		backdrop-filter: blur(14px);
		overflow: hidden;
	}

	.details-body {
		padding: 0 14px 14px;
		overflow: auto;
		overscroll-behavior: contain;
	}

	.empty {
		margin: 0 0 1rem;
		color: var(--muted);
		font-size: 0.92rem;
	}

	@media (min-width: 900px) {
		.editor.details-open {
			grid-template-columns: minmax(0, 1fr) min(420px, 36vw);
		}

		.editor-details {
			display: block;
			position: sticky;
			top: calc(var(--site-top-offset) + 0.75rem);
			max-height: calc(100vh - var(--site-top-offset) - 1.5rem);
			align-self: start;
		}

		.editor-details:not(.open) {
			display: none;
		}

		.editor-details.open .details-chrome {
			display: flex;
			flex-direction: column;
			max-height: calc(100vh - var(--site-top-offset) - 1.5rem);
		}

		.editor-details.open .details-body {
			flex: 1;
			min-height: 0;
			max-height: none;
		}

		.details-backdrop {
			display: none !important;
		}
	}

	@media (max-width: 899px) {
		.details-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 40;
			border: 0;
			padding: 0;
			margin: 0;
			background: #02070c88;
			cursor: pointer;
		}

		.editor-details.open {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 45;
			max-height: 60dvh;
			display: flex;
			flex-direction: column;
		}

		.editor-details.open .details-chrome {
			border-radius: 14px 14px 0 0;
			border-bottom: 0;
			display: flex;
			flex-direction: column;
			max-height: 60dvh;
			background: #06101b;
			backdrop-filter: none;
		}

		.editor-details.open .details-body {
			flex: 1;
			min-height: 0;
			padding-bottom: max(14px, env(safe-area-inset-bottom));
		}
	}

	@media (max-width: 720px) {
		.dashboard {
			flex-wrap: wrap;
		}

		.progress {
			order: 3;
			flex: 1 1 100%;
		}

		.play-link {
			margin-left: auto;
		}
	}

	@media (max-width: 420px) {
		.dashboard {
			align-items: stretch;
		}

		.dashboard > div:first-child,
		.details-toggle:not(.sheet),
		.play-link {
			flex: 1 1 calc(50% - 0.5rem);
		}

		.play-link,
		.details-toggle:not(.sheet) {
			margin-left: 0;
		}
	}
</style>
