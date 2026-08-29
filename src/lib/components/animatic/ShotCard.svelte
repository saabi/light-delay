<script lang="ts">
	import AnimaticFrame from './AnimaticFrame.svelte';
	import DurationInput from './DurationInput.svelte';
	import DurationPair from '$lib/components/timing/DurationPair.svelte';
	import type { ShotReadinessChip } from '$lib/data/selectors/editorialReadiness';
	import type { ShotDialogueAnalysis } from '$lib/data/selectors/dialogueTiming';
	import type { Shot } from '$lib/types/script';
	import type { ShotMedia } from '$lib/data/repositories/lookups';
	import * as m from '$lib/paraglide/messages.js';

	let {
		shot,
		media,
		durationMs,
		spokenMs,
		dialogueFlags,
		readinessChips = [],
		playerHref,
		onduration
	}: {
		shot: Shot;
		media: ShotMedia;
		durationMs: number;
		spokenMs: number;
		dialogueFlags?: Pick<
			ShotDialogueAnalysis,
			'multiSpeaker' | 'offCameraDialogue' | 'speakerCount'
		>;
		readinessChips?: ShotReadinessChip[];
		playerHref: string;
		onduration: (ms: number) => void;
	} = $props();
</script>

<article class="shot-card" id={shot.id} tabindex="-1">
	<a class="media" href={playerHref}>
		<AnimaticFrame
			{media}
			shotId={shot.id}
			alt={`${m.animatic_take()} ${shot.number}`}
			loading="lazy"
			fit="cover"
		/>
	</a>
	<div class="body">
		<header>
			<span class="num">{m.animatic_take()} {shot.number}</span>
			<span class="size">{shot.composition.size}</span>
		</header>
		<p class="desc">{shot.description}</p>
		<div class="row">
			<DurationInput valueMs={durationMs} onchange={onduration} />
			<div class="timing">
				<DurationPair montageMs={durationMs} spokenMs={spokenMs} compact />
				{#if readinessChips.includes('regenerate')}
					<span class="flag regen" title={m.readiness_regenerate()}>{m.readiness_regenerate()}</span>
				{/if}
				{#if readinessChips.includes('missing_purpose')}
					<span class="flag" title={m.readiness_missing_purpose()}>{m.readiness_missing_purpose()}</span>
				{/if}
				{#if readinessChips.includes('missing_camera')}
					<span class="flag" title={m.readiness_missing_camera()}>{m.readiness_missing_camera()}</span>
				{/if}
				{#if dialogueFlags?.multiSpeaker}
					<span class="flag" title={m.timing_flag_multi_speaker({ count: dialogueFlags.speakerCount })}>
						{m.timing_flag_multi_speaker({ count: dialogueFlags.speakerCount })}
					</span>
				{/if}
				{#if dialogueFlags?.offCameraDialogue}
					<span class="flag off" title={m.timing_flag_off_camera()}>{m.timing_flag_off_camera()}</span>
				{/if}
			</div>
		</div>
	</div>
</article>

<style>
	.shot-card {
		display: grid;
		grid-template-columns: 160px minmax(0, 1fr);
		gap: 1rem;
		padding: 0.85rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
	}

	.media {
		display: block;
		text-decoration: none;
		aspect-ratio: 16 / 9;
		border: 1px solid var(--line);
		border-radius: 8px;
		overflow: hidden;
	}

	.body {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	header {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
	}

	.num {
		color: var(--cyan);
		font: 800 0.78rem var(--font-mono);
		text-transform: uppercase;
	}

	.size {
		color: var(--gold);
		font-size: 0.78rem;
	}

	.desc {
		margin: 0;
		color: var(--muted);
		font-size: 0.9rem;
	}

	.row {
		display: flex;
		align-items: end;
		gap: 1rem;
		margin-top: auto;
		flex-wrap: wrap;
	}

	.timing {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.flag {
		display: inline-block;
		width: fit-content;
		padding: 0.1rem 0.45rem;
		border-radius: 4px;
		background: #1a2a38;
		border: 1px solid var(--line);
		color: var(--cyan);
		font: 600 0.68rem var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.flag.off {
		color: #e8a87c;
	}

	.flag.regen {
		color: #f0a060;
		border-color: #f0a06055;
	}

	@media (max-width: 620px) {
		.shot-card {
			grid-template-columns: 1fr;
		}
	}
</style>
