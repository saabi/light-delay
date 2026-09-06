import { describe, expect, it } from 'vitest';
import { getEditorialLifecycle, getLifecycleForRef } from './index';

describe('editorial lifecycle', () => {
	it('keeps the WIP master authoritative while every deletion gate is open', () => {
		const lifecycle = getEditorialLifecycle();
		expect(lifecycle.authority.outlineId).toBe('outline:light-delay-master-narrative');
		expect(lifecycle.deletionGates).toHaveLength(4);
		expect(lifecycle.deletionGates.every((gate) => gate.status === 'open')).toBe(true);
		expect(getLifecycleForRef('script', lifecycle.authority.scriptId)).toMatchObject({
			status: 'active',
			relevance: 'authoritative',
			disposition: 'retain'
		});
	});

	it('distinguishes deprecated products from obsolete implementations', () => {
		expect(getLifecycleForRef('script', 'script:light-delay-main-short')).toMatchObject({
			status: 'deprecated',
			disposition: 'retain_for_salvage'
		});
		expect(getLifecycleForRef('animatic', 'script:light-delay-main-short')).toMatchObject({
			status: 'obsolete',
			disposition: 'retain_for_salvage'
		});
	});

	it('keeps required entities and defaults uncertain records to review', () => {
		expect(getLifecycleForRef('entity', 'character:okoye')).toMatchObject({
			status: 'active',
			relevance: 'required'
		});
		expect(getLifecycleForRef('entity', 'character:cael')).toMatchObject({
			status: 'obsolete',
			disposition: 'delete_after_gates'
		});
		expect(getLifecycleForRef('asset', 'asset:not-classified')).toMatchObject({
			status: 'review_required',
			disposition: 'retain'
		});
	});
});
