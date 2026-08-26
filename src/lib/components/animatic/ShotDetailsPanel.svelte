<script lang="ts">
	import LanguageControls from '$lib/components/controls/LanguageControls.svelte';
	import {
		getCharacterById,
		getFactionById,
		getLocationById,
		getObjectById,
		getVehicleById,
		type ShotMedia
	} from '$lib/data/repositories/lookups';
	import { resolveLocalized } from '$lib/data/selectors/index';
	import { getLanguageState } from '$lib/state/language.svelte';
	import type { EntityRef, Note } from '$lib/types/common';
	import type { Cue, CuePlacement, ScriptFile, Shot, SourceReference } from '$lib/types/script';
	import { formatClock } from '$lib/utils/duration';

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

	function present(value: unknown): string {
		if (value === undefined || value === null || value === '') return '—';
		return String(value);
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
		return `${note.type}${note.resolved ? ' · resuelta' : ''}: ${note.text}`;
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
		if (!placement) return 'Sin ubicación temporal';
		const parts = [`inicio ${ms(placement.atMs)}`];
		if (placement.durationMs !== undefined) parts.push(`duración ${ms(placement.durationMs)}`);
		if (placement.sourceOffsetMs !== undefined)
			parts.push(`offset ${ms(placement.sourceOffsetMs)}`);
		if (placement.gainDb !== undefined) parts.push(`ganancia ${placement.gainDb} dB`);
		if (placement.presentationOverride)
			parts.push(`presentación ${placement.presentationOverride}`);
		const localized = placement.timingByLanguage?.[lang.dialogueLanguage];
		if (localized) parts.push(`temporización ${lang.dialogueLanguage} disponible`);
		return parts.join(' · ');
	}
</script>

