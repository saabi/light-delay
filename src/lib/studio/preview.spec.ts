import { afterEach, describe, expect, it, vi } from 'vitest';
import { TakePreview } from './preview';

class FakeBufferSource {
	buffer: AudioBuffer | null = null;
	onended: (() => void) | null = null;
	connect() {}
	start() {}
	stop() {
		this.onended?.();
	}
	disconnect() {}
}

class FakeAudioContext {
	state = 'running';
	destination = {};
	resume = async () => {};
	close = async () => {};
	createBufferSource() {
		return new FakeBufferSource();
	}
	decodeAudioData = async () => ({}) as AudioBuffer;
}

describe('TakePreview', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('stop is safe before play', () => {
		const preview = new TakePreview();
		expect(() => preview.stop()).not.toThrow();
		expect(preview.takeId).toBeNull();
	});

	it('plays take audio and stops without a second onEnded from abort', async () => {
		vi.stubGlobal('AudioContext', FakeAudioContext);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(new ArrayBuffer(8), { status: 200 }))
		);
		const preview = new TakePreview();
		let ended = 0;
		preview.onEnded = () => {
			ended += 1;
		};
		await preview.play('/v1/imitation/outputs/audience-es/takes/take-1/audio', 'take-1');
		expect(preview.takeId).toBe('take-1');
		preview.stop();
		expect(preview.takeId).toBeNull();
		expect(ended).toBe(0);
	});
});
