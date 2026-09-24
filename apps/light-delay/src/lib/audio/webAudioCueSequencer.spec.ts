// @ts-nocheck
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebAudioCueSequencer } from './webAudioCueSequencer';

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

class FakeGain {
	gain = { value: 1 };
	connect() {}
}

class FakeAudioContext {
	state = 'running';
	currentTime = 0;
	destination = {};
	resume = async () => {};
	close = async () => {};
	createGain() {
		return new FakeGain();
	}
	createBufferSource() {
		return new FakeBufferSource();
	}
	decodeAudioData = async () =>
		({
			duration: 1.5
		}) as AudioBuffer;
}

describe('WebAudioCueSequencer', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('plays absolute cues and seeks without throwing', async () => {
		vi.stubGlobal('AudioContext', FakeAudioContext);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(new ArrayBuffer(8), { status: 200 }))
		);
		const seq = new WebAudioCueSequencer();
		await seq.play(
			[
				{ id: 'a', url: '/a.wav', startMs: 0 },
				{ id: 'b', url: '/b.wav', startMs: 2000 },
				{ id: 'c', url: '/c.wav', startMs: 5000 }
			],
			0
		);
		expect(seq.status).toBe('playing');
		seq.seek(2500);
		seq.pause();
		expect(seq.status).toBe('paused');
		expect(seq.currentTimeMs).toBeGreaterThanOrEqual(2500);
		await seq.resume();
		expect(seq.status).toBe('playing');
		seq.setMuted(true);
		seq.stop();
		expect(seq.status).toBe('idle');
	});

	it('rolling prefetch schedules later cues after horizon advances', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('AudioContext', FakeAudioContext);
		const fetchMock = vi.fn(async () => new Response(new ArrayBuffer(8), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		const seq = new WebAudioCueSequencer();
		const cues = Array.from({ length: 20 }, (_, i) => ({
			id: `c${i}`,
			url: `/c${i}.wav`,
			startMs: i * 10_000
		}));
		await seq.play(cues, 0);
		const initialFetches = fetchMock.mock.calls.length;
		expect(initialFetches).toBeGreaterThan(0);
		expect(initialFetches).toBeLessThanOrEqual(8);
		// Advance playhead into later window via seek while playing.
		seq.seek(90_000);
		await vi.advanceTimersByTimeAsync(600);
		expect(fetchMock.mock.calls.length).toBeGreaterThan(initialFetches);
		seq.stop();
	});

	it('rapid seeks do not start the same cue twice (scrub saturation)', async () => {
		vi.stubGlobal('AudioContext', FakeAudioContext);
		let resolveFetch: ((value: Response) => void) | null = null;
		vi.stubGlobal(
			'fetch',
			vi.fn(
				() =>
					new Promise<Response>((resolve) => {
						resolveFetch = resolve;
					})
			)
		);
		const starts: string[] = [];
		class CountingSource extends FakeBufferSource {
			override start() {
				starts.push('start');
			}
		}
		class CountingContext extends FakeAudioContext {
			override createBufferSource() {
				return new CountingSource();
			}
		}
		vi.stubGlobal('AudioContext', CountingContext);

		const seq = new WebAudioCueSequencer();
		const playPromise = seq.play([{ id: 'a', url: '/a.wav', startMs: 0 }], 0);
		// First schedule is waiting on fetch; scrub before it resolves.
		seq.seek(100);
		seq.seek(200);
		resolveFetch?.(new Response(new ArrayBuffer(8), { status: 200 }));
		await playPromise;
		// Let any leftover in-flight scheduleCue settle.
		await Promise.resolve();
		await Promise.resolve();
		expect(starts.length).toBe(1);
		seq.stop();
	});
});