<div class="details-content">
	<section>
		<h3>Identidad y tiempo</h3>
		<dl>
			<div>
				<dt>Escena / toma</dt>
				<dd>{scene?.number ?? '—'} / {shot.number}</dd>
			</div>
			<div>
				<dt>Posición</dt>
				<dd>{shotIndex + 1} de {totalShots}</dd>
			</div>
			<div>
				<dt>ID de toma</dt>
				<dd class="mono">{shot.id}</dd>
			</div>
			<div>
				<dt>Duración actual</dt>
				<dd>{ms(effectiveDurationMs)}</dd>
			</div>
			<div>
				<dt>Duración canónica</dt>
				<dd>{ms(shot.durationMs)}</dd>
			</div>
			<div>
				<dt>Entrada / salida</dt>
				<dd>{ms(absoluteInMs)} / {ms(absoluteInMs + effectiveDurationMs)}</dd>
			</div>
		</dl>
		<p><b>Contenido</b><br />{shot.description}</p>
		{#if shot.purpose}<p><b>Propósito</b><br />{shot.purpose}</p>{/if}
	</section>

	{#if scene}
		<section>
			<h3>Contexto narrativo</h3>
			<p><b>{scene.title}</b><br />{scene.summary}</p>
			{#if scene.dramaticPurpose}<p><b>Propósito dramático</b><br />{scene.dramaticPurpose}</p>{/if}
			<dl>
				<div>
					<dt>Localización</dt>
					<dd>
						{getLocationById(shot.locationId ?? scene.locationId)?.name ??
							shot.locationId ??
							scene.locationId}
					</dd>
				</div>
				<div>
					<dt>Interior / exterior</dt>
					<dd>{present(scene.setting.interiorExterior)}</dd>
				</div>
				<div>
					<dt>Momento</dt>
					<dd>{present(scene.setting.timeOfDay)}</dd>
				</div>
				<div>
					<dt>Tiempo del relato</dt>
					<dd>{present(scene.setting.storyTime)}</dd>
				</div>
				<div>
					<dt>Continuidad</dt>
					<dd>{present(scene.setting.continuity)}</dd>
				</div>
			</dl>
			{#each beats as beat (beat.id)}
				<div class="beat">
					<b>{beat.title ?? `Beat ${beat.order}`}</b>
					<p>{beat.summary}</p>
					<p>
						<span>Función:</span>
						{beat.purpose}{#if beat.tension !== undefined}
							· Tensión {beat.tension}{/if}
					</p>
				</div>
			{/each}
		</section>
	{/if}

	<section>
		<h3>Personas y entidades</h3>
		{#if shot.visibleRefs?.length}<p>
				<b>En cuadro</b><br />{shot.visibleRefs.map(entityLabel).join(', ')}
			</p>{/if}
		{#if shot.offScreenCharacterIds?.length}<p>
				<b>Fuera de cuadro</b><br />{shot.offScreenCharacterIds.map(characterName).join(', ')}
			</p>{/if}
		{#if scene?.characterIds.length}<p>
				<b>Personajes de la escena</b><br />{scene.characterIds.map(characterName).join(', ')}
			</p>{/if}
		{#if scene?.objectIds?.length}<p>
				<b>Objetos</b><br />{scene.objectIds.map((id) => getObjectById(id)?.name ?? id).join(', ')}
			</p>{/if}
		{#if scene?.vehicleIds?.length}<p>
				<b>Vehículos</b><br />{scene.vehicleIds
					.map((id) => getVehicleById(id)?.name ?? id)
					.join(', ')}
			</p>{/if}
		{#if scene?.factionIds?.length}<p>
				<b>Facciones</b><br />{scene.factionIds
					.map((id) => getFactionById(id)?.name ?? id)
					.join(', ')}
			</p>{/if}
	</section>

	<section>
		<h3>Composición y cámara</h3>
		<dl>
			<div>
				<dt>Tamaño</dt>
				<dd>{shot.composition.size}</dd>
			</div>
			<div>
				<dt>Ángulo</dt>
				<dd>{present(shot.composition.angle)}</dd>
			</div>
			<div>
				<dt>Encuadre</dt>
				<dd>{present(shot.composition.framing)}</dd>
			</div>
			<div>
				<dt>Foco</dt>
				<dd>{present(shot.composition.focus)}</dd>
			</div>
			<div>
				<dt>Primer término</dt>
				<dd>{present(shot.composition.foreground)}</dd>
			</div>
			<div>
				<dt>Fondo</dt>
				<dd>{present(shot.composition.background)}</dd>
			</div>
			<div>
				<dt>Relación de aspecto</dt>
				<dd>{present(shot.composition.aspectRatio)}</dd>
			</div>
			<div>
				<dt>Lente</dt>
				<dd>{shot.camera?.lensMm ? `${shot.camera.lensMm} mm` : '—'}</dd>
			</div>
			<div>
				<dt>Movimiento</dt>
				<dd>{present(shot.camera?.movement)}</dd>
			</div>
			<div>
				<dt>Descripción</dt>
				<dd>{present(shot.camera?.movementDescription)}</dd>
			</div>
			<div>
				<dt>Cuadro inicial</dt>
				<dd>{present(shot.camera?.startFrame)}</dd>
			</div>
			<div>
				<dt>Cuadro final</dt>
				<dd>{present(shot.camera?.endFrame)}</dd>
			</div>
		</dl>
		{#if shot.transitionIn}<p>
				<b>Entrada</b><br />{shot.transitionIn.type}{shot.transitionIn.durationMs
					? ` · ${ms(shot.transitionIn.durationMs)}`
					: ''}{shot.transitionIn.description ? ` · ${shot.transitionIn.description}` : ''}
			</p>{/if}
		{#if shot.transitionOut}<p>
				<b>Salida</b><br />{shot.transitionOut.type}{shot.transitionOut.durationMs
					? ` · ${ms(shot.transitionOut.durationMs)}`
					: ''}{shot.transitionOut.description ? ` · ${shot.transitionOut.description}` : ''}
			</p>{/if}
	</section>

	<section>
		<h3>Cues y línea temporal</h3>
		{#if cues.length}
			<ol class="cue-list">
				{#each cues as cue (cue.id)}
					{@const placement = placementByCueId.get(cue.id)}
					<li>
						<div class="cue-heading"><b>{cue.type}</b><span>{timingLabel(placement)}</span></div>
						{#if cue.type === 'action'}
							<p>{cue.text}</p>
						{:else if cue.type === 'dialogue'}
							{@const resolved = resolveLocalized(cue.content, lang.dialogueLanguage, 'es')}
							<p>
								<b>{characterName(cue.speakerId)}</b>{cue.addresseeIds?.length
									? ` a ${cue.addresseeIds.map(characterName).join(', ')}`
									: ''} · {placement?.presentationOverride ?? cue.presentation}
							</p>
							<p class="quote">“{resolved?.value.spokenText ?? 'Sin variante disponible'}”</p>
							{#if cue.performance}<p>
									Interpretación: {Object.entries(cue.performance)
										.map(([key, value]) => `${key} ${value}`)
										.join(' · ')}
								</p>{/if}
							{#if resolved?.value.delivery}<p>Entrega: {resolved.value.delivery}</p>{/if}
							{#if resolved?.value.pronunciationNote}<p>
									Pronunciación: {resolved.value.pronunciationNote}
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
								{cue.purpose ?? 'Silencio'}{cue.estimatedDurationMs !== undefined
									? ` · ${ms(cue.estimatedDurationMs)}`
									: ''}
							</p>
						{:else if cue.type === 'transition'}
							<p>{cue.transition}{cue.description ? ` · ${cue.description}` : ''}</p>
						{:else if cue.type === 'text'}
							{@const resolved = resolveLocalized(cue.content, lang.dialogueLanguage, 'es')}
							<p>{cue.presentation} · {resolved?.value.text ?? 'Sin variante disponible'}</p>
						{/if}
						{#if cue.notes?.length}<ul>
								{#each cue.notes as note (note)}<li>{noteLabel(note)}</li>{/each}
							</ul>{/if}
					</li>
				{/each}
			</ol>
		{:else}<p>Sin cues asignados.</p>{/if}
	</section>

	<section>
		<h3>Take, imagen y revisión</h3>
		<dl>
			<div>
				<dt>Take seleccionado</dt>
				<dd>{media.take ? `${media.take.number} · ${media.take.status}` : 'No disponible'}</dd>
			</div>
			<div>
				<dt>ID de take</dt>
				<dd class="mono">{media.take?.id ?? '—'}</dd>
			</div>
			<div>
				<dt>Asset</dt>
				<dd>{media.asset?.title ?? media.asset?.id ?? 'Sin asset resoluble'}</dd>
			</div>
			<div>
				<dt>Ruta</dt>
				<dd class="mono">{media.asset?.path ?? media.fallbackPath ?? '—'}</dd>
			</div>
			<div>
				<dt>Dimensiones</dt>
				<dd>
					{media.asset?.width && media.asset.height
						? `${media.asset.width} × ${media.asset.height}`
						: '—'}
				</dd>
			</div>
			<div>
				<dt>Estado visual</dt>
				<dd>
					{media.take?.imageStatus?.status ??
						media.asset?.imageStatus?.status ??
						(media.state === 'missing' ? 'missing' : 'current')}
				</dd>
			</div>
		</dl>
		{#if imageStatus}
			<p><b>Motivos</b><br />{imageStatus.reasons.join(', ')}</p>
			{#if imageStatus.explanation}<p><b>Explicación</b><br />{imageStatus.explanation}</p>{/if}
			{#if imageStatus.replacementBrief}<p>
					<b>Brief de reemplazo</b><br />{imageStatus.replacementBrief}
				</p>{/if}
			{#if media.take?.imageStatus?.sourceShotId}<p>
					<b>Toma de origen</b><br /><span class="mono">{media.take.imageStatus.sourceShotId}</span>
				</p>{/if}
		{/if}
		{#if media.take?.generation}
			<p>
				<b>Generación</b><br />{[
					media.take.generation.provider,
					media.take.generation.model,
					media.take.generation.generatedAt
				]
					.filter(Boolean)
					.join(' · ') || 'Metadatos parciales'}
			</p>
			{#if media.take.generation.prompt}<p>
					<b>Prompt</b><br />{media.take.generation.prompt}
				</p>{/if}
			{#if media.take.generation.negativePrompt}<p>
					<b>Prompt negativo</b><br />{media.take.generation.negativePrompt}
				</p>{/if}
			{#if media.take.generation.seed !== undefined}<p>
					<b>Seed</b><br />{media.take.generation.seed}
				</p>{/if}
		{/if}
		{#if media.take?.review}
			<p>
				<b>Revisión</b><br />{Object.entries(media.take.review)
					.map(([key, value]) => `${key}: ${value}`)
					.join(' · ')}
			</p>
		{/if}
	</section>

	{#if shot.notes?.length || shot.sourceRefs?.length || beats.some((beat) => beat.notes?.length || beat.sourceRefs?.length)}
		<section>
			<h3>Notas y procedencia</h3>
			{#if shot.notes?.length}<ul>
					{#each shot.notes as note (note)}<li>{noteLabel(note)}</li>{/each}
				</ul>{/if}
			{#if shot.sourceRefs?.length}<p>
					<b>Fuentes de la toma</b><br />{shot.sourceRefs.map(sourceLabel).join('; ')}
				</p>{/if}
			{#each beats as beat (beat.id)}
				{#if beat.notes?.length}<p>
						<b>Notas de {beat.title ?? beat.id}</b><br />{beat.notes.map(noteLabel).join('; ')}
					</p>{/if}
				{#if beat.sourceRefs?.length}<p>
						<b>Fuentes de {beat.title ?? beat.id}</b><br />{beat.sourceRefs
							.map(sourceLabel)
							.join('; ')}
					</p>{/if}
			{/each}
		</section>
	{/if}

	<section class="language-section">
		<h3>Idioma</h3>
		<LanguageControls />
	</section>
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

	.language-section {
		padding-bottom: 0;
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
