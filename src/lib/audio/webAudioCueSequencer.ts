export type TimedAudioCue = {
	id: string;
	url: string;
	startMs: number;
	gainDb?: number;
};

export type SequencerStatus = 'idle' | 'playing' | 'paused';

type Scheduled = {
	source: AudioBufferSourceNode;
	gain: GainNode;
	cueId: string;
};

const PREFETCH = 8;
const LOOKAHEAD_MS = 45_000;

export class WebAudioCueSequencer {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private abort: AbortController | null = null;
	/** Bumps on every seek/stop/play/pause so in-flight scheduleCue work cannot double-start. */
	private scheduleEpoch = 0;
	private scheduled: Scheduled[] = [];
	private scheduledIds = new Set<string>();
	private buffers = new Map<string, AudioBuffer>();
	private loading = new Map<string, Promise<AudioBuffer>>();
	private cues: TimedAudioCue[] = [];
	private muted = false;
	private prefetchTimer: ReturnType<typeof setInterval> | null = null;
	status: SequencerStatus = 'idle';
	private startCtxTime = 0;
	private startOffsetMs = 0;
	onAdvance: ((cueId: string) => void) | null = null;

	get currentTimeMs(): number {
		if (!this.ctx || this.status !== 'playing') return this.startOffsetMs;
		return this.startOffsetMs + (this.ctx.currentTime - this.startCtxTime) * 1000;
	}

	setMuted(muted: boolean): void {
		this.muted = muted;
		if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 1;
	}

	async play(cues: TimedAudioCue[], fromMs = 0): Promise<void> {
		this.stop();
		this.cues = [...cues].sort((a, b) => a.startMs - b.startMs || a.id.localeCompare(b.id));
		this.ctx = new AudioContext();
		this.masterGain = this.ctx.createGain();
		this.masterGain.connect(this.ctx.destination);
		this.masterGain.gain.value = this.muted ? 0 : 1;
		if (this.ctx.state === 'suspended') await this.ctx.resume();
		this.abort = new AbortController();
		this.scheduleEpoch += 1;
		this.status = 'playing';
		this.startOffsetMs = Math.max(0, fromMs);
		this.startCtxTime = this.ctx.currentTime;
		await this.ensureWindow();
		this.startPrefetchLoop();
	}

	pause(): void {
		if (this.status !== 'playing' || !this.ctx) return;
		this.startOffsetMs = this.currentTimeMs;
		this.invalidateInFlight();
		this.clearScheduled();
		this.stopPrefetchLoop();
		this.status = 'paused';
	}

	async resume(): Promise<void> {
		if (this.status !== 'paused' || !this.ctx) return;
		if (this.ctx.state === 'suspended') await this.ctx.resume();
		this.abort = new AbortController();
		this.scheduleEpoch += 1;
		this.status = 'playing';
		this.startCtxTime = this.ctx.currentTime;
		await this.ensureWindow();
		this.startPrefetchLoop();
	}

	stop(): void {
		this.invalidateInFlight();
		this.clearScheduled();
		this.stopPrefetchLoop();
		this.buffers.clear();
		this.loading.clear();
		if (this.ctx) {
			void this.ctx.close();
			this.ctx = null;
		}
		this.masterGain = null;
		this.status = 'idle';
		this.startOffsetMs = 0;
		this.startCtxTime = 0;
		this.cues = [];
	}

	seek(fromMs: number): void {
		const playing = this.status === 'playing';
		this.invalidateInFlight();
		this.clearScheduled();
		this.startOffsetMs = Math.max(0, fromMs);
		if (playing && this.ctx) {
			this.startCtxTime = this.ctx.currentTime;
			this.abort = new AbortController();
			this.scheduleEpoch += 1;
			void this.ensureWindow();
		}
	}

	private invalidateInFlight(): void {
		this.abort?.abort();
		this.abort = null;
		this.scheduleEpoch += 1;
	}

	private startPrefetchLoop(): void {
		this.stopPrefetchLoop();
		this.prefetchTimer = setInterval(() => {
			if (this.status === 'playing') void this.ensureWindow();
		}, 500);
	}

