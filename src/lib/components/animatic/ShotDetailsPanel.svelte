<script lang="ts">
	import DurationPair from '$lib/components/timing/DurationPair.svelte';
	import {
		getCharacterById,
		getFactionById,
		getLocationById,
		getObjectById,
		getVehicleById,
		type ShotMedia
	} from '$lib/data/repositories/lookups';
	import { resolveLocalized } from '$lib/data/selectors/index';
	import { editorialValueLabel } from '$lib/data/selectors/editorialPresentation';
	import {
		analyzeShotDialogue,
		estimateShotSpokenMs
	} from '$lib/data/selectors/dialogueTiming';
	import { getShotReadinessChips } from '$lib/data/selectors/editorialReadiness';
	import { getLanguageState } from '$lib/state/language.svelte';
	import type { EntityRef, Note } from '$lib/types/common';
	import type { Cue, CuePlacement, ScriptFile, Shot, SourceReference } from '$lib/types/script';
	import { formatClock } from '$lib/utils/duration';
	import * as m from '$lib/paraglide/messages.js';

	let {
		script,
		shot,
		cues,
		media,
		effectiveDurationMs,
		absoluteInMs,
		shotIndex,
		totalShots
	}: {
		script: ScriptFile;
		shot: Shot;
		cues: Cue[];
		media: ShotMedia;
		effectiveDurationMs: number;
		absoluteInMs: number;
		shotIndex: number;
		totalShots: number;
	} = $props();

	const lang = $derived(getLanguageState());
	const scene = $derived(script.scenes.find((item) => item.id === shot.sceneId));
	const beats = $derived(
		shot.beatIds
			.map((id) => script.beats.find((item) => item.id === id))
			.filter((item) => item !== undefined)
	);
	const placementByCueId = $derived(
		new Map(shot.cuePlacements.map((placement) => [placement.cueId, placement]))
	);
	const imageStatus = $derived(media.take?.imageStatus ?? media.asset?.imageStatus);
	const shotSpokenMs = $derived(estimateShotSpokenMs(script, shot, lang.dialogueLanguage));
	const dialogueFlags = $derived(analyzeShotDialogue(script, shot, lang.dialogueLanguage));
	const readinessChips = $derived(getShotReadinessChips(script, shot));

	function present(value: unknown): string {
		return editorialValueLabel(value, lang.interfaceLanguage);
	}

	function ms(value: number | undefined): string {
		if (value === undefined) return '—';
		return `${formatClock(value)} (${(value / 1000).toFixed(2)} s)`;
	}

	function characterName(id: string): string {
		const character = getCharacterById(id);
		return character?.shortName ?? character?.name ?? id;
	}

	function entityLabel(ref: EntityRef): string {
		let name: string | undefined;
		if (ref.kind === 'character') name = characterName(ref.id);
		else if (ref.kind === 'location') name = getLocationById(ref.id)?.name;
		else if (ref.kind === 'object') name = getObjectById(ref.id)?.name;
		else if (ref.kind === 'vehicle') name = getVehicleById(ref.id)?.name;
		else if (ref.kind === 'faction') name = getFactionById(ref.id)?.name;
		return `${name ?? ref.id}${ref.role ? ` — ${ref.role}` : ''}`;
	}

	function noteLabel(note: Note): string {
		return `${present(note.type)}${note.status === 'resolved' || note.resolved ? ` · ${m.details_resolved()}` : ''}: ${present(note.text)}`;
	}

	function sourceLabel(source: SourceReference): string {
		if (source.kind === 'document') {
			return `${source.documentId}${source.anchor ? ` #${source.anchor}` : ''}`;
		}
		return [source.scriptId, source.sceneId, source.beatId, source.cueId, source.shotId]
			.filter(Boolean)
			.join(' · ');
	}

	function timingLabel(placement: CuePlacement | undefined): string {
		if (!placement) return m.details_no_timing();
		const parts = [`${m.details_start()} ${ms(placement.atMs)}`];
		if (placement.durationMs !== undefined)
			parts.push(`${m.details_duration()} ${ms(placement.durationMs)}`);
		if (placement.sourceOffsetMs !== undefined)
			parts.push(`${m.details_offset()} ${ms(placement.sourceOffsetMs)}`);
		if (placement.gainDb !== undefined) parts.push(`${m.details_gain()} ${placement.gainDb} dB`);
		if (placement.presentationOverride)
			parts.push(`${m.details_presentation()} ${present(placement.presentationOverride)}`);
		const localized = placement.timingByLanguage?.[lang.dialogueLanguage];
		if (localized) parts.push(m.details_timing_available({ language: lang.dialogueLanguage }));
		return parts.join(' · ');
	}
