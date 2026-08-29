<script lang="ts">
	import ShotCard from './ShotCard.svelte';
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
		warnings = []
	}: {
		groups: SceneGroup[];
		script: ScriptFile;
		scriptId: ScriptId;
		scriptVersion: string;
		playerHref: string;
		targetDurationMs?: number;
		warnings?: string[];
	} = $props();

	const lang = $derived(getLanguageState());

	let localDurations = $state<Record<string, number>>({});

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
</script>

<div class="editor">
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
						playerHref={`${playerHref}?shot=${encodeURIComponent(shot.id)}`}
						onduration={(ms) => setDuration(shot.id, ms)}
					/>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
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

	.play-link {
		display: inline-block;
		padding: 0.55rem 0.85rem;
		border-radius: 8px;
		background: var(--cyan);
		color: #03111a;
		border: 1px solid var(--cyan);
		font-weight: 800;
		text-decoration: none;
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
		.play-link {
			flex: 1 1 calc(50% - 0.5rem);
		}

		.play-link {
			margin-left: 0;
		}
	}
</style>
