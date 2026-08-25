<script lang="ts">
	import AssetThumbnail from '$lib/components/media/AssetThumbnail.svelte';
	import DurationInput from './DurationInput.svelte';
	import { formatClock } from '$lib/utils/duration';
	import type { Shot } from '$lib/types/script';

	let {
		shot,
		imageSrc,
		durationMs,
		onduration
	}: {
		shot: Shot;
		imageSrc?: string;
		durationMs: number;
		onduration: (ms: number) => void;
	} = $props();
</script>

<article class="shot-card" id={shot.id}>
	<a class="media" href={`/animatic/player?shot=${encodeURIComponent(shot.id)}`}>
		<AssetThumbnail src={imageSrc} alt={`Toma ${shot.number}`} />
	</a>
	<div class="body">
		<header>
			<span class="num">Toma {shot.number}</span>
			<span class="size">{shot.composition.size}</span>
		</header>
		<p class="desc">{shot.description}</p>
		<div class="row">
			<DurationInput valueMs={durationMs} onchange={onduration} />
			<span class="clock">{formatClock(durationMs)}</span>
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
	}

	.clock {
		font-family: var(--font-mono);
		color: var(--muted);
		font-size: 0.85rem;
	}

	@media (max-width: 620px) {
		.shot-card {
			grid-template-columns: 1fr;
		}
	}
</style>
