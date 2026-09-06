import { chunkAudioUrl } from './api';
import type { StudioCue } from './types';

export type SequencerStatus = 'idle' | 'playing' | 'paused';

type Scheduled = {
	source: AudioBufferSourceNode;
	startAt: number;
};

const PREFETCH = 8;

export class ChunkSequencer {
	private ctx: AudioContext | null = null;
	private abort: AbortController | null = null;
	private scheduled: Scheduled[] = [];
	private buffers = new Map<string, AudioBuffer>();
	status: SequencerStatus = 'idle';
	cursor = 0;
	private startCtxTime = 0;
	private startOffset = 0;
	private cues: StudioCue[] = [];
	private outputId = '';
	onAdvance: ((index: number) => void) | null = null;

	get currentTime(): number {
		if (!this.ctx || this.status !== 'playing') return this.startOffset;
		return this.startOffset + (this.ctx.currentTime - this.startCtxTime);
	}

	async play(outputId: string, cues: StudioCue[], fromIndex = 0): Promise<void> {
		this.stop();
		this.outputId = outputId;
		this.cues = cues;
		this.cursor = Math.max(0, Math.min(fromIndex, cues.length - 1));
		this.ctx = new AudioContext();
		if (this.ctx.state === 'suspended') await this.ctx.resume();
		this.abort = new AbortController();
		this.status = 'playing';
		this.startOffset = this.offsetAt(this.cursor);
		this.startCtxTime = this.ctx.currentTime;
		await this.scheduleFrom(this.cursor);
	}

	pause(): void {
		if (this.status !== 'playing' || !this.ctx) return;
		this.startOffset = this.currentTime;
		this.clearScheduled();
		this.status = 'paused';
	}

	async resume(): Promise<void> {
		if (this.status !== 'paused' || !this.ctx) return;
		if (this.ctx.state === 'suspended') await this.ctx.resume();
		this.abort = new AbortController();
		this.status = 'playing';
		this.startCtxTime = this.ctx.currentTime;
		const index = this.indexAt(this.startOffset);
		this.cursor = index;
		await this.scheduleFrom(index, this.startOffset - this.offsetAt(index));
	}

	stop(): void {
		this.abort?.abort();
		this.abort = null;
		this.clearScheduled();
		this.buffers.clear();
		if (this.ctx) {
			void this.ctx.close();
			this.ctx = null;
		}
		this.status = 'idle';
		this.startOffset = 0;
		this.startCtxTime = 0;
	}

	seek(index: number): void {
		const playing = this.status === 'playing';
		this.clearScheduled();
		this.cursor = index;
		this.startOffset = this.offsetAt(index);
		if (playing && this.ctx) {
			this.startCtxTime = this.ctx.currentTime;
			this.abort?.abort();
			this.abort = new AbortController();
			void this.scheduleFrom(index);
		}
	}

	private offsetAt(index: number): number {
		let t = 0;
		for (let i = 0; i < index; i += 1) {
			const cue = this.cues[i];
			if (!cue) break;
			t += cue.preSilenceMs / 1000 + cue.effectiveSeconds;
		}
		return t;
	}

	private indexAt(time: number): number {
		let t = 0;
		for (let i = 0; i < this.cues.length; i += 1) {
			const cue = this.cues[i];
			if (!cue) break;
			const dur = cue.preSilenceMs / 1000 + cue.effectiveSeconds;
			if (time < t + dur) return i;
			t += dur;
		}
		return Math.max(0, this.cues.length - 1);
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
	}

	private async scheduleFrom(index: number, skipSeconds = 0): Promise<void> {
		if (!this.ctx || !this.abort) return;
		const ctx = this.ctx;
		let when = ctx.currentTime;
		for (let i = index; i < Math.min(this.cues.length, index + PREFETCH); i += 1) {
			const cue = this.cues[i];
			if (!cue) break;
			const silence = i === index ? Math.max(0, cue.preSilenceMs / 1000 - skipSeconds) : cue.preSilenceMs / 1000;
			when += silence;
			const buffer = await this.loadCue(cue);
			if (!this.abort || this.abort.signal.aborted || !this.ctx) return;
			const source = ctx.createBufferSource();
			source.buffer = buffer;
			source.connect(ctx.destination);
			const offset = i === index ? Math.max(0, skipSeconds - cue.preSilenceMs / 1000) : 0;
			source.start(when, offset);
			const captured = i;
			source.onended = () => {
				if (this.status === 'playing') {
					this.cursor = Math.min(captured + 1, this.cues.length - 1);
					this.onAdvance?.(this.cursor);
				}
			};
			this.scheduled.push({ source, startAt: when });
			when += Math.max(0, buffer.duration - offset);
		}
	}

	private async loadCue(cue: StudioCue): Promise<AudioBuffer> {
		const key = `${cue.id}:${cue.cacheKey}`;
		const hit = this.buffers.get(key);
		if (hit) return hit;
		const url = chunkAudioUrl(this.outputId, cue.id, cue.cacheKey);
		const response = await fetch(url, { signal: this.abort?.signal });
		if (!response.ok) throw new Error('chunk fetch failed');
		const raw = await response.arrayBuffer();
		if (!this.ctx) throw new Error('no audio context');
		const buffer = await this.ctx.decodeAudioData(raw.slice(0));
		this.buffers.set(key, buffer);
		return buffer;
	}
}
