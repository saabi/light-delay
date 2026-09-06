/** One-shot Web Audio preview for a converted take. Does not touch the cue sequencer. */

export class TakePreview {
	private ctx: AudioContext | null = null;
	private source: AudioBufferSourceNode | null = null;
	private abort: AbortController | null = null;
	takeId: string | null = null;
	onEnded: (() => void) | null = null;

	get active(): boolean {
		return this.source !== null;
	}

	async play(url: string, takeId: string): Promise<void> {
		this.stop();
		this.takeId = takeId;
		this.abort = new AbortController();
		const ctx = new AudioContext();
		this.ctx = ctx;
		if (ctx.state === 'suspended') await ctx.resume();
		const response = await fetch(url, { signal: this.abort.signal });
		if (!response.ok) {
			this.stop();
			throw new Error('take preview failed');
		}
		const raw = await response.arrayBuffer();
		if (this.abort.signal.aborted || this.ctx !== ctx) return;
		const buffer = await ctx.decodeAudioData(raw.slice(0));
		if (this.abort.signal.aborted || this.ctx !== ctx) return;
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(ctx.destination);
		source.onended = () => {
			if (this.source !== source) return;
			this.source = null;
			this.takeId = null;
			void ctx.close();
			if (this.ctx === ctx) this.ctx = null;
			this.onEnded?.();
		};
		this.source = source;
		source.start();
	}

	stop(): void {
		this.abort?.abort();
		this.abort = null;
		const source = this.source;
		this.source = null;
		this.takeId = null;
		if (source) {
			try {
				source.stop();
			} catch {
				/* already stopped */
			}
			source.disconnect();
		}
		if (this.ctx) {
			void this.ctx.close();
			this.ctx = null;
		}
	}
}