	private stopPrefetchLoop(): void {
		if (this.prefetchTimer != null) {
			clearInterval(this.prefetchTimer);
			this.prefetchTimer = null;
		}
	}

	private clearScheduled(): void {
		for (const item of this.scheduled) {
			try {
				item.source.stop();
			} catch {
				/* already stopped */
			}
		}
		this.scheduled = [];
		this.scheduledIds.clear();
	}

	private async ensureWindow(): Promise<void> {
		if (!this.ctx || !this.abort || this.status !== 'playing') return;
		const epoch = this.scheduleEpoch;
		const abort = this.abort;
		const now = this.currentTimeMs;
		const horizon = now + LOOKAHEAD_MS;
		const candidates = this.cues.filter((cue) => {
			if (this.scheduledIds.has(cue.id)) return false;
			const buffer = this.buffers.get(cue.url);
			const knownEnd = buffer ? cue.startMs + buffer.duration * 1000 : cue.startMs + 60_000;
			return knownEnd > now - 250 && cue.startMs < horizon;
		});
		for (const cue of candidates.slice(0, PREFETCH)) {
			if (this.scheduleEpoch !== epoch || abort.signal.aborted || this.status !== 'playing') {
				return;
			}
			await this.scheduleCue(cue, now, epoch, abort.signal);
		}
	}

	private async scheduleCue(
		cue: TimedAudioCue,
		nowMs: number,
		epoch: number,
		signal: AbortSignal
	): Promise<void> {
		if (!this.ctx || !this.masterGain) return;
		if (this.scheduledIds.has(cue.id)) return;
		// Reserve before any await so overlapping ensureWindow/seek cannot start the same cue twice.
		this.scheduledIds.add(cue.id);

		let buffer: AudioBuffer;
		try {
			buffer = await this.loadUrl(cue.url, signal);
		} catch {
			this.scheduledIds.delete(cue.id);
			return;
		}

		if (
			this.scheduleEpoch !== epoch ||
			signal.aborted ||
			!this.ctx ||
			!this.masterGain ||
			this.status !== 'playing'
		) {
			this.scheduledIds.delete(cue.id);
			return;
		}

		const cueEndMs = cue.startMs + buffer.duration * 1000;
		if (cueEndMs <= nowMs) {
			this.scheduledIds.delete(cue.id);
			return;
		}

		const whenSec = this.startCtxTime + (cue.startMs - this.startOffsetMs) / 1000;
		const offsetSec = Math.max(0, (nowMs - cue.startMs) / 1000);
		const startAt = Math.max(whenSec, this.ctx.currentTime);

		const source = this.ctx.createBufferSource();
		source.buffer = buffer;
		const cueGain = this.ctx.createGain();
		const db = cue.gainDb ?? 0;
		cueGain.gain.value = Math.pow(10, db / 20);
		source.connect(cueGain);
		cueGain.connect(this.masterGain);

		try {
			source.start(startAt, offsetSec);
		} catch {
			this.scheduledIds.delete(cue.id);
			return;
		}

		this.scheduled.push({ source, gain: cueGain, cueId: cue.id });
		source.onended = () => {
			this.scheduled = this.scheduled.filter((item) => item.source !== source);
			this.scheduledIds.delete(cue.id);
			if (this.status === 'playing' && this.scheduleEpoch === epoch) {
				this.onAdvance?.(cue.id);
				void this.ensureWindow();
			}
		};
	}

	private async loadUrl(url: string, signal: AbortSignal): Promise<AudioBuffer> {
		const hit = this.buffers.get(url);
		if (hit) return hit;
		const pending = this.loading.get(url);
		if (pending) return pending;

		const task = (async () => {
			const response = await fetch(url, { signal });
			if (!response.ok) throw new Error(`audio fetch failed: ${url}`);
			const raw = await response.arrayBuffer();
			if (!this.ctx) throw new Error('no audio context');
			const buffer = await this.ctx.decodeAudioData(raw.slice(0));
			this.buffers.set(url, buffer);
			return buffer;
		})();

		this.loading.set(url, task);
		try {
			return await task;
		} finally {
			this.loading.delete(url);
		}
	}
}
