<script lang="ts">
	import LanguageControls from '$lib/components/controls/LanguageControls.svelte';
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
	import { onDestroy, onMount } from 'svelte';

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

	const currentScene = $derived(
		current ? script.scenes.find((s) => s.id === current.shot.sceneId) : undefined
	);

	const shotLabel = $derived.by(() => {
		if (!current) return '';
		const sceneN = String(currentScene?.number ?? 0).padStart(2, '0');
		const tomaN = String(current.shot.number).padStart(2, '0');
		const code = framingCode(current.shot);
		return `ESCENA ${sceneN} · TOMA ${tomaN} · ${code}`;
	});

	const sceneTitle = $derived(currentScene?.title ?? currentScene?.summary ?? '');

	const cameraText = $derived(
		current?.shot.camera?.movementDescription ?? current?.shot.camera?.movement ?? '—'
	);

	const audioText = $derived.by(() => {
		const notes = (current?.shot.notes ?? [])
			.filter((n) => n.type === 'sound')
			.map((n) => n.text)
			.filter(Boolean);
		return notes.length ? notes.join(' ') : '—';
	});

	const durationSecondsLabel = $derived(`${Math.round(currentDuration / 1000)} s`);

	const editorHref = $derived(
		`${returnHref}${current ? `?shot=${encodeURIComponent(current.shot.id)}` : ''}`
	);

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
	let detailsEl: HTMLDetailsElement | undefined = $state();

	function framingCode(shot: Shot): string {
		if (shot.composition?.framing) return shot.composition.framing;
		const size = shot.composition?.size;
		const map: Record<string, string> = {
			WS: 'PG',
			MS: 'PM',
			CU: 'PP',
			ECU: 'PPP',
			INSERT: 'PD',
			OTS: 'OTS',
			OTHER: '—'
		};
		return (size && map[size]) || size || '—';
	}

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

	function seekAbsoluteBy(deltaSec: number) {
		const next = Math.max(0, Math.min(totalMs - 1, absoluteMs + deltaSec * 1000));
		const overlay = loadAnimaticEdits(script.script.id, script.script.version);
		const durs = shots.map((s) => durationFromEdits(overlay, s.shot.id, s.shot.durationMs));
		let remaining = next;
		let idx = 0;
		while (idx < durs.length - 1 && remaining >= durs[idx]!) {
			remaining -= durs[idx]!;
			idx += 1;
		}
		setShotIndex(idx);
		setElapsedInShotMs(remaining);
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

	function onDetailsToggle(e: Event) {
		const el = e.currentTarget as HTMLDetailsElement;
		setDetailsOpen(el.open);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === ' ' || e.code === 'Space') {
			e.preventDefault();
			onPlayPause();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			seekAbsoluteBy(-5);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			seekAbsoluteBy(5);
		} else if (e.key === 'f' || e.key === 'F') {
			toggleFullscreen();
		} else if (e.key === 'd' || e.key === 'D') {
			toggleDetails();
			if (detailsEl) detailsEl.open = getPlayerState().detailsOpen;
		}
	}

	$effect(() => {
		if (typeof Image === 'undefined') return;
		const next = shots[player.shotIndex + 1];
		if (next?.imageSrc) {
			const pre = new Image();
			pre.src = next.imageSrc;
		}
	});

	onMount(() => {
		if (rootEl) {
			void rootEl.requestFullscreen().catch(() => undefined);
		}
		play();
		startLoop();
	});

	onDestroy(() => {
		if (typeof cancelAnimationFrame !== 'undefined') {
			cancelAnimationFrame(raf);
		}
	});
</script>

<svelte:window onkeydown={onKey} />

