<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import CueList from '$lib/components/studio/CueList.svelte';
	import LinePanel from '$lib/components/studio/LinePanel.svelte';
	import TransportBar from '$lib/components/studio/TransportBar.svelte';
	import TweakPanel from '$lib/components/studio/TweakPanel.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import {
		acceptTake,
		assembleOutput,
		assembledUrl,
		convertCue,
		fetchDefaults,
		fetchHealth,
		fetchOutputs,
		fetchTimeline,
		prepareModel,
		prepareQwenModel,
		purgeUnreferencedTakes,
		regenerateCue,
		restoreCue,
		takeAudioUrl,
		StudioApiError
	} from '$lib/studio/api';
	import { TakePreview } from '$lib/studio/preview';
	import { ChunkSequencer } from '$lib/studio/sequencer';
	import type {
		ConvertSettings,
		QwenRegenSettings,
		StudioCue,
		StudioDefaults,
		StudioEngineMode,
		StudioMachineState,
		StudioOutput,
		StudioTimeline
	} from '$lib/studio/types';

	const FALLBACK_QWEN: QwenRegenSettings = {
		temperature: 0.82,
		topP: 0.9,
		topK: 50,
		maxNewTokens: 3072,
		repetitionPenalty: 1.05,
		instruct: '',
		expressivenessPrefix: '',
		defaultInstruct: ''
	};

	let availableOutputs = $state<StudioOutput[]>([]);
	let outputId = $state('audience-es');
	let machine = $state<StudioMachineState>('loading');
	let timeline = $state.raw<StudioTimeline | null>(null);
	let defaults = $state.raw<StudioDefaults | null>(null);
	let engineMode = $state<StudioEngineMode>('seedvc');
	let settings = $state<ConvertSettings>({
		autoF0Adjust: true,
		semiToneShift: 0,
		diffusionSteps: 0,
		lengthAdjust: 1,
		inferenceCfgRate: 0
	});
	let qwenSettings = $state<QwenRegenSettings>({ ...FALLBACK_QWEN });
	let selectedId = $state<string | null>(null);
	let filter = $state<'all' | 'recordable' | 'replaced' | 'stale'>('all');
	let search = $state('');
	let notice = $state('');
	let lastConvertTakeId = $state<string | null>(null);
	let lastConvertCueId = $state<string | null>(null);
	let pendingBlob = $state.raw<Blob | null>(null);
	let pendingFilename = $state('take.webm');
	let pendingCueId = $state<string | null>(null);
	let assembledHref = $state<string | null>(null);
	let listeningTakeId = $state<string | null>(null);
	let purging = $state(false);

	const sequencer = new ChunkSequencer();
	const preview = new TakePreview();
	let recorder: MediaRecorder | null = null;
	let recordStream: MediaStream | null = null;
	let recordTimer: ReturnType<typeof setTimeout> | null = null;
	let hitDurationLimit = false;

	const selectedCue = $derived(
		timeline?.cues.find((cue) => cue.id === selectedId) ?? null
	);
	const selectedIndex = $derived(
		timeline ? timeline.cues.findIndex((cue) => cue.id === selectedId) : -1
	);
	const filteredCues = $derived.by(() => {
		const cues = timeline?.cues ?? [];
		const query = search.trim().toLowerCase();
		return cues.filter((cue) => {
			if (filter === 'recordable' && !cue.recordable) return false;
			if (filter === 'replaced' && cue.replacement?.status !== 'accepted') return false;
			if (filter === 'stale' && !cue.replacement?.stale && cue.replacement?.status !== 'stale') {
				return false;
			}
			if (
				query &&
				!cue.speaker.toLowerCase().includes(query) &&
				!cue.text.toLowerCase().includes(query)
			) {
				return false;
			}
			return true;
		});
	});
	const canRecord = $derived(
		Boolean(selectedCue?.recordable) &&
			machine !== 'offline' &&
			machine !== 'loading' &&
			machine !== 'converting' &&
			machine !== 'assembling'
	);
	const canConvert = $derived(
		Boolean(pendingBlob && pendingCueId && selectedCue?.id === pendingCueId)
	);
	const canRegenerate = $derived(
		Boolean(selectedCue?.recordable) &&
			machine !== 'offline' &&
			machine !== 'loading' &&
			machine !== 'converting' &&
			machine !== 'assembling' &&
			machine !== 'recording'
	);
	const outputLang = $derived(timeline?.output.lang ?? 'es');
	const unsaved = $derived.by(() => {
		if (!lastConvertTakeId || !lastConvertCueId || !timeline) return false;
		const cue = timeline.cues.find((item) => item.id === lastConvertCueId);
		return cue?.replacement?.takeId !== lastConvertTakeId;
	});
	const actionsLocked = $derived(
		machine === 'offline' ||
			machine === 'loading' ||
			machine === 'converting' ||
			machine === 'assembling' ||
			machine === 'recording'
	);
	const acceptDisabled = $derived(actionsLocked || !selectedCue);
	const restoreDisabled = $derived(actionsLocked || !selectedCue?.replacement);
	const listenDisabled = $derived(
		machine === 'offline' ||
			machine === 'loading' ||
			machine === 'converting' ||
			machine === 'assembling' ||
			machine === 'recording'
	);
	const outputLabel = $derived.by(() => {
		const output = timeline?.output;
		if (!output) return outputId;
		const locale = getLocale();
		const localized = output.label[locale] ?? output.label.es;
		return localized;
	});
	const statusLabel = $derived.by(() => {
		if (notice) return notice;
		if (purging) return m.studio_purging();
		switch (machine) {
			case 'offline':
				return m.studio_offline();
			case 'loading':
				return m.studio_loading();
			case 'playing':
				return m.studio_playing();
			case 'recording':
				return m.studio_recording();
			case 'converting':
				return m.studio_converting();
			case 'assembling':
				return m.studio_assembling();
			default:
				return m.studio_ready();
		}
	});

	function settingsFromDefaults(next: StudioDefaults): ConvertSettings {
		return {
			autoF0Adjust: next.seedVc.auto_f0_adjust,
			semiToneShift: next.seedVc.semi_tone_shift,
			diffusionSteps: next.seedVc.diffusion_steps,
			lengthAdjust: next.seedVc.length_adjust,
			inferenceCfgRate: next.seedVc.inference_cfg_rate
		};
	}

	function qwenFromDefaults(
		next: StudioDefaults | null,
		lang: 'es' | 'en',
		cueInstruct: string
	): QwenRegenSettings {
		const langDefaults = next?.qwen?.[lang];
		if (!langDefaults) {
			return { ...FALLBACK_QWEN, instruct: cueInstruct };
		}
		return {
			temperature: langDefaults.temperature,
			topP: langDefaults.top_p,
			topK: langDefaults.top_k,
			maxNewTokens: langDefaults.max_new_tokens,
			repetitionPenalty: langDefaults.repetition_penalty,
			instruct: cueInstruct,
			expressivenessPrefix: langDefaults.expressivenessPrefix,
			defaultInstruct: langDefaults.defaultInstruct
		};
	}

	function applyCueInstruct(cue: StudioCue | null | undefined) {
		qwenSettings = { ...qwenSettings, instruct: cue?.instruct ?? '' };
	}

	function bindSequencer(cues: StudioCue[]) {
		sequencer.onAdvance = (index) => {
			const cue = cues[index];
			if (cue) {
				selectedId = cue.id;
				applyCueInstruct(cue);
			}
		};
	}

	function stopPreview() {
		preview.stop();
		listeningTakeId = null;
	}

	async function listenTake(takeId: string) {
		const take = selectedCue?.takes.find((item) => item.takeId === takeId);
		if (!take || take.stale) return;
		if (listeningTakeId === takeId) {
			stopPreview();
			return;
		}
		notice = '';
		sequencer.pause();
		if (machine === 'playing') machine = 'ready';
		stopPreview();
		listeningTakeId = takeId;
		try {
			await preview.play(takeAudioUrl(outputId, takeId), takeId);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			if (listeningTakeId === takeId) listeningTakeId = null;
			notice = m.studio_offline();
		}
	}

	preview.onEnded = () => {
		listeningTakeId = null;
	};

	function clearRecording() {
		if (recordTimer) {
			clearTimeout(recordTimer);
			recordTimer = null;
		}
		if (recorder && recorder.state !== 'inactive') {
			recorder.stop();
		}
		recordStream?.getTracks().forEach((track) => track.stop());
		recorder = null;
		recordStream = null;
	}

	function pickRecorderType(): { mime: string; filename: string } {
		const candidates = [
			{ mime: 'audio/webm;codecs=opus', filename: 'take.webm' },
			{ mime: 'audio/webm', filename: 'take.webm' },
			{ mime: 'audio/wav', filename: 'take.wav' }
		];
		for (const candidate of candidates) {
			if (MediaRecorder.isTypeSupported(candidate.mime)) return candidate;
		}
		return { mime: '', filename: 'take.webm' };
	}

	function selectCue(id: string) {
		stopPreview();
		selectedId = id;
		const cue = timeline?.cues.find((item) => item.id === id) ?? null;
		applyCueInstruct(cue);
		const index = timeline?.cues.findIndex((item) => item.id === id) ?? -1;
		if (index >= 0) sequencer.seek(index);
	}

	function prevCue() {
		if (!timeline?.cues.length) return;
		const index = selectedIndex < 0 ? 0 : Math.max(0, selectedIndex - 1);
		const cue = timeline.cues[index];
		if (cue) selectCue(cue.id);
	}

	function nextCue() {
		if (!timeline?.cues.length) return;
		const index =
			selectedIndex < 0 ? 0 : Math.min(timeline.cues.length - 1, selectedIndex + 1);
		const cue = timeline.cues[index];
		if (cue) selectCue(cue.id);
	}

	async function play() {
		if (!timeline) return;
		stopPreview();
		notice = '';
		bindSequencer(timeline.cues);
		machine = 'playing';
		try {
			if (sequencer.status === 'paused') {
				await sequencer.resume();
				return;
			}
			const from = selectedIndex >= 0 ? selectedIndex : 0;
			await sequencer.play(outputId, timeline.cues, from);
		} catch {
			machine = 'ready';
		}
	}

	function pause() {
		stopPreview();
		sequencer.pause();
		if (machine === 'playing') machine = 'ready';
	}

	function stop() {
		stopPreview();
		if (machine === 'recording') {
			clearRecording();
			return;
		}
		sequencer.stop();
		if (machine === 'playing') machine = 'ready';
	}

	async function record() {
		if (machine === 'recording') {
			clearRecording();
			return;
		}
		if (!selectedCue?.recordable) return;
		notice = '';
		stopPreview();
		sequencer.pause();
		hitDurationLimit = false;
		try {
			recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch {
			notice = m.studio_permission();
			machine = 'ready';
			return;
		}
		const picked = pickRecorderType();
		const chunks: BlobPart[] = [];
		recorder = picked.mime
			? new MediaRecorder(recordStream, { mimeType: picked.mime })
			: new MediaRecorder(recordStream);
		const cueId = selectedCue.id;
		const filename = picked.filename;
		const mime = recorder.mimeType || picked.mime || 'audio/webm';
		recorder.ondataavailable = (event) => {
			if (event.data.size) chunks.push(event.data);
		};
		recorder.onstop = () => {
			recordStream?.getTracks().forEach((track) => track.stop());
			recordStream = null;
			recorder = null;
			if (recordTimer) {
				clearTimeout(recordTimer);
				recordTimer = null;
			}
			pendingBlob = new Blob(chunks, { type: mime });
			pendingFilename = filename;
			pendingCueId = cueId;
			if (hitDurationLimit) notice = m.studio_duration_limit();
			if (machine === 'recording') machine = 'ready';
		};
		const maxSeconds = defaults?.bounds.maxRecordingSeconds ?? 120;
		recordTimer = setTimeout(() => {
			hitDurationLimit = true;
			clearRecording();
		}, maxSeconds * 1000);
		machine = 'recording';
		recorder.start();
	}

	async function refetchTimeline() {
		const next = await fetchTimeline(outputId);
		timeline = next;
		bindSequencer(next.cues);
	}

	async function convert() {
		if (!pendingBlob || !pendingCueId) return;
		stopPreview();
		notice = '';
		machine = 'converting';
		try {
			const result = await convertCue(
				outputId,
				pendingCueId,
				pendingBlob,
				pendingFilename,
				settings
			);
			const takeId = result.takeId;
			lastConvertTakeId = typeof takeId === 'string' && takeId ? takeId : null;
			lastConvertCueId = pendingCueId;
			await refetchTimeline();
			machine = 'ready';
		} catch (error) {
			machine = 'ready';
			if (error instanceof StudioApiError && error.status === 409) {
				notice = m.studio_busy();
			} else if (error instanceof StudioApiError && error.message) {
				notice = error.message;
			} else {
				notice = m.studio_offline();
			}
		}
	}

	async function regenerate() {
		if (!selectedCue?.recordable) return;
		const cueId = selectedCue.id;
		stopPreview();
		notice = '';
		machine = 'converting';
		try {
			const result = await regenerateCue(outputId, cueId, qwenSettings);
			const takeId = result.takeId;
			lastConvertTakeId = typeof takeId === 'string' && takeId ? takeId : null;
			lastConvertCueId = cueId;
			await refetchTimeline();
			machine = 'ready';
		} catch (error) {
			machine = 'ready';
			if (error instanceof StudioApiError && error.status === 409) {
				notice = m.studio_busy();
			} else if (error instanceof StudioApiError && error.message) {
				notice = error.message;
			} else {
				notice = m.studio_offline();
			}
		}
	}

	async function accept(takeId: string) {
		if (!selectedCue) return;
		const take = selectedCue.takes.find((item) => item.takeId === takeId);
		if (!take || take.stale) return;
		notice = '';
		try {
			await acceptTake(outputId, selectedCue.id, takeId);
			if (takeId === lastConvertTakeId) {
				lastConvertTakeId = null;
				lastConvertCueId = null;
			}
			await refetchTimeline();
		} catch (error) {
			if (error instanceof StudioApiError && error.status === 409) {
				notice = m.studio_busy();
			}
		}
	}

	async function restore() {
		if (!selectedCue) return;
		if (!confirm(m.studio_restore_confirm())) return;
		notice = '';
		try {
			await restoreCue(outputId, selectedCue.id);
			await refetchTimeline();
		} catch (error) {
			if (error instanceof StudioApiError && error.status === 409) {
				notice = m.studio_busy();
			}
		}
	}

	async function assemble() {
		notice = '';
		stopPreview();
		assembledHref = null;
		machine = 'assembling';
		try {
			await assembleOutput(outputId);
			assembledHref = `${assembledUrl(outputId)}?v=${Date.now()}`;
			machine = 'ready';
		} catch {
			machine = 'ready';
			notice = m.studio_offline();
		}
	}

	function formatFreedBytes(bytes: number): string {
		if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
		return `${Math.round(bytes / 1e3)} KB`;
	}

	async function purgeTakes() {
		if (machine === 'offline' || machine === 'loading') return;
		if (!confirm(m.studio_purge_confirm())) return;
		purging = true;
		notice = '';
		try {
			const result = await purgeUnreferencedTakes(outputId);
			const deletedTakes =
				typeof result.deletedTakes === 'number' ? result.deletedTakes : Number(result.deletedTakes) || 0;
			const freedBytes =
				typeof result.freedBytes === 'number' ? result.freedBytes : Number(result.freedBytes) || 0;
			const deletedTakeIds = Array.isArray(result.deletedTakeIds)
				? result.deletedTakeIds.filter((id): id is string => typeof id === 'string')
				: [];
			const freedLabel = formatFreedBytes(freedBytes);
			notice = m.studio_purge_done({ deleted: deletedTakes, freed: freedLabel });
			if (lastConvertTakeId && deletedTakeIds.includes(lastConvertTakeId)) {
				lastConvertTakeId = null;
				lastConvertCueId = null;
			}
			await refetchTimeline();
		} catch (error) {
			if (error instanceof StudioApiError && error.status === 409) {
				notice = m.studio_busy();
			} else if (error instanceof StudioApiError && error.message) {
				notice = error.message;
			} else {
				notice = m.studio_offline();
			}
		} finally {
			purging = false;
		}
	}

	function applyModelStatus(next: StudioDefaults) {
		defaults = next;
		if (timeline) {
			timeline = {
				...timeline,
				modelState: next.modelState,
				modelError: next.modelError ?? null,
				python: next.python ?? timeline.python,
				qwenModelState: next.qwenModelState ?? timeline.qwenModelState,
				qwenModelError: next.qwenModelError ?? null
			};
		}
	}

	async function prepare() {
		notice = '';
		try {
			await prepareModel();
			applyModelStatus(await fetchDefaults());
		} catch (error) {
			notice =
				error instanceof StudioApiError && error.message
					? error.message
					: m.studio_offline();
			try {
				applyModelStatus(await fetchDefaults());
			} catch {
				if (timeline) {
					timeline = { ...timeline, modelState: 'error', modelError: notice };
				}
			}
		}
	}

	async function prepareQwen() {
		notice = '';
		const lang = timeline?.output.lang ?? 'es';
		try {
			await prepareQwenModel(lang);
			applyModelStatus(await fetchDefaults());
		} catch (error) {
			notice =
				error instanceof StudioApiError && error.message
					? error.message
					: m.studio_offline();
			try {
				applyModelStatus(await fetchDefaults());
			} catch {
				if (timeline) {
					timeline = {
						...timeline,
						qwenModelState: 'error',
						qwenModelError: notice
					};
				}
			}
		}
	}

	function changeOutput(next: string) {
		notice = '';
		stopPreview();
		assembledHref = null;
		lastConvertTakeId = null;
		lastConvertCueId = null;
		pendingBlob = null;
		pendingCueId = null;
		sequencer.stop();
		clearRecording();
		outputId = next;
	}

	function onKeydown(event: KeyboardEvent) {
		const target = event.target;
		if (target instanceof HTMLElement) {
			const tag = target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
				return;
			}
		}
		if (event.key === ' ' || event.code === 'Space') {
			event.preventDefault();
			if (machine === 'playing') pause();
			else if (machine === 'ready') void play();
			return;
		}
		if (machine === 'recording' || machine === 'converting' || machine === 'assembling') return;
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			prevCue();
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			nextCue();
		}
	}

	$effect(() => {
		const id = outputId;
		lastConvertTakeId = null;
		lastConvertCueId = null;
		pendingBlob = null;
		pendingCueId = null;
		assembledHref = null;
		notice = '';
		let cancelled = false;
		void (async () => {
			machine = 'loading';
			try {
				await fetchHealth();
				const [nextDefaults, outputsResult] = await Promise.all([
					fetchDefaults(),
					fetchOutputs()
				]);
				if (cancelled) return;
				availableOutputs = outputsResult.outputs;
				const firstAvailable = outputsResult.outputs[0];
				if (
					!outputsResult.outputs.some((output) => output.id === id) &&
					firstAvailable
				) {
					outputId = firstAvailable.id;
					return;
				}
				const nextTimeline = await fetchTimeline(id);
				if (cancelled) return;
				defaults = nextDefaults;
				settings = settingsFromDefaults(nextDefaults);
				const firstCue = nextTimeline.cues[0] ?? null;
				qwenSettings = qwenFromDefaults(
					nextDefaults,
					nextTimeline.output.lang,
					firstCue?.instruct ?? ''
				);
				timeline = nextTimeline;
				selectedId = firstCue?.id ?? null;
				bindSequencer(nextTimeline.cues);
				machine = 'ready';
			} catch {
				if (!cancelled) machine = 'offline';
			}
		})();
		return () => {
			cancelled = true;
			stopPreview();
			sequencer.stop();
			clearRecording();
		};
	});
