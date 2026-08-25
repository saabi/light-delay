<script lang="ts">
	import Button from '$lib/components/primitives/Button.svelte';
	import LanguageControls from '$lib/components/controls/LanguageControls.svelte';
	import CueRenderer from '$lib/components/script/CueRenderer.svelte';
	import {
		getPlayerState,
		pause,
		play,
		setDetailsOpen,
		setElapsedInShotMs,
		setShotIndex,
		setStatus,
		stop,
		toggleDetails
	} from '$lib/state/player.svelte';
	import { getLanguageState } from '$lib/state/language.svelte';
	import { durationFromEdits, loadAnimaticEdits } from '$lib/state/animatic-overlay';
	import { getSubtitleSegments } from '$lib/data/selectors/index';
	import { formatClock } from '$lib/utils/duration';
	import type { Cue, ScriptFile, Shot } from '$lib/types/script';
	import { onDestroy } from 'svelte';

	type ShotView = {
		shot: Shot;
		imageSrc?: string;
		cues: Cue[];
	};

	let {
		script,
		shots,
		returnHref = '/animatic'
	}: {
		script: ScriptFile;
		shots: ShotView[];
		returnHref?: string;
	} = $props();

	const player = $derived(getPlayerState());
	const lang = $derived(getLanguageState());
	const edits = $derived(loadAnimaticEdits(script.script.id, script.script.version));

	const durations = $derived(
		shots.map((s) => durationFromEdits(edits, s.shot.id, s.shot.durationMs))
	);

	const totalMs = $derived(durations.reduce((a, b) => a + b, 0));

	const absoluteMs = $derived(
		durations.slice(0, player.shotIndex).reduce((a, b) => a + b, 0) + player.elapsedInShotMs
	);

	const current = $derived(shots[player.shotIndex]);
	const currentDuration = $derived(durations[player.shotIndex] ?? 0);

	const activeSubtitles = $derived.by(() => {
		if (!current || lang.subtitleLanguage === null) return [];
		const segments = getSubtitleSegments(script, {
			dialogueLanguage: lang.dialogueLanguage,
			subtitleLanguage: lang.subtitleLanguage,
			projectFallback: 'es',
			shotIds: [current.shot.id]
		});
		return segments.filter((seg) => {
			const start = seg.atMs;
			const end = start + (seg.durationMs ?? Math.max(1200, currentDuration - start));
			return player.elapsedInShotMs >= start && player.elapsedInShotMs < end;
		});
	});

	let raf = 0;
	let lastTs = 0;
	let rootEl: HTMLElement | undefined = $state();

	function tick(ts: number) {
		if (getPlayerState().status !== 'playing') {
			lastTs = 0;
			return;
		}
		if (!lastTs) lastTs = ts;
		const delta = ts - lastTs;
		lastTs = ts;

		const state = getPlayerState();
		const overlay = loadAnimaticEdits(script.script.id, script.script.version);
		const durs = shots.map((s) => durationFromEdits(overlay, s.shot.id, s.shot.durationMs));
		let idx = state.shotIndex;
		let elapsed = state.elapsedInShotMs + delta;
		let curDur = durs[idx] ?? 0;

		while (elapsed >= curDur && idx < shots.length - 1) {
			elapsed -= curDur;
			idx += 1;
			curDur = durs[idx] ?? 0;
		}

		if (idx >= shots.length - 1 && elapsed >= curDur) {
			setShotIndex(shots.length - 1);
			setElapsedInShotMs(curDur);
			setStatus('idle');
			lastTs = 0;
			return;
		}

		if (idx !== state.shotIndex) setShotIndex(idx);
		setElapsedInShotMs(elapsed);
		raf = requestAnimationFrame(tick);
	}

	function startLoop() {
		cancelAnimationFrame(raf);
		lastTs = 0;
		raf = requestAnimationFrame(tick);
	}

	function onPlayPause() {
		if (getPlayerState().status === 'playing') {
			pause();
			cancelAnimationFrame(raf);
		} else {
			play();
			startLoop();
		}
	}

	function onStop() {
		stop();
		cancelAnimationFrame(raf);
		lastTs = 0;
	}

	function goPrev() {
		const state = getPlayerState();
		if (state.elapsedInShotMs > 400) {
			setElapsedInShotMs(0);
			return;
		}
		setShotIndex(Math.max(0, state.shotIndex - 1));
	}

	function goNext() {
		const state = getPlayerState();
		setShotIndex(Math.min(shots.length - 1, state.shotIndex + 1));
	}

	function onScrub(e: Event) {
		const value = Number((e.currentTarget as HTMLInputElement).value);
		const overlay = loadAnimaticEdits(script.script.id, script.script.version);
		const durs = shots.map((s) => durationFromEdits(overlay, s.shot.id, s.shot.durationMs));
		let remaining = value;
		let idx = 0;
		while (idx < durs.length - 1 && remaining >= durs[idx]!) {
			remaining -= durs[idx]!;
			idx += 1;
		}
		setShotIndex(idx);
		setElapsedInShotMs(remaining);
	}

	async function toggleFullscreen() {
		if (!rootEl) return;
		if (!document.fullscreenElement) {
			await rootEl.requestFullscreen().catch(() => undefined);
		} else {
			await document.exitFullscreen().catch(() => undefined);
		}
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === ' ' || e.code === 'Space') {
			e.preventDefault();
			onPlayPause();
		} else if (e.key === 'ArrowLeft') {
			goPrev();
		} else if (e.key === 'ArrowRight') {
			goNext();
		} else if (e.key === 'Escape' && !document.fullscreenElement) {
			// leave navigation to browser / return link
		} else if (e.key === 'f' || e.key === 'F') {
			toggleFullscreen();
		} else if (e.key === 'd' || e.key === 'D') {
			toggleDetails();
		}
	}

	onDestroy(() => cancelAnimationFrame(raf));
