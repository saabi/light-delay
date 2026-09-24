import { WebAudioCueSequencer, type SequencerStatus } from '$lib/audio/webAudioCueSequencer';
import { chunkAudioUrl } from './api';
import type { StudioCue } from './types';

export type { SequencerStatus };

export class ChunkSequencer {
	private inner = new WebAudioCueSequencer();
	private cues: StudioCue[] = [];
	private outputId = '';
	cursor = 0;
	onAdvance: ((index: number) => void) | null = null;

	constructor() {
		this.inner.onAdvance = (cueId) => {
			const index = this.cues.findIndex((cue) => cue.id === cueId);
			if (index >= 0) {
				this.cursor = Math.min(index + 1, Math.max(0, this.cues.length - 1));
				this.onAdvance?.(this.cursor);
			}
		};
	}

	get status(): SequencerStatus {
		return this.inner.status;
	}

	get currentTime(): number {
		return this.inner.currentTimeMs / 1000;
	}

	async play(outputId: string, cues: StudioCue[], fromIndex = 0): Promise<void> {
		this.outputId = outputId;
		this.cues = cues;
		this.cursor = Math.max(0, Math.min(fromIndex, Math.max(0, cues.length - 1)));
		await this.inner.play(this.toTimed(), this.offsetAt(this.cursor) * 1000);
	}

	pause(): void {
		this.inner.pause();
	}

	async resume(): Promise<void> {
		await this.inner.resume();
		this.cursor = this.indexAt(this.currentTime);
	}

	stop(): void {
		this.inner.stop();
		this.cursor = 0;
		this.cues = [];
		this.outputId = '';
	}

	seek(index: number): void {
		this.cursor = Math.max(0, Math.min(index, Math.max(0, this.cues.length - 1)));
		this.inner.seek(this.offsetAt(this.cursor) * 1000);
	}

	private toTimed() {
		let tMs = 0;
		return this.cues.map((cue) => {
			tMs += cue.preSilenceMs;
			const startMs = tMs;
			tMs += cue.effectiveSeconds * 1000;
			return {
				id: cue.id,
				url: chunkAudioUrl(this.outputId, cue.id, cue.cacheKey),
				startMs
			};
		});
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
}
