<script lang="ts">
	import ShotCard from './ShotCard.svelte';
	import ContinuityWarnings from './ContinuityWarnings.svelte';
	import {
		getEffectiveTotalMs,
		getShotDurationMs,
		setShotDurationMs
	} from '$lib/state/animatic-editor.svelte';
	import { formatClock } from '$lib/utils/duration';
	import type { Scene, Shot } from '$lib/types/script';

	type SceneGroup = {
		scene: Scene;
		shots: Shot[];
		imageByShotId: Record<string, string | undefined>;
	};

	let {
		groups,
		targetDurationMs,
		warnings = []
	}: {
		groups: SceneGroup[];
		targetDurationMs?: number;
		warnings?: string[];
	} = $props();

	const allShots = $derived(groups.flatMap((g) => g.shots));
	const totalMs = $derived(getEffectiveTotalMs(allShots));
</script>

<div class="editor">
	<div class="dashboard">
		<div>
			<strong>{formatClock(totalMs)}</strong>
			<small>
				efectivo
				{#if targetDurationMs !== undefined}
					/ objetivo {formatClock(targetDurationMs)}
				{/if}
			</small>
		</div>
		<div class="progress" aria-hidden="true">
			<span
				style:width={`${targetDurationMs ? Math.min(100, (totalMs / targetDurationMs) * 100) : 0}%`}
			></span>
		</div>
		<a class="play-link" href="/animatic/player">Modo película</a>
	</div>

	<ContinuityWarnings {warnings} />

	{#each groups as group (group.scene.id)}
		<section class="scene-group">
			<header>
				<h2>Escena {group.scene.number}</h2>
				<p>{group.scene.summary || group.scene.title}</p>
				<small>
					{formatClock(getEffectiveTotalMs(group.shots))} · {group.shots.length} tomas
				</small>
			</header>
			<div class="shots">
				{#each group.shots as shot (shot.id)}
					<ShotCard
						{shot}
						imageSrc={group.imageByShotId[shot.id]}
						durationMs={getShotDurationMs(shot.id, shot.durationMs)}
						onduration={(ms) => setShotDurationMs(shot.id, ms)}
					/>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.dashboard {
		position: sticky;
		top: 0.75rem;
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

	.dashboard strong {
		font: 800 1.3rem var(--font-mono);
		color: var(--cyan);
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
	}
</style>