</script>

<svelte:window onkeydown={onKey} />

<div class="player" bind:this={rootEl}>
	<div class="topbar">
		<a
			class="back"
			href={`${returnHref}${current ? `?shot=${encodeURIComponent(current.shot.id)}` : ''}`}
		>
			← Editor
		</a>
		<div class="counter">
			{player.shotIndex + 1} / {shots.length}
		</div>
		<div class="clock">{formatClock(absoluteMs)} / {formatClock(totalMs)}</div>
		<LanguageControls />
	</div>

	<div class="stage">
		{#if current?.imageSrc}
			<img src={current.imageSrc} alt={`Toma ${current.shot.number}`} />
		{:else}
			<div class="missing">Sin imagen</div>
		{/if}
		{#if activeSubtitles.length}
			<div class="subs" aria-live="polite">
				{#each activeSubtitles as sub (sub.cueId)}
					<p>{sub.text}</p>
				{/each}
			</div>
		{/if}
	</div>

	<div class="controls">
		<input
			class="scrubber"
			type="range"
			min="0"
			max={totalMs}
			step="50"
			value={absoluteMs}
			oninput={onScrub}
			aria-label="Posición en el animatic"
		/>
		<div class="buttons">
			<Button onclick={goPrev}>Anterior</Button>
			<Button variant="primary" onclick={onPlayPause}>
				{player.status === 'playing' ? 'Pausa' : 'Reproducir'}
			</Button>
			<Button onclick={onStop}>Stop</Button>
			<Button onclick={goNext}>Siguiente</Button>
			<Button onclick={toggleFullscreen}>Pantalla completa</Button>
			<Button onclick={() => setDetailsOpen(!player.detailsOpen)}>
				{player.detailsOpen ? 'Ocultar detalles' : 'Detalles'}
			</Button>
		</div>
	</div>

	{#if player.detailsOpen && current}
		<aside class="drawer">
			<h2>Toma {current.shot.number}</h2>
			<p>{current.shot.description}</p>
			<p class="meta">
				{current.shot.composition.size}
				{#if current.shot.camera?.movement}
					· {current.shot.camera.movement}
				{/if}
				· {formatClock(currentDuration)}
			</p>
			{#each current.cues as cue (cue.id)}
				<CueRenderer {cue} />
			{/each}
		</aside>
	{/if}
</div>

<style>
	.player {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #02070c;
		color: var(--ink);
	}

	.topbar {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		padding: 0.85rem 1.1rem;
		border-bottom: 1px solid var(--line);
		background: #08121ddd;
	}

	.back {
		color: var(--cyan);
		text-decoration: none;
		font-weight: 700;
	}

	.counter,
	.clock {
		font-family: var(--font-mono);
		color: var(--muted);
	}

	.stage {
		position: relative;
		flex: 1;
		display: grid;
		place-items: center;
		background: #000;
		min-height: 50vh;
	}

	.stage img {
		max-height: min(70vh, 100%);
		width: auto;
		max-width: 100%;
		object-fit: contain;
	}

	.missing {
		color: var(--muted);
		padding: 3rem;
	}

	.subs {
		position: absolute;
		left: 50%;
		bottom: 8%;
		transform: translateX(-50%);
		width: min(720px, 90%);
		text-align: center;
		text-shadow: 0 2px 8px #000;
	}

	.subs p {
		margin: 0.25rem 0;
		padding: 0.35rem 0.75rem;
		background: #000a;
		border-radius: 6px;
		font-size: clamp(1rem, 2.4vw, 1.35rem);
	}

	.controls {
		padding: 0.85rem 1.1rem 1.25rem;
		border-top: 1px solid var(--line);
		background: #08121ddd;
	}

	.scrubber {
		width: 100%;
		margin-bottom: 0.85rem;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.drawer {
		border-top: 1px solid var(--line);
		padding: 1rem 1.25rem 1.5rem;
		max-height: 40vh;
		overflow: auto;
		background: var(--panel);
	}

	.drawer h2 {
		margin: 0 0 0.5rem;
		font: 700 1.2rem var(--font-serif);
	}

	.drawer p {
		margin: 0 0 0.75rem;
	}

	.meta {
		color: var(--gold);
		font-size: 0.88rem;
	}
</style>