<div class="player" bind:this={rootEl} aria-label="Reproductor del animatic">
	<div class="movie-stage">
		{#if current?.imageSrc}
			<img src={current.imageSrc} alt={`Toma ${current.shot.number}`} />
		{:else}
			<div class="missing">Sin imagen</div>
		{/if}

		<div class="movie-vignette" aria-hidden="true"></div>

		<div class="movie-top">
			<div>
				<b>{shotLabel}</b>
				<div class="movie-scene">{sceneTitle}</div>
			</div>
			<div class="movie-counter">{player.shotIndex + 1} / {shots.length}</div>
		</div>

		{#if activeSubtitles.length}
			<div class="movie-subs" aria-live="polite">
				{#each activeSubtitles as sub (sub.cueId)}
					<div class="subtitle">{sub.text}</div>
				{/each}
			</div>
		{/if}

		<details
			class="movie-details"
			bind:this={detailsEl}
			open={player.detailsOpen}
			ontoggle={onDetailsToggle}
		>
			<summary>Detalles de la toma</summary>
			<div class="movie-detail-body">
				{#if current}
					<p>
						<b>Contenido</b><br />
						{current.shot.description}
					</p>
					<p>
						<b>Cámara y encuadre</b><br />
						{cameraText}
					</p>
					<p>
						<b>Audio y ritmo</b><br />
						{audioText}
					</p>
					<p>
						<b>Duración actual</b><br />
						{durationSecondsLabel}
					</p>
				{/if}
				<div class="lang-slot">
					<LanguageControls />
				</div>
			</div>
		</details>

		<div class="movie-controls">
			<button type="button" class="btn secondary" onclick={goPrev} aria-label="Toma anterior"
				>◀</button
			>
			<button
				type="button"
				class="btn primary"
				onclick={onPlayPause}
				aria-label="Reproducir o pausar"
			>
				{player.status === 'playing' ? '❚❚' : '▶'}
			</button>
			<button type="button" class="btn" onclick={onStop} aria-label="Detener">■</button>
			<button type="button" class="btn secondary" onclick={goNext} aria-label="Toma siguiente"
				>▶|</button
			>
			<input
				class="movie-range"
				type="range"
				min="0"
				max={Math.max(totalMs, 1)}
				step="50"
				value={absoluteMs}
				oninput={onScrub}
				aria-label="Progreso de la película"
			/>
			<span class="movie-time">{formatClock(absoluteMs)} / {formatClock(totalMs)}</span>
			<button type="button" class="btn" onclick={toggleFullscreen} aria-label="Pantalla completa">
				Pantalla completa
			</button>
			<a class="btn" href={editorHref}>Editar tiempos</a>
		</div>
	</div>
</div>

<style>
	.player {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: #000;
		color: #fff;
	}

	.movie-stage {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		overflow: hidden;
	}

	.movie-stage > img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: #000;
	}

	.missing {
		color: var(--muted);
		padding: 3rem;
	}

	.movie-vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(180deg, #0007 0, transparent 16%, transparent 66%, #000d 100%);
	}

	.movie-top {
		position: absolute;
		left: 24px;
		right: 24px;
		top: 20px;
		display: flex;
		justify-content: space-between;
		gap: 20px;
		text-shadow: 0 2px 8px #000;
		pointer-events: none;
	}

	.movie-top b {
		font:
			800 0.82rem var(--font-mono),
			ui-monospace,
			monospace;
		color: var(--cyan);
	}

	.movie-scene {
		margin-top: 0.2rem;
		font-size: 0.92rem;
		color: #eef4f8;
	}

	.movie-counter {
		font:
			800 0.9rem var(--font-mono),
			ui-monospace,
			monospace;
		white-space: nowrap;
	}

	.movie-subs {
		position: absolute;
		left: 12%;
		right: 12%;
		bottom: 128px;
		display: grid;
		gap: 7px;
		pointer-events: none;
		justify-items: center;
	}

	.movie-subs .subtitle {
		max-width: 100%;
		padding: 7px 14px;
		background: #000c;
		color: #fff;
		border-radius: 4px;
		text-align: center;
		font-size: clamp(1rem, 2vw, 1.55rem);
		text-shadow: 0 1px 2px #000;
	}

	.movie-details {
		position: absolute;
		right: 18px;
		top: 58px;
		width: min(420px, calc(100vw - 36px));
		max-height: calc(100vh - 210px);
		overflow: auto;
		border: 1px solid #ffffff2b;
		border-radius: 10px;
		background: #06101bed;
		backdrop-filter: blur(14px);
	}

	.movie-details summary {
		cursor: pointer;
		padding: 12px 14px;
		color: var(--gold);
		font-weight: 850;
		list-style: none;
	}

	.movie-details summary::-webkit-details-marker {
		display: none;
	}

	.movie-details summary::before {
		content: '▾ ';
		display: inline-block;
		transition: transform 0.15s ease;
	}

	.movie-details:not([open]) summary::before {
		transform: rotate(-90deg);
	}

	.movie-detail-body {
		padding: 0 14px 14px;
		color: #c8d2db;
		font-size: 0.88rem;
	}

	.movie-detail-body p {
		margin: 8px 0;
	}

	.movie-detail-body b {
		color: #fff;
	}

	.lang-slot {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid #ffffff22;
	}

	.movie-controls {
		position: absolute;
		left: 18px;
		right: 18px;
		bottom: 16px;
		padding: 12px;
		border: 1px solid #ffffff2b;
		border-radius: 12px;
		background: #06101be8;
		backdrop-filter: blur(14px);
		display: grid;
		grid-template-columns: auto auto auto auto 1fr auto auto;
		gap: 9px;
		align-items: center;
	}

	.btn {
		border: 1px solid var(--line);
		border-radius: 8px;
		background: #132837;
		color: var(--ink);
		padding: 9px 12px;
		cursor: pointer;
		font: inherit;
		text-decoration: none;
		text-align: center;
		min-width: 46px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.btn:hover,
	.btn:focus-visible {
		border-color: var(--cyan);
		outline: none;
	}

	.btn.primary {
		background: var(--cyan);
		color: #03111a;
		border-color: var(--cyan);
		font-weight: 850;
	}

	.movie-range {
		width: 100%;
		accent-color: var(--cyan);
	}

	.movie-time {
		font:
			800 0.78rem var(--font-mono),
			ui-monospace,
			monospace;
		white-space: nowrap;
	}

	@media (max-width: 900px) {
		.movie-controls {
			grid-template-columns: auto auto auto 1fr auto;
		}

		.movie-controls .secondary {
			display: none;
		}

		.movie-subs {
			bottom: 116px;
		}
	}

	@media (max-width: 560px) {
		.movie-controls {
			left: 8px;
			right: 8px;
			bottom: 8px;
		}

		.movie-top {
			left: 12px;
			right: 12px;
		}

		.movie-subs {
			left: 5%;
			right: 5%;
			bottom: 104px;
		}

		.movie-details {
			right: 8px;
			top: 48px;
		}
	}
</style>
