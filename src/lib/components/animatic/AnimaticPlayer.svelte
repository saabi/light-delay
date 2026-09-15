<script lang="ts">
	import LanguageControls from '$lib/components/controls/LanguageControls.svelte';
	import AnimaticMediaStage from './AnimaticMediaStage.svelte';
	import ShotDetailsPanel from './ShotDetailsPanel.svelte';
	import DurationPair from '$lib/components/timing/DurationPair.svelte';
	import { WebAudioCueSequencer } from '$lib/audio/webAudioCueSequencer';
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
	import { buildShotDialogueTimeline } from '$lib/data/selectors/animaticDialogueTimeline';
	import {
		buildAnimaticPlaybackSpans,
		filterDialogueCuesOutsideStretchVideo,
		isStretchVideoSpan,
		shotDurationsAlignedToSpans,
		spanDurationsMs,
		spanIndexForShotIndex,
		type AnimaticPlaybackSpan
	} from '$lib/data/selectors/animaticPlaybackSpans';
	import {
		analyzeShotDialogue,
		estimateScriptSpokenMs,
		montageScriptMs
	} from '$lib/data/selectors/dialogueTiming';
	import { getGenerationPlan } from '$lib/data/repositories/generationPlans';
	import { formatClock } from '$lib/utils/duration';
	import { withBase, withLocale } from '$lib/utils/paths';
	import type { Cue, ScriptFile, Shot } from '$lib/types/script';
	import type { ShotMedia } from '$lib/data/repositories/lookups';
	import { onDestroy, onMount, untrack } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { storyText } from '$lib/data/selectors/localized';

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
	/** Fine-grained: subtitle-only changes must not rebuild the audio timeline. */
	const dialogueLanguage = $derived(lang.dialogueLanguage);
	const subtitleLanguage = $derived(lang.subtitleLanguage);
	const edits = $derived(loadAnimaticEdits(script.script.id, script.script.version));
	const generationPlan = $derived(getGenerationPlan(script.script.id));

	const stillDurations = $derived(
		shots.map((s) => durationFromEdits(edits, s.shot.id, s.shot.durationMs))
	);

	const spans = $derived(
		buildAnimaticPlaybackSpans(
			script,
			shots.map((s) => s.shot),
			generationPlan,
			{
				shotDurationMs: (shot) => durationFromEdits(edits, shot.id, shot.durationMs)
			}
		)
	);

	const spanDurs = $derived(spanDurationsMs(spans));
	const totalMs = $derived(spanDurs.reduce((a, b) => a + b, 0));
	const scriptMontageMs = $derived(montageScriptMs(script, edits));
	const scriptSpokenMs = $derived(estimateScriptSpokenMs(script, dialogueLanguage));

	const orderedShotIds = $derived(shots.map((s) => s.shot.id));

	const currentSpanIndex = $derived(
		Math.max(0, spanIndexForShotIndex(spans, orderedShotIds, player.shotIndex))
	);
	const currentSpan = $derived(spans[currentSpanIndex] as AnimaticPlaybackSpan | undefined);
	const nextSpan = $derived(spans[currentSpanIndex + 1] ?? null);

	const absoluteMs = $derived(
		spanDurs.slice(0, currentSpanIndex).reduce((a, b) => a + b, 0) + player.elapsedInShotMs
	);

	const alignedShotDurations = $derived(
		shotDurationsAlignedToSpans(shots.map((s) => s.shot), spans, (shot, i) =>
			durationFromEdits(edits, shot.id, stillDurations[i] ?? shot.durationMs)
		)
	);

	const rawDialogueTimeline = $derived(
		buildShotDialogueTimeline(script, alignedShotDurations, dialogueLanguage, 'es')
	);
	const dialogueTimeline = $derived(
		filterDialogueCuesOutsideStretchVideo(rawDialogueTimeline, spans)
	);

	const timelineFingerprint = $derived(
		`${dialogueLanguage}:${dialogueTimeline.length}:${dialogueTimeline
			.map((cue) => `${cue.id}|${cue.url}|${cue.startMs}`)
			.join(';')}`
	);

	const primaryShotIndex = $derived(
		currentSpan?.kind === 'still'
			? currentSpan.shotIndex
			: currentSpan?.kind === 'stretchVideo'
				? currentSpan.primaryShotIndex
				: player.shotIndex
	);
	const current = $derived(shots[primaryShotIndex]);
	const currentDuration = $derived(spanDurs[currentSpanIndex] ?? 0);
	const currentShotAnalysis = $derived(
		current ? analyzeShotDialogue(script, current.shot, dialogueLanguage) : undefined
	);

	const currentScene = $derived(
		current ? script.scenes.find((s) => s.id === current.shot.sceneId) : undefined
	);

	const shotLabel = $derived.by(() => {
		if (!current) return '';
		const sceneN = String(currentScene?.number ?? 0).padStart(2, '0');
		const tomaN = String(current.shot.number).padStart(2, '0');
		const code = framingCode(current.shot);
		if (isStretchVideoSpan(currentSpan)) {
			const last = currentSpan.shotIds[currentSpan.shotIds.length - 1];
			const lastShot = shots.find((s) => s.shot.id === last)?.shot;
			const lastN = String(lastShot?.number ?? tomaN).padStart(2, '0');
			return `${m.script_scene().toUpperCase()} ${sceneN} · ${m.animatic_take().toUpperCase()} ${tomaN}–${lastN} · ${code}`;
		}
		return `${m.script_scene().toUpperCase()} ${sceneN} · ${m.animatic_take().toUpperCase()} ${tomaN} · ${code}`;
	});

	const sceneTitle = $derived(currentScene?.title ?? currentScene?.summary ?? '');

	const currentAbsoluteInMs = $derived(
		spanDurs.slice(0, currentSpanIndex).reduce((sum, duration) => sum + duration, 0)
	);

	const editorHref = $derived(
		`${withLocale(returnHref)}${current ? `?shot=${encodeURIComponent(current.shot.id)}` : ''}`
	);

	const activeSubtitles = $derived.by(() => {
		if (!current || subtitleLanguage === null || !currentSpan) return [];
		const shotIds =
			currentSpan.kind === 'stretchVideo' ? currentSpan.shotIds : [current.shot.id];
		const segments = getSubtitleSegments(script, {
			dialogueLanguage,
			subtitleLanguage,
			projectFallback: 'es',
			shotIds: [...shotIds]
		});
		if (currentSpan.kind === 'still') {
			return segments.filter((seg) => {
				const start = seg.atMs;
				const end = start + (seg.durationMs ?? Math.max(1200, currentDuration - start));
				return player.elapsedInShotMs >= start && player.elapsedInShotMs < end;
			});
		}
		// Map member-relative cues into span time via aligned durations.
		const members = currentSpan.shotIds;
		const origins = new Map<string, number>();
		let origin = 0;
		for (const id of members) {
			origins.set(id, origin);
			const idx = shots.findIndex((s) => s.shot.id === id);
			origin += alignedShotDurations[idx] ?? 0;
		}
		const stillById = new Map(shots.map((s) => [s.shot.id, s.shot.durationMs]));
		return segments.filter((seg) => {
			const memberOrigin = origins.get(seg.shotId) ?? 0;
			const stillDur = Math.max(1, stillById.get(seg.shotId) ?? 1);
			const alignedIdx = shots.findIndex((s) => s.shot.id === seg.shotId);
			const alignedDur = Math.max(1, alignedShotDurations[alignedIdx] ?? stillDur);
			const start = memberOrigin + (seg.atMs * alignedDur) / stillDur;
			const rawEnd = start + ((seg.durationMs ?? 1200) * alignedDur) / stillDur;
			return player.elapsedInShotMs >= start && player.elapsedInShotMs < rawEnd;
		});
	});

	const sequencer = new WebAudioCueSequencer();
	let scheduledFingerprint = '';
	let lastRescheduleKey = '';
	let raf = 0;
	let lastTs = 0;
	let rootEl: HTMLElement | undefined = $state();
	let audioMuted = $state(false);

	function framingCode(shot: Shot): string {
		const framing = storyText(shot.composition?.framing);
		if (framing) return framing;
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

	function primaryShotIndexForSpan(span: AnimaticPlaybackSpan): number {
		return span.kind === 'still' ? span.shotIndex : span.primaryShotIndex;
	}

	function seekToSpan(spanIndex: number, elapsedInSpanMs = 0) {
		const span = spans[spanIndex];
		if (!span) return;
		setShotIndex(primaryShotIndexForSpan(span));
		setElapsedInShotMs(Math.max(0, Math.min(elapsedInSpanMs, span.durationMs)));
	}

	function computeAbsoluteMs(spanIndex: number, elapsedInSpanMs: number): number {
		return spanDurs.slice(0, spanIndex).reduce((a, b) => a + b, 0) + elapsedInSpanMs;
	}

	function visualAbsoluteMs(): number {
		return computeAbsoluteMs(currentSpanIndex, getPlayerState().elapsedInShotMs);
	}

	function startAudioFromVisualClock() {
		if (isStretchVideoSpan(currentSpan)) {
			sequencer.stop();
			scheduledFingerprint = timelineFingerprint;
			lastRescheduleKey = timelineFingerprint;
			return;
		}
		void sequencer.play(dialogueTimeline, visualAbsoluteMs());
		scheduledFingerprint = timelineFingerprint;
		lastRescheduleKey = timelineFingerprint;
	}

	function syncSequencerSeek(nextAbsoluteMs: number) {
		if (isStretchVideoSpan(currentSpan)) {
			sequencer.stop();
			return;
		}
		if (sequencer.status === 'playing' || sequencer.status === 'paused') {
			sequencer.seek(nextAbsoluteMs);
		}
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
		const durs = untrack(() => spanDurs);
		const spanList = untrack(() => spans);
		let idx = untrack(() => currentSpanIndex);
		let elapsed = state.elapsedInShotMs + delta;
		let curDur = durs[idx] ?? 0;

		while (elapsed >= curDur && idx < spanList.length - 1) {
			elapsed -= curDur;
			idx += 1;
			curDur = durs[idx] ?? 0;
		}

		if (idx >= spanList.length - 1 && elapsed >= curDur) {
			seekToSpan(spanList.length - 1, curDur);
			setStatus('idle');
			lastTs = 0;
			sequencer.stop();
			scheduledFingerprint = '';
			lastRescheduleKey = '';
			return;
		}

		const target = spanList[idx];
		if (target) {
			const primary = primaryShotIndexForSpan(target);
			if (primary !== state.shotIndex) setShotIndex(primary);
		}
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
			sequencer.pause();
		} else {
			const canResume =
				!isStretchVideoSpan(currentSpan) &&
				sequencer.status === 'paused' &&
				scheduledFingerprint === timelineFingerprint;
			play();
			startLoop();
			if (canResume) {
				void sequencer.resume();
			} else {
				startAudioFromVisualClock();
			}
		}
	}

	function onStop() {
		stop();
		cancelAnimationFrame(raf);
		lastTs = 0;
		sequencer.stop();
		scheduledFingerprint = '';
		lastRescheduleKey = '';
	}

	function goPrev() {
		const state = getPlayerState();
		if (state.elapsedInShotMs > 400) {
			seekToSpan(currentSpanIndex, 0);
			syncSequencerSeek(computeAbsoluteMs(currentSpanIndex, 0));
			return;
		}
		const idx = Math.max(0, currentSpanIndex - 1);
		seekToSpan(idx, 0);
		syncSequencerSeek(computeAbsoluteMs(idx, 0));
		if (!isStretchVideoSpan(spans[idx])) startAudioFromVisualClock();
		else sequencer.stop();
	}

	function goNext() {
		const idx = Math.min(spans.length - 1, currentSpanIndex + 1);
		seekToSpan(idx, 0);
		syncSequencerSeek(computeAbsoluteMs(idx, 0));
		if (!isStretchVideoSpan(spans[idx])) startAudioFromVisualClock();
		else sequencer.stop();
	}

	function seekAbsoluteBy(deltaSec: number) {
		const next = Math.max(0, Math.min(totalMs - 1, absoluteMs + deltaSec * 1000));
		seekAbsolute(next);
	}

	function seekAbsolute(next: number) {
		const durs = spanDurs;
		let remaining = next;
		let idx = 0;
		while (idx < durs.length - 1 && remaining >= durs[idx]!) {
			remaining -= durs[idx]!;
			idx += 1;
		}
		seekToSpan(idx, remaining);
		const span = spans[idx];
		if (isStretchVideoSpan(span)) sequencer.stop();
		else syncSequencerSeek(next);
	}

	function onScrub(e: Event) {
		const value = Number((e.currentTarget as HTMLInputElement).value);
		seekAbsolute(value);
	}

	function toggleMute() {
		audioMuted = !audioMuted;
		sequencer.setMuted(audioMuted);
	}

	function onVideoTime(ms: number) {
		if (getPlayerState().status !== 'playing') return;
		if (!isStretchVideoSpan(currentSpan)) return;
		// Light sync from element when rAF and decode drift; keep within span.
		const clamped = Math.max(0, Math.min(ms, currentDuration));
		if (Math.abs(clamped - getPlayerState().elapsedInShotMs) > 250) {
			setElapsedInShotMs(clamped);
		}
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
		const next = nextSpan;
		if (next?.kind === 'still') {
			const shot = shots[next.shotIndex];
			if (shot?.media.displayPath) {
				const pre = new Image();
				pre.src = withBase(shot.media.displayPath);
			}
		}
	});

	// When the span changes while playing, stop Seedance-range WAVs or resume still dialogue.
	$effect(() => {
		const idx = currentSpanIndex;
		const stretch = isStretchVideoSpan(currentSpan);
		if (untrack(() => getPlayerState().status) !== 'playing') return;
		void idx;
		if (stretch) {
			sequencer.stop();
			scheduledFingerprint = timelineFingerprint;
			lastRescheduleKey = timelineFingerprint;
			return;
		}
		lastRescheduleKey = '';
		startAudioFromVisualClock();
	});

	// Reschedule dialogue only when the audio timeline fingerprint changes.
	// Do not depend on subtitleLanguage or absoluteMs (rAF updates every frame).
	$effect(() => {
		const key = timelineFingerprint;
		const stretch = isStretchVideoSpan(currentSpan);

		if (untrack(() => getPlayerState().status) !== 'playing') return;
		if (stretch) {
			sequencer.stop();
			lastRescheduleKey = key;
			scheduledFingerprint = key;
			return;
		}
		if (key === lastRescheduleKey) return;

		const cues = untrack(() => dialogueTimeline);
		scheduledFingerprint = key;
		lastRescheduleKey = key;
		void (async () => {
			await sequencer.play(cues, untrack(() => visualAbsoluteMs()));
			if (untrack(() => getPlayerState().status) === 'playing' && sequencer.status === 'playing') {
				sequencer.seek(untrack(() => visualAbsoluteMs()));
			}
		})();
	});

	onMount(() => {
		if (rootEl) {
			void rootEl.requestFullscreen().catch(() => undefined);
		}
		const spanIdx = spanIndexForShotIndex(spans, orderedShotIds, getPlayerState().shotIndex);
		if (spanIdx >= 0) seekToSpan(spanIdx, getPlayerState().elapsedInShotMs);
		play();
		startLoop();
		startAudioFromVisualClock();
	});

	onDestroy(() => {
		if (typeof cancelAnimationFrame !== 'undefined') {
			cancelAnimationFrame(raf);
		}
		sequencer.stop();
	});