</script>

<div class="details-content">
	<section>
		<h3>{m.details_identity_time()}</h3>
		<dl>
			<div>
				<dt>{m.details_scene_shot()}</dt>
				<dd>{scene?.number ?? '—'} / {shot.number}</dd>
			</div>
			<div>
				<dt>{m.details_position()}</dt>
				<dd>{shotIndex + 1} {m.details_of()} {totalShots}</dd>
			</div>
			<div>
				<dt>{m.details_shot_id()}</dt>
				<dd class="mono">{shot.id}</dd>
			</div>
			<div>
				<dt>{m.animatic_current_duration()}</dt>
				<dd>
					<DurationPair montageMs={effectiveDurationMs} spokenMs={shotSpokenMs} />
				</dd>
			</div>
			{#if readinessChips.length || dialogueFlags.multiSpeaker || dialogueFlags.offCameraDialogue}
				<div>
					<dt>{m.readiness_label()}</dt>
					<dd class="flags">
						{#if readinessChips.includes('regenerate')}
							<span class="flag">{m.readiness_regenerate()}</span>
						{/if}
						{#if readinessChips.includes('missing_purpose')}
							<span class="flag">{m.readiness_missing_purpose()}</span>
						{/if}
						{#if readinessChips.includes('missing_camera')}
							<span class="flag">{m.readiness_missing_camera()}</span>
						{/if}
						{#if dialogueFlags.multiSpeaker}
							<span class="flag">{m.timing_flag_multi_speaker({ count: dialogueFlags.speakerCount })}</span>
						{/if}
						{#if dialogueFlags.offCameraDialogue}
							<span class="flag">{m.timing_flag_off_camera()}</span>
						{/if}
					</dd>
				</div>
			{/if}
			<div>
				<dt>{m.details_canonical_duration()}</dt>
				<dd>{ms(shot.durationMs)}</dd>
			</div>
			<div>
				<dt>{m.details_in_out()}</dt>
				<dd>{ms(absoluteInMs)} / {ms(absoluteInMs + effectiveDurationMs)}</dd>
			</div>
		</dl>
		<p><b>{m.animatic_content()}</b><br />{shot.description}</p>
		{#if shot.purpose}<p><b>{m.details_purpose()}</b><br />{shot.purpose}</p>{/if}
	</section>

	{#if scene}
		<section>
			<h3>{m.details_narrative_context()}</h3>
			<p><b>{scene.title}</b><br />{scene.summary}</p>
			{#if scene.dramaticPurpose}<p>
					<b>{m.details_dramatic_purpose()}</b><br />{scene.dramaticPurpose}
				</p>{/if}
			<dl>
				<div>
					<dt>{m.details_location()}</dt>
					<dd>
						{getLocationById(shot.locationId ?? scene.locationId)?.name ??
							shot.locationId ??
							scene.locationId}
					</dd>
				</div>
				<div>
					<dt>{m.details_interior_exterior()}</dt>
					<dd>{present(scene.setting.interiorExterior)}</dd>
				</div>
				<div>
					<dt>{m.details_moment()}</dt>
					<dd>{present(scene.setting.timeOfDay)}</dd>
				</div>
				<div>
					<dt>{m.details_story_time()}</dt>
					<dd>{present(scene.setting.storyTime)}</dd>
				</div>
				<div>
					<dt>{m.animatic_continuity()}</dt>
					<dd>{present(scene.setting.continuity)}</dd>
				</div>
			</dl>
			{#each beats as beat (beat.id)}
				<div class="beat">
					<b>{beat.title ?? `${m.details_beat()} ${beat.order}`}</b>
					<p>{beat.summary}</p>
					<p>
						<span>{m.details_function()}:</span>
						{beat.purpose}{#if beat.tension !== undefined}
							· {m.details_tension()} {beat.tension}{/if}
					</p>
				</div>
			{/each}
		</section>
	{/if}

	<section>
		<h3>{m.details_people_entities()}</h3>
		{#if shot.visibleRefs?.length}<p>
				<b>{m.details_in_frame()}</b><br />{shot.visibleRefs.map(entityLabel).join(', ')}
			</p>{/if}
		{#if shot.offScreenCharacterIds?.length}<p>
				<b>{m.details_offscreen()}</b><br />{shot.offScreenCharacterIds
					.map(characterName)
					.join(', ')}
			</p>{/if}
		{#if scene?.characterIds.length}<p>
				<b>{m.details_scene_characters()}</b><br />{scene.characterIds
					.map(characterName)
					.join(', ')}
			</p>{/if}
		{#if scene?.objectIds?.length}<p>
				<b>{m.entities_objects()}</b><br />{scene.objectIds
					.map((id) => getObjectById(id)?.name ?? id)
					.join(', ')}
			</p>{/if}
		{#if scene?.vehicleIds?.length}<p>
				<b>{m.entities_vehicles()}</b><br />{scene.vehicleIds
					.map((id) => getVehicleById(id)?.name ?? id)
					.join(', ')}
			</p>{/if}
		{#if scene?.factionIds?.length}<p>
				<b>{m.entities_factions()}</b><br />{scene.factionIds
					.map((id) => getFactionById(id)?.name ?? id)
					.join(', ')}
			</p>{/if}
	</section>

	<section>
		<h3>{m.animatic_camera()}</h3>
		<dl>
			<div>
				<dt>{m.details_size()}</dt>
				<dd>{shot.composition.size}</dd>
			</div>
			<div>
				<dt>{m.details_angle()}</dt>
				<dd>{present(shot.composition.angle)}</dd>
			</div>
			<div>
				<dt>{m.details_framing()}</dt>
				<dd>{present(shot.composition.framing)}</dd>
			</div>
			<div>
				<dt>{m.details_focus()}</dt>
				<dd>{present(shot.composition.focus)}</dd>
			</div>
			<div>
				<dt>{m.details_foreground()}</dt>
				<dd>{present(shot.composition.foreground)}</dd>
			</div>
			<div>
				<dt>{m.details_background()}</dt>
				<dd>{present(shot.composition.background)}</dd>
			</div>
			<div>
				<dt>{m.details_aspect_ratio()}</dt>
				<dd>{present(shot.composition.aspectRatio)}</dd>
			</div>
			<div>
				<dt>{m.details_lens()}</dt>
				<dd>{shot.camera?.lensMm ? `${shot.camera.lensMm} mm` : '—'}</dd>
			</div>
			<div>
				<dt>{m.details_movement()}</dt>
				<dd>{present(shot.camera?.movement)}</dd>
			</div>
			<div>
				<dt>{m.details_description()}</dt>
				<dd>{present(shot.camera?.movementDescription)}</dd>
			</div>
			<div>
				<dt>{m.details_start_frame()}</dt>
				<dd>{present(shot.camera?.startFrame)}</dd>
			</div>
			<div>
				<dt>{m.details_end_frame()}</dt>
				<dd>{present(shot.camera?.endFrame)}</dd>
			</div>
		</dl>
		{#if shot.transitionIn}<p>
				<b>{m.details_transition_in()}</b><br />{shot.transitionIn.type}{shot.transitionIn
					.durationMs
					? ` · ${ms(shot.transitionIn.durationMs)}`
					: ''}{shot.transitionIn.description ? ` · ${shot.transitionIn.description}` : ''}
			</p>{/if}
		{#if shot.transitionOut}<p>
				<b>{m.details_transition_out()}</b><br />{shot.transitionOut.type}{shot.transitionOut
					.durationMs
					? ` · ${ms(shot.transitionOut.durationMs)}`
					: ''}{shot.transitionOut.description ? ` · ${shot.transitionOut.description}` : ''}
			</p>{/if}
	</section>

	<section>
		<h3>{m.details_cues_timeline()}</h3>
		{#if cues.length}
			<ol class="cue-list">
				{#each cues as cue (cue.id)}
					{@const placement = placementByCueId.get(cue.id)}
					<li>
						<div class="cue-heading">
							<b>{present(cue.type)}</b><span>{timingLabel(placement)}</span>
						</div>
						{#if cue.type === 'action'}
							<p>{cue.text}</p>
						{:else if cue.type === 'dialogue'}
							{@const resolved = resolveLocalized(cue.content, lang.dialogueLanguage, 'es')}
							<p>
								<b>{characterName(cue.speakerId)}</b>{cue.addresseeIds?.length
									? ` ${m.details_to()} ${cue.addresseeIds.map(characterName).join(', ')}`
									: ''} · {present(placement?.presentationOverride ?? cue.presentation)}
							</p>
							<p class="quote">“{resolved?.value.spokenText ?? m.details_no_variant()}”</p>
							{#if cue.performance}<p>
									{m.details_performance()}: {Object.entries(cue.performance)
										.map(([key, value]) => `${present(key)} ${value}`)
										.join(' · ')}
								</p>{/if}
							{#if resolved?.value.delivery}<p>
									{m.details_delivery()}: {resolved.value.delivery}
								</p>{/if}
							{#if resolved?.value.pronunciationNote}<p>
									{m.details_pronunciation()}: {resolved.value.pronunciationNote}
								</p>{/if}
						{:else if cue.type === 'sound'}
							<p>
								{cue.description}{cue.mode ? ` · ${cue.mode}` : ''}{cue.loop
									? ' · loop'
									: ''}{cue.gainDb !== undefined ? ` · ${cue.gainDb} dB` : ''}
							</p>
						{:else if cue.type === 'music'}
							<p>
								{cue.operation} · {cue.description}{cue.gainDb !== undefined
									? ` · ${cue.gainDb} dB`
									: ''}
							</p>
						{:else if cue.type === 'silence'}
							<p>
								{cue.purpose ?? m.script_silence()}{cue.estimatedDurationMs !== undefined
									? ` · ${ms(cue.estimatedDurationMs)}`
									: ''}
							</p>
						{:else if cue.type === 'transition'}
							<p>{cue.transition}{cue.description ? ` · ${cue.description}` : ''}</p>
						{:else if cue.type === 'text'}
							{@const resolved = resolveLocalized(cue.content, lang.dialogueLanguage, 'es')}
							<p>{present(cue.presentation)} · {resolved?.value.text ?? m.details_no_variant()}</p>
						{/if}
						{#if cue.notes?.length}<ul>
								{#each cue.notes as note (note)}<li>{noteLabel(note)}</li>{/each}
							</ul>{/if}
					</li>
				{/each}
			</ol>
		{:else}<p>{m.details_no_cues()}</p>{/if}
	</section>

	<section>
		<h3>{m.details_take_image_review()}</h3>
		<dl>
			<div>
				<dt>{m.details_selected_take()}</dt>
				<dd>
					{media.take
						? `${media.take.number} · ${present(media.take.status)}`
						: m.details_unavailable()}
				</dd>
			</div>
			<div>
				<dt>{m.details_take_id()}</dt>
				<dd class="mono">{media.take?.id ?? '—'}</dd>
			</div>
			<div>
				<dt>{m.details_asset()}</dt>
				<dd>{media.asset?.title ?? media.asset?.id ?? m.details_unresolved_asset()}</dd>
			</div>
			<div>
				<dt>{m.details_path()}</dt>
				<dd class="mono">{media.asset?.path ?? media.fallbackPath ?? '—'}</dd>
			</div>
			<div>
				<dt>{m.asset_dimensions()}</dt>
				<dd>
					{media.asset?.width && media.asset.height
						? `${media.asset.width} × ${media.asset.height}`
						: '—'}
				</dd>
			</div>
			<div>
				<dt>{m.details_visual_status()}</dt>
				<dd>
					{present(
						media.take?.imageStatus?.status ??
							media.asset?.imageStatus?.status ??
							(media.state === 'missing' ? 'missing' : 'current')
					)}
				</dd>
			</div>
		</dl>
		{#if imageStatus}
			<p><b>{m.details_reasons()}</b><br />{imageStatus.reasons.map(present).join(', ')}</p>
			{#if imageStatus.explanation}<p>
					<b>{m.details_explanation()}</b><br />{imageStatus.explanation}
				</p>{/if}
			{#if imageStatus.replacementBrief}<p>
					<b>{m.details_replacement_brief()}</b><br />{imageStatus.replacementBrief}
				</p>{/if}
			{#if media.take?.imageStatus?.sourceShotId}<p>
					<b>{m.details_source_shot()}</b><br /><span class="mono"
						>{media.take.imageStatus.sourceShotId}</span
					>
				</p>{/if}
		{/if}
		{#if media.take?.generation}
			<p>
				<b>{m.details_generation()}</b><br />{[
					media.take.generation.provider,
					media.take.generation.model,
					media.take.generation.generatedAt
				]
					.filter(Boolean)
					.join(' · ') || m.details_partial_metadata()}
			</p>
			{#if media.take.generation.prompt}<p>
					<b>Prompt</b><br />{media.take.generation.prompt}
				</p>{/if}
			{#if media.take.generation.negativePrompt}<p>
					<b>{m.details_negative_prompt()}</b><br />{media.take.generation.negativePrompt}
				</p>{/if}
			{#if media.take.generation.seed !== undefined}<p>
					<b>Seed</b><br />{media.take.generation.seed}
				</p>{/if}
		{/if}
		{#if media.take?.review}
			<p>
				<b>{m.details_review()}</b><br />{Object.entries(media.take.review)
					.map(([key, value]) => `${key}: ${value}`)
					.join(' · ')}
			</p>
		{/if}
	</section>

	{#if shot.notes?.length || shot.sourceRefs?.length || beats.some((beat) => beat.notes?.length || beat.sourceRefs?.length)}
		<section>
			<h3>{m.details_notes_provenance()}</h3>
			{#if shot.notes?.length}<ul>
					{#each shot.notes as note (note)}<li>{noteLabel(note)}</li>{/each}
				</ul>{/if}
			{#if shot.sourceRefs?.length}<p>
					<b>{m.details_shot_sources()}</b><br />{shot.sourceRefs.map(sourceLabel).join('; ')}
				</p>{/if}
			{#each beats as beat (beat.id)}
				{#if beat.notes?.length}<p>
						<b>{m.details_notes_for({ name: beat.title ?? beat.id })}</b><br />{beat.notes
							.map(noteLabel)
							.join('; ')}
					</p>{/if}
				{#if beat.sourceRefs?.length}<p>
						<b>{m.details_sources_for({ name: beat.title ?? beat.id })}</b><br />{beat.sourceRefs
							.map(sourceLabel)
							.join('; ')}
					</p>{/if}
			{/each}
		</section>
	{/if}

</div>

<style>
	.details-content {
		color: #c8d2db;
		font-size: 0.82rem;
		line-height: 1.45;
	}

	section {
		padding: 0.8rem 0;
		border-top: 1px solid #ffffff1b;
	}

	section:first-child {
		border-top: 0;
	}

	h3 {
		margin: 0 0 0.55rem;
		color: var(--gold);
		font-size: 0.82rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	p {
		margin: 0.45rem 0;
	}

	b,
	dt {
		color: #fff;
	}

	dl {
		display: grid;
		gap: 0.35rem;
		margin: 0.35rem 0 0.65rem;
	}

	dl > div {
		display: grid;
		grid-template-columns: minmax(7.5rem, 40%) 1fr;
		gap: 0.55rem;
	}

	dt,
	dd {
		margin: 0;
	}

	dd,
	.mono {
		overflow-wrap: anywhere;
	}

	.mono {
		font-family: var(--font-mono), ui-monospace, monospace;
		font-size: 0.76rem;
	}

	.beat {
		margin-top: 0.6rem;
		padding: 0.6rem;
		border-left: 2px solid #42d9e766;
		background: #ffffff08;
	}

	.beat p {
		margin: 0.25rem 0 0;
	}

	.beat span,
	.cue-heading span {
		color: #94a7b2;
	}

	.cue-list,
	ul {
		margin: 0.45rem 0;
		padding-left: 1.2rem;
	}

	.cue-list > li {
		margin-bottom: 0.75rem;
	}

	.cue-heading {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.25rem 0.75rem;
	}

	.cue-heading b {
		color: var(--cyan);
		text-transform: uppercase;
	}

	.quote {
		font-family: var(--font-serif), serif;
		font-size: 0.9rem;
		color: #f4f6f7;
	}

	.flags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.flag {
		display: inline-block;
		padding: 0.1rem 0.45rem;
		border-radius: 4px;
		background: #ffffff12;
		border: 1px solid #ffffff2a;
		color: var(--cyan);
		font: 600 0.68rem var(--font-mono);
		text-transform: uppercase;
	}

	@media (max-width: 480px) {
		dl > div {
			grid-template-columns: 1fr;
			gap: 0.05rem;
		}

		dt {
			font-size: 0.72rem;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		.cue-heading {
			display: grid;
		}
	}
</style>
