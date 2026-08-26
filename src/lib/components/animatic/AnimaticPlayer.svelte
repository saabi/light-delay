<script lang="ts">
	import LanguageControls from '$lib/components/controls/LanguageControls.svelte';
	import AnimaticFrame from './AnimaticFrame.svelte';
	import ShotDetailsPanel from './ShotDetailsPanel.svelte';
	import {
		getPlayerState,
		pause,
		play,
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
	import { withBase } from '$lib/utils/paths';
	import type { Cue, ScriptFile, Shot } from '$lib/types/script';
	import type { ShotMedia } from '$lib/data/repositories/lookups';
	import { onDestroy, onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';

	type ShotView = {
		shot: Shot;
		media: ShotMedia;
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
		return `${m.script_scene().toUpperCase()} ${sceneN} · ${m.animatic_take().toUpperCase()} ${tomaN} · ${code}`;
	});

	const sceneTitle = $derived(currentScene?.title ?? currentScene?.summary ?? '');

	const currentAbsoluteInMs = $derived(
		durations.slice(0, player.shotIndex).reduce((sum, duration) => sum + duration, 0)
	);

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

	function onKey(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		const interactive = target?.matches('input, select, textarea, button, a');
		if (interactive && (e.key === ' ' || e.code === 'Space' || e.key.startsWith('Arrow'))) return;
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
		}
	}

	$effect(() => {
		if (typeof Image === 'undefined') return;
		const next = shots[player.shotIndex + 1];
		if (next?.media.displayPath) {
			const pre = new Image();
			pre.src = withBase(next.media.displayPath);
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

<div class="player" bind:this={rootEl} aria-label={m.animatic_player()}>
	<div class="movie-layout">
		<div class="movie-frame">
			{#if current}
				<AnimaticFrame
					media={current.media}
					shotId={current.shot.id}
					alt={`${m.animatic_take()} ${current.shot.number}`}
				/>
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
		</div>

		<div class="movie-details" class:open={player.detailsOpen}>
			<button
				type="button"
				class="details-toggle"
				aria-expanded={player.detailsOpen}
				aria-controls="shot-details-body"
				onclick={toggleDetails}
			>
				<span aria-hidden="true">{player.detailsOpen ? '▾' : '▸'}</span>
				{m.animatic_details()}
			</button>
			{#if player.detailsOpen}
				<div class="movie-detail-body" id="shot-details-body">
					{#if current}
						<ShotDetailsPanel
							{script}
							shot={current.shot}
							cues={current.cues}
							media={current.media}
							effectiveDurationMs={currentDuration}
							absoluteInMs={currentAbsoluteInMs}
							shotIndex={player.shotIndex}
							totalShots={shots.length}
						/>
					{:else}
						<LanguageControls />
					{/if}
				</div>
			{/if}
		</div>

		<div class="movie-controls">
			<button type="button" class="btn previous" onclick={goPrev} aria-label={m.animatic_previous()}
				>◀</button
			>
			<button
				type="button"
				class="btn primary play"
				onclick={onPlayPause}
				aria-label={m.animatic_play_pause()}
			>
				{player.status === 'playing' ? '❚❚' : '▶'}
			</button>
			<button type="button" class="btn stop" onclick={onStop} aria-label={m.animatic_stop()}
				>■</button
			>
			<button type="button" class="btn next" onclick={goNext} aria-label={m.animatic_next()}
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
				aria-label={m.animatic_progress()}
			/>
			<span class="movie-time">{formatClock(absoluteMs)} / {formatClock(totalMs)}</span>
			<button
				type="button"
				class="btn fullscreen"
				onclick={toggleFullscreen}
				aria-label={m.action_fullscreen()}
			>
				{m.action_fullscreen()}
			</button>
			<a class="btn edit" href={editorHref}>{m.action_edit_timing()}</a>
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

	.movie-layout {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.movie-frame {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: #000;
	}

	.movie-frame > :global(.frame) {
		width: 100%;
		height: 100%;
		background: #000;
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
		overflow: hidden;
		border: 1px solid #ffffff2b;
		border-radius: 10px;
		background: #06101bed;
		backdrop-filter: blur(14px);
	}

	.details-toggle {
		display: flex;
		width: 100%;
		gap: 0.45rem;
		align-items: center;
		cursor: pointer;
		padding: 12px 14px;
		color: var(--gold);
		font-weight: 850;
		font-family: inherit;
		text-align: left;
		border: 0;
		background: transparent;
	}

	.details-toggle:hover,
	.details-toggle:focus-visible {
		background: #ffffff0c;
		outline: 2px solid var(--cyan);
		outline-offset: -2px;
	}

	.movie-detail-body {
		padding: 0 14px 14px;
		max-height: calc(100vh - 270px);
		overflow: auto;
		overscroll-behavior: contain;
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
		grid-template-columns: auto auto auto auto minmax(80px, 1fr) auto auto auto;
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

	@media (max-width: 900px) and (orientation: landscape) {
		.movie-controls {
			left: 8px;
			right: 8px;
			bottom: 8px;
			grid-template-columns: repeat(4, auto) minmax(80px, 1fr) auto auto auto;
			gap: 6px;
			padding: 8px;
			font-size: 0.76rem;
		}

		.movie-subs {
			bottom: 116px;
		}
	}

	@media (orientation: portrait) {
		.player {
			overflow: hidden;
		}

		.movie-layout {
			position: absolute;
			inset: 0;
			display: grid;
			grid-template-rows: auto minmax(0, 1fr) auto;
			background: #02070c;
			overflow: hidden;
		}

		.movie-frame {
			position: relative;
			inset: auto;
			width: 100%;
			aspect-ratio: 16 / 9;
			max-height: 42dvh;
			min-height: 0;
		}

		.movie-details {
			position: relative;
			right: auto;
			top: auto;
			align-self: start;
			width: 100%;
			max-height: none;
			border-right: 0;
			border-left: 0;
			border-radius: 0;
			background: #06101b;
			backdrop-filter: none;
		}

		.movie-details.open {
			align-self: stretch;
			display: flex;
			min-height: 0;
			flex-direction: column;
		}

		.movie-detail-body {
			flex: 1;
			min-height: 0;
			max-height: none;
			padding-bottom: 1rem;
		}

		.movie-controls {
			position: relative;
			left: auto;
			right: auto;
			bottom: auto;
			z-index: 3;
			padding: 9px max(9px, env(safe-area-inset-right)) max(9px, env(safe-area-inset-bottom))
				max(9px, env(safe-area-inset-left));
			border-right: 0;
			border-left: 0;
			border-bottom: 0;
			border-radius: 0;
			background: #06101b;
			backdrop-filter: none;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			grid-template-areas:
				'previous play stop next'
				'range range range range'
				'time time fullscreen edit';
			gap: 7px;
		}

		.previous {
			grid-area: previous;
		}

		.play {
			grid-area: play;
		}

		.stop {
			grid-area: stop;
		}

		.next {
			grid-area: next;
		}

		.movie-range {
			grid-area: range;
		}

		.movie-time {
			grid-area: time;
			align-self: center;
		}

		.fullscreen {
			grid-area: fullscreen;
		}

		.edit {
			grid-area: edit;
		}

		.movie-controls .btn {
			min-width: 0;
			padding: 8px 7px;
			font-size: clamp(0.68rem, 2.5vw, 0.8rem);
		}

		.movie-top {
			left: 12px;
			right: 12px;
			top: 10px;
		}

		.movie-scene {
			max-width: 70vw;
			font-size: 0.78rem;
			line-height: 1.3;
		}

		.movie-subs {
			left: 4%;
			right: 4%;
			bottom: 10px;
		}

		.movie-subs .subtitle {
			padding: 5px 9px;
			font-size: clamp(0.78rem, 3.5vw, 1.05rem);
		}
	}
</style>
