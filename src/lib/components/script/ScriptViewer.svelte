<script lang="ts">
	import type { Act, Beat, CharacterFunctionAssignment, Cue, Scene } from '$lib/types/script';
	import SceneSection from './SceneSection.svelte';

	let {
		acts,
		scenesById,
		beatsBySceneId,
		cuesByBeatId,
		characterFunctionAssignments
	}: {
		acts: Act[];
		scenesById: Record<string, Scene>;
		beatsBySceneId: Record<string, Beat[]>;
		cuesByBeatId: Record<string, Cue[]>;
		characterFunctionAssignments?: CharacterFunctionAssignment[];
	} = $props();
</script>

<div class="script-viewer">
	{#if characterFunctionAssignments?.length}
		<section class="functions" aria-label="Asignación de funciones narrativas">
			<h2>Funciones narrativas</h2>
			<p class="lede">
				Reasignaciones de función dramática específicas de este cut (no alteran el guion canónico).
			</p>
			<ul>
				{#each characterFunctionAssignments as a (a.functionId + a.characterId)}
					<li>
						<code>{a.functionId}</code>
						→ <code>{a.characterId}</code>
						<span class="rel">{a.relationship}</span>
						{#if a.sourceCharacterIds?.length}
							<small>desde {a.sourceCharacterIds.join(', ')}</small>
						{/if}
						{#if a.notes}
							<p>{a.notes}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#each acts as act (act.id)}
		<section class="act">
			<header>
				<p class="eyebrow">Acto {act.number}</p>
				<h2>{act.title ?? `Acto ${act.number}`}</h2>
				{#if act.dramaticPurpose}
					<p>{act.dramaticPurpose}</p>
				{/if}
			</header>
			{#each act.sceneIds as sceneId (sceneId)}
				{@const scene = scenesById[sceneId]}
				{#if scene}
					<SceneSection {scene} beats={beatsBySceneId[scene.id] ?? []} {cuesByBeatId} />
				{/if}
			{/each}
		</section>
	{/each}
</div>

<style>
	.script-viewer {
		max-width: var(--max);
	}

	.functions {
		margin-bottom: 2.5rem;
		padding: 1.25rem 1.35rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
	}

	.functions h2 {
		margin: 0 0 0.35rem;
		font: 700 1.25rem var(--font-serif);
	}

	.functions .lede {
		margin: 0 0 1rem;
		color: var(--muted);
		font-size: 0.9rem;
	}

	.functions ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	.functions li {
		padding: 0.65rem 0;
		border-top: 1px solid var(--line);
	}

	.functions li:first-child {
		border-top: 0;
		padding-top: 0;
	}

	.functions code {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--cyan);
	}

	.functions .rel {
		margin-left: 0.5rem;
		color: var(--gold);
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.functions small {
		display: block;
		margin-top: 0.25rem;
		color: var(--muted);
	}

	.functions p {
		margin: 0.35rem 0 0;
		color: var(--muted);
		font-size: 0.88rem;
	}

	.act {
		margin-bottom: 3rem;
	}

	.eyebrow {
		margin: 0 0 0.35rem;
		color: var(--gold);
		font: 800 0.72rem var(--font-mono);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0 0 0.5rem;
		font: 700 1.85rem/1.1 var(--font-serif);
	}

	.act > header p:last-child {
		margin: 0;
		color: var(--muted);
	}

	@media (max-width: 480px) {
		.functions {
			padding: 1rem;
		}

		.functions code {
			overflow-wrap: anywhere;
		}

		h2 {
			font-size: 1.55rem;
		}
	}
</style>