</script>

<svelte:window onkeydown={onKey} />

<div class="player" bind:this={rootEl} aria-label={m.animatic_player()}>
	<div class="movie-layout">
		<div class="movie-frame">
			{#if current && currentSpan}
				<AnimaticMediaStage
					span={currentSpan}
					{nextSpan}
					media={current.media}
					shotId={current.shot.id}
					alt={`${m.animatic_take()} ${current.shot.number}`}
					playing={player.status === 'playing'}
					elapsedMs={player.elapsedInShotMs}
					muted={audioMuted}
					{onVideoTime}
				/>
			{/if}

			<div class="movie-vignette" aria-hidden="true"></div>

			<div class="movie-top">
				<div>
					<b>{shotLabel}</b>
					<div class="movie-scene">{sceneTitle}</div>
					{#if currentShotAnalysis}
						<div class="movie-timing">
							<DurationPair
								montageMs={currentDuration}
								spokenMs={currentShotAnalysis.spokenMs}
								compact
							/>
						</div>
					{/if}
				</div>
			</div>

			{#if activeSubtitles.length}
				<div class="movie-subs" aria-live="polite">
					{#each activeSubtitles as sub (sub.cueId)}
						<div class="subtitle">{sub.text}</div>
					{/each}
				</div>
			{/if}
		</div>

		<aside class="movie-sidebar" class:open={player.detailsOpen}>
			<div class="movie-meta-bar">
				<LanguageControls playerBar />
				<div class="movie-meta-stats">
					<span class="movie-meta-label">{m.animatic_shots()}</span>
					<div class="movie-meta-stats-body">
						<div class="movie-counter">{currentSpanIndex + 1} / {spans.length}</div>
						<DurationPair montageMs={scriptMontageMs} spokenMs={scriptSpokenMs} compact />
					</div>
				</div>
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
						{/if}
					</div>
				{/if}
			</div>
		</aside>

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
			<button
				type="button"
				class="btn mute"
				onclick={toggleMute}
				aria-label={audioMuted ? m.animatic_unmute() : m.animatic_mute()}
				aria-pressed={audioMuted}
			>
				{audioMuted ? '✕♪' : '♪'}
			</button>
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
		right: min(456px, calc(100vw - 12px));
		top: 20px;
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

	.movie-timing {
		margin-top: 0.35rem;
	}

	.movie-sidebar {
		position: absolute;
		right: 18px;
		top: 20px;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.65rem;
		width: min(420px, calc(100vw - 36px));
		max-height: calc(100vh - 120px);
		pointer-events: auto;
	}

	.movie-sidebar.open {
		min-height: 0;
	}

	.movie-meta-bar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.9fr);
		gap: 0.65rem;
		align-items: end;
		padding: 0.55rem 0.7rem;
		border: 1px solid #ffffff2b;
		border-radius: 10px;
		background: #06101bed;
		backdrop-filter: blur(14px);
		text-shadow: none;
		flex-shrink: 0;
		width: 100%;
	}

	.movie-meta-bar :global(.lang-controls.compact) {
		margin-bottom: 0;
	}

	.movie-meta-stats {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.movie-meta-label {
		font: 700 0.68rem/1.2 var(--font-mono);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.movie-meta-stats-body {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.15rem;
		min-width: 0;
	}

	.movie-counter {
		font:
			800 0.82rem var(--font-mono),
			ui-monospace,
			monospace;
		white-space: nowrap;
	}

	.movie-meta-stats-body :global(.duration-pair.compact) {
		font-size: 0.72rem;
		justify-content: flex-end;
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
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
		border: 1px solid #ffffff2b;
		border-radius: 10px;
		background: #06101bed;
		backdrop-filter: blur(14px);
		flex-shrink: 0;
	}

	.movie-details.open {
		flex: 1;
		min-height: 0;
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
		flex: 1;
		min-height: 0;
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
		grid-template-columns: auto auto auto auto auto minmax(80px, 1fr) auto auto auto;
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
			grid-template-columns: repeat(5, auto) minmax(80px, 1fr) auto auto auto;
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

		.movie-sidebar {
			position: relative;
			right: auto;
			top: auto;
			width: 100%;
			max-height: none;
			gap: 0;
			background: #06101b;
		}

		.movie-sidebar.open {
			align-self: stretch;
			display: flex;
			flex: 1;
			min-height: 0;
			flex-direction: column;
		}

		.movie-meta-bar {
			border-radius: 0;
			border-right: 0;
			border-left: 0;
			background: #06101b;
			backdrop-filter: none;
		}

		.movie-details {
			width: 100%;
			border-right: 0;
			border-left: 0;
			border-radius: 0;
			background: #06101b;
			backdrop-filter: none;
		}

		.movie-details.open {
			flex: 1;
			min-height: 0;
			display: flex;
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
			grid-template-columns: repeat(5, minmax(0, 1fr));
			grid-template-areas:
				'previous play stop next mute'
				'range range range range range'
				'time time fullscreen edit edit';
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

		.mute {
			grid-area: mute;
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
