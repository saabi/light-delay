import { describe, expect, it } from 'vitest';
import type { ContextPackage, ContextResolver, ContextRequest } from './context.js';

class FixtureResolver implements ContextResolver {
	async resolve(request: ContextRequest): Promise<ContextPackage> {
		return {
			id: 'context:fixture',
			projectId: request.projectId,
			projectRevision: request.projectRevision,
			task: request.task,
			anchor: request.anchor,
			budget: request.budget,
			createdAt: '2026-09-20T00:00:00Z',
			items: [
				{
					id: 'context-item:gravity',
					kind: 'state',
					sourceRef: 'state:ardor-bridge-gravity',
					content: { gravity: '1g' },
					reason: 'World state at the anchored story point',
					retrieval: 'structural',
					authority: 'authoritative',
					revision: request.projectRevision
				}
			]
		};
	}

	explain(context: ContextPackage) {
		return {
			projectRevision: context.projectRevision,
			items: context.items.map(({ sourceRef, reason, retrieval, authority }) => ({
				sourceRef, reason, retrieval, authority
			})),
			omissions: context.omissions ?? []
		};
	}
}

describe('Context Engine contract', () => {
	it('binds structural context to a project revision and explains provenance', async () => {
		const resolver = new FixtureResolver();
		const result = await resolver.resolve({
			projectId: 'project:light-delay',
			projectRevision: 42,
			task: { kind: 'analysis', instruction: 'Can Sorell reach Engineering?' },
			anchor: { kind: 'spatial', spatialId: 'location:celestial-ardor-bridge' },
			budget: { maxItems: 12, latencyClass: 'interactive', costClass: 'minimal' }
		});
		expect(result.projectRevision).toBe(42);
		expect(result.items[0].retrieval).toBe('structural');
		expect(resolver.explain(result).items[0].reason).toContain('World state');
	});
});
