<script lang="ts">
	import type { ShotMedia } from '$lib/data/repositories/lookups';
	import type { AnimaticPlaybackSpan } from '$lib/data/selectors/animaticPlaybackSpans';
	import { withBase } from '$lib/utils/paths';
	import AnimaticFrame from './AnimaticFrame.svelte';

	let {
		span,
		nextSpan = null,
		media,
		alt,
		shotId,
		playing,
		elapsedMs,
		muted = false,
		onVideoTime
	}: {
		span: AnimaticPlaybackSpan | undefined;
		nextSpan?: AnimaticPlaybackSpan | null;
		media: ShotMedia;
		alt: string;
		shotId: string;
		playing: boolean;
		elapsedMs: number;
		muted?: boolean;
		onVideoTime?: (ms: number) => void;
	} = $props();

	let videoA: HTMLVideoElement | undefined = $state();
	let videoB: HTMLVideoElement | undefined = $state();
	/** Which pool slot is the active (visible) player. */
	let activeSlot = $state<'a' | 'b'>('a');
	let boundJobId = $state<string | null>(null);

	const isVideo = $derived(span?.kind === 'stretchVideo');
	const activeVideo = $derived(activeSlot === 'a' ? videoA : videoB);
	const standbyVideo = $derived(activeSlot === 'a' ? videoB : videoA);

	function applyMute(el: HTMLVideoElement | undefined) {
		if (!el) return;
		el.muted = muted;
	}

	function syncActivePlayback() {
		const el = activeVideo;
		if (!el || span?.kind !== 'stretchVideo') return;
		applyMute(el);
		const targetSec = Math.max(0, elapsedMs / 1000);
		if (Math.abs(el.currentTime - targetSec) > 0.35) {
			try {
				el.currentTime = targetSec;
			} catch {
				/* ignore seek before ready */
			}
		}
		if (playing) {
			void el.play().catch(() => undefined);
		} else {
			el.pause();
		}
	}

	function loadInto(el: HTMLVideoElement | undefined, path: string | undefined, autoplay: boolean) {
		if (!el || !path) return;
		const url = withBase(path);
		if (el.dataset.src !== url) {
			el.dataset.src = url;
			el.src = url;
			el.load();
		}
		applyMute(el);
		if (autoplay) void el.play().catch(() => undefined);
		else el.pause();
	}

	$effect(() => {
		if (span?.kind !== 'stretchVideo') {
			boundJobId = null;
			videoA?.pause();
			videoB?.pause();
			return;
		}
		const jobId = span.jobId;
		if (jobId !== boundJobId) {
			const nextSlot: 'a' | 'b' = activeSlot === 'a' ? 'b' : 'a';
			const target = nextSlot === 'a' ? videoA : videoB;
			loadInto(target, span.videoPath, false);
			activeSlot = nextSlot;
			boundJobId = jobId;
			const prev = nextSlot === 'a' ? videoB : videoA;
			prev?.pause();
		}
		syncActivePlayback();
	});

	$effect(() => {
		muted;
		applyMute(videoA);
		applyMute(videoB);
	});

	$effect(() => {
		playing;
		elapsedMs;
		if (span?.kind === 'stretchVideo') syncActivePlayback();
	});

	$effect(() => {
		if (typeof HTMLVideoElement === 'undefined') return;
		if (nextSpan?.kind === 'stretchVideo' && nextSpan.jobId !== boundJobId) {
			loadInto(standbyVideo, nextSpan.videoPath, false);
		}
	});

	function onTimeUpdate(e: Event) {
		const el = e.currentTarget as HTMLVideoElement;
		if (el !== activeVideo) return;
		onVideoTime?.(el.currentTime * 1000);
	}
</script>

<div class="stage">
	{#if isVideo && span?.kind === 'stretchVideo'}
		<video
			bind:this={videoA}
			class="stretch-video"
			class:active={activeSlot === 'a'}
			playsinline
			preload="auto"
			ontimeupdate={onTimeUpdate}
		></video>
		<video
			bind:this={videoB}
			class="stretch-video"
			class:active={activeSlot === 'b'}
			playsinline
			preload="auto"
			ontimeupdate={onTimeUpdate}
		></video>
		{#if span.imageStatus?.status === 'needs_review'}
			<div class="badge" aria-hidden="true">Seedance · review</div>
		{:else}
			<div class="badge" aria-hidden="true">Seedance</div>
		{/if}
	{:else}
		<AnimaticFrame {media} {alt} {shotId} />
	{/if}
</div>

<style>
	.stage {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
		background: #01060b;
	}

	.stretch-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		opacity: 0;
		pointer-events: none;
		background: #01060b;
	}

	.stretch-video.active {
		opacity: 1;
	}

	.badge {
		position: absolute;
		top: 0.65rem;
		right: 0.75rem;
		z-index: 2;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background: color-mix(in srgb, #d4a017 32%, transparent);
		color: #ffe9a8;
		pointer-events: none;
	}
</style>