</script>

<svelte:window onkeydown={onKeydown} />

<main class="workbench">
	<PageHeader
		eyebrow={m.studio_eyebrow()}
		title={m.studio_title()}
		lede={m.studio_lede()}
		meta={[statusLabel]}
	/>

	{#if machine === 'offline'}
		<p class="banner">{m.studio_offline()}</p>
	{:else}
		<div class="toolbar">
			<label>
				{m.studio_output()}
				<select
					value={outputId}
					aria-label={m.studio_output()}
					onchange={(event) =>
						changeOutput((event.currentTarget as HTMLSelectElement).value)}
				>
					{#each availableOutputs as output (output.id)}
						<option value={output.id}>
							{output.label[getLocale()] ?? output.label.es ?? output.id}
						</option>
					{/each}
				</select>
			</label>
			<p class="output-name">{outputLabel}</p>
			<p class="status">{statusLabel}</p>
		</div>

		{#if unsaved}
			<p class="banner warn">{m.studio_candidate_warning()}</p>
			<p class="banner warn">{m.studio_unsaved()}</p>
		{/if}

		{#if timeline?.output.sourceStatus === 'stale'}
			<p class="banner warn">
				{m.studio_source_stale({
					sourceRevision: timeline.output.sourceOutlineRevision,
					currentRevision: timeline.output.currentOutlineRevision
				})}
			</p>
		{/if}

		{#if machine === 'loading' && !timeline}
			<p class="banner">{m.studio_loading()}</p>
		{:else if timeline}
			<div class="grid">
				<section class="column" aria-label={m.studio_cues()}>
					<h2>{m.studio_cues()}</h2>
					<label>
						{m.studio_filter()}
						<select bind:value={filter} aria-label={m.studio_filter()}>
							<option value="all">{m.studio_filter_all()}</option>
							<option value="recordable">{m.studio_filter_recordable()}</option>
							<option value="replaced">{m.studio_filter_replaced()}</option>
							<option value="stale">{m.studio_filter_stale()}</option>
						</select>
					</label>
					<label>
						{m.studio_search()}
						<input type="search" bind:value={search} aria-label={m.studio_search()} />
					</label>
					<CueList cues={filteredCues} {selectedId} onselect={selectCue} />
				</section>

				<section class="column center">
					<LinePanel
						cue={selectedCue}
						candidateTakeId={selectedCue?.id === lastConvertCueId ? lastConvertTakeId : null}
						{acceptDisabled}
						{restoreDisabled}
						{listenDisabled}
						{listeningTakeId}
						onaccept={accept}
						onrestore={restore}
						onlisten={(takeId) => void listenTake(takeId)}
					/>
					<TransportBar
						{machine}
						{canRecord}
						onplay={() => void play()}
						onpause={pause}
						onstop={stop}
						onrecord={() => void record()}
						onprev={prevCue}
						onnext={nextCue}
					/>
				</section>

				<section class="column">
					<TweakPanel
						mode={engineMode}
						{settings}
						{qwenSettings}
						{defaults}
						lang={outputLang}
						{canConvert}
						{canRegenerate}
						converting={machine === 'converting' || machine === 'loading'}
						assembling={machine === 'assembling'}
						{purging}
						{assembledHref}
						onmode={(next) => (engineMode = next)}
						onchange={(next) => (settings = next)}
						onqwenchange={(next) => (qwenSettings = next)}
						onconvert={() => void convert()}
						onregenerate={() => void regenerate()}
						onassemble={() => void assemble()}
						onpurge={() => void purgeTakes()}
					/>
					<section class="diagnostics" aria-label={m.studio_diagnostics()}>
						<h2>{m.studio_diagnostics()}</h2>
						<p><span>{m.studio_output_id()}</span> {outputId}</p>
						<p><span>{m.studio_index_fingerprint()}</span> {timeline.indexFingerprint}</p>
						<p>
							<span>{m.studio_cue_fingerprint()}</span>
							{selectedCue ? JSON.stringify(selectedCue.cueFingerprint) : ''}
						</p>
						{#if selectedCue?.stableDialogueId}
							<p>
								<span>{m.studio_stable_dialogue()}</span>
								{selectedCue.stableDialogueId}
							</p>
						{/if}
						<p><span>{m.studio_model_state()}</span> {timeline.modelState}</p>
						<p>
							<span>{m.studio_qwen_model_state()}</span>
							{timeline.qwenModelState ?? 'unloaded'}
						</p>
						{#if timeline.python}
							<p><span>{m.studio_python()}</span> {timeline.python}</p>
						{/if}
						{#if timeline.modelError}
							<p class="banner warn">{timeline.modelError}</p>
						{/if}
						{#if timeline.qwenModelError}
							<p class="banner warn">{timeline.qwenModelError}</p>
						{/if}
						<button type="button" onclick={() => void prepare()}>{m.studio_prepare()}</button>
						<button type="button" onclick={() => void prepareQwen()}
							>{m.studio_prepare_qwen()}</button
						>
					</section>
				</section>
			</div>
		{/if}
	{/if}
</main>

<style>
	.workbench {
		max-width: none;
		padding: 1.5rem var(--page-gutter) 3rem;
		color: var(--ink);
	}

	.toolbar,
	.column,
	.diagnostics {
		display: grid;
		gap: 0.65rem;
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--panel);
		min-width: 0;
	}

	.toolbar {
		grid-template-columns: auto 1fr auto;
		align-items: center;
		margin-bottom: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 20rem) minmax(0, 1fr) minmax(0, 22rem);
		gap: 1rem;
		align-items: start;
	}

	.center {
		gap: 0.85rem;
		padding: 0;
		border: 0;
		background: transparent;
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
	}

	label {
		display: grid;
		gap: 0.3rem;
		color: var(--muted);
		font-size: 0.85rem;
	}

	select,
	input {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: transparent;
		color: var(--ink);
	}

	.output-name,
	.status,
	.banner,
	.diagnostics p {
		margin: 0;
	}

	.banner {
		margin-bottom: 1rem;
		color: var(--muted);
	}

	.banner.warn {
		color: var(--red);
	}

	.diagnostics span {
		display: block;
		color: var(--muted);
		font-size: 0.75rem;
	}

	.diagnostics p {
		overflow-wrap: anywhere;
		word-break: break-word;
	}

	button {
		justify-self: start;
		padding: 0.4rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
	}

	@media (max-width: 960px) {
		.grid,
		.toolbar {
			grid-template-columns: 1fr;
		}
	}
</style>
