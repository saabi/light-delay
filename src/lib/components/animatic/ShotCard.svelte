<script lang="ts">
	import AnimaticFrame from './AnimaticFrame.svelte';
	import DurationInput from './DurationInput.svelte';
	import DurationPair from '$lib/components/timing/DurationPair.svelte';
	import type { ShotReadinessChip } from '$lib/data/selectors/editorialReadiness';
	import type { ShotDialogueAnalysis } from '$lib/data/selectors/dialogueTiming';
	import { getCharacterById } from '$lib/data/repositories/lookups';
	import { resolveLocalized } from '$lib/data/selectors/index';
	import { getLanguageState } from '$lib/state/language.svelte';
	import type { Cue, Shot } from '$lib/types/script';
	import type { ShotMedia } from '$lib/data/repositories/lookups';
	import * as m from '$lib/paraglide/messages.js';

	let {
		shot,
		media,
		durationMs,
		spokenMs,
		dialogueFlags,
		cues = [],
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
		cues?: Cue[];
		readinessChips?: ShotReadinessChip[];
		playerHref: string;
		onduration: (ms: number) => void;
	} = $props();

	const lang = $derived(getLanguageState());
	const dialogueCues = $derived(
		cues.filter((cue): cue is Extract<Cue, { type: 'dialogue' }> => cue.type === 'dialogue')
	);
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
		{#if dialogueCues.length}
			<section class="dialogue" aria-label={m.animatic_dialogue()}>
				<h3 class="dialogue-heading">{m.animatic_dialogue()}</h3>
				<ul class="dialogue-list">
					{#each dialogueCues as cue (cue.id)}
						{@const speaker = getCharacterById(cue.speakerId)}
						{@const resolved = resolveLocalized(cue.content, lang.dialogueLanguage, 'es')}
						<li>
							<span class="speaker">
								{speaker?.shortName ?? speaker?.name ?? cue.speakerId}
								{#if cue.presentation !== 'on_screen'}
									<span class="presentation">({cue.presentation})</span>
								{/if}
							</span>
							<span class="line"
								>{resolved?.value.spokenText ?? m.details_no_variant()}</span
							>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
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

	.dialogue {
		margin: 0;
	}

	.dialogue-heading {
		margin: 0 0 0.35rem;
		color: var(--gold);
		font: 700 0.68rem var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.dialogue-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.dialogue-list li {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.speaker {
		color: var(--gold);
		font: 700 0.72rem var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.presentation {
		color: var(--muted);
		font-weight: 600;
		text-transform: none;
	}

	.line {
		color: var(--ink);
		font-size: 0.88rem;
		line-height: 1.35;
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
