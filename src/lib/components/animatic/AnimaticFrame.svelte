<script lang="ts">
	import type { ShotMedia } from '$lib/data/repositories/lookups';
	import { withBase } from '$lib/utils/paths';

	let {
		media,
		alt,
		shotId,
		loading = 'eager',
		fit = 'contain'
	}: {
		media: ShotMedia;
		alt: string;
		shotId: string;
		loading?: 'eager' | 'lazy';
		fit?: 'contain' | 'cover';
	} = $props();

	let failedImagePath = $state<string>();
	let failedFallback = $state(false);

	const imagePath = $derived(media.imagePath ? withBase(media.imagePath) : undefined);
	const fallbackPath = $derived(media.fallbackPath ? withBase(media.fallbackPath) : undefined);
	const imageFailed = $derived(Boolean(imagePath && failedImagePath === imagePath));
	const missing = $derived(media.state === 'missing' || imageFailed);
	const displayPath = $derived(missing ? fallbackPath : imagePath);
	const sourceShotId = $derived(media.take?.imageStatus?.sourceShotId);

	function onImageError() {
		if (!missing && imagePath) {
			failedImagePath = imagePath;
			return;
		}
		failedFallback = true;
	}
</script>

<div class="frame" class:missing class:provisional={media.state === 'provisional'}>
	{#if displayPath && !failedFallback}
		<img src={displayPath} {alt} {loading} onerror={onImageError} style:object-fit={fit} />
	{:else}
		<div class="fallback-surface" aria-hidden="true"></div>
	{/if}

	{#if missing}
		<div class="missing-label" role="img" aria-label={`Imagen pendiente para ${shotId}`}>
			<strong>IMAGEN PENDIENTE</strong>
			<span>{shotId}</span>
			{#if imageFailed}<small>No se pudo cargar la imagen asignada</small>{/if}
		</div>
	{:else if media.state === 'provisional'}
		<div class="placeholder-label">
			<strong>PLACEHOLDER</strong>
			{#if sourceShotId}<span>Origen: {sourceShotId}</span>{/if}
		</div>
	{/if}
</div>

<style>
	.frame {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		background: #01060b;
	}

	img,
	.fallback-surface {
		display: block;
		width: 100%;
		height: 100%;
	}

	.fallback-surface {
		background:
			linear-gradient(90deg, transparent 49.8%, #42d9e722 50%, transparent 50.2%),
			linear-gradient(0deg, transparent 49.8%, #42d9e722 50%, transparent 50.2%), #020a12;
	}

	.placeholder-label,
	.missing-label {
		position: absolute;
		z-index: 2;
		display: flex;
		gap: 0.4rem;
		align-items: center;
		font-family: var(--font-mono), ui-monospace, monospace;
		letter-spacing: 0.04em;
		text-shadow: 0 1px 4px #000;
	}

	.placeholder-label {
		left: 0.65rem;
		top: 0.65rem;
		flex-wrap: wrap;
		padding: 0.35rem 0.5rem;
		border: 1px solid #ffb84d99;
		border-radius: 4px;
		background: #120b02dc;
		font-size: 0.68rem;
		color: #ffd18b;
	}

	.placeholder-label span {
		color: #e8edf1;
	}

	.missing-label {
		inset: 0;
		flex-direction: column;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		color: #f5f8fa;
		pointer-events: none;
	}

	.missing-label strong {
		font-size: clamp(1rem, 3vw, 2rem);
		color: var(--gold, #ffb84d);
	}

	.missing-label span,
	.missing-label small {
		color: #a8c0cd;
	}
</style>
