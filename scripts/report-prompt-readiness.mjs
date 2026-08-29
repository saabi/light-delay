import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkReferenceBudget } from './lib/generation-planning.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const provider = JSON.parse(readFileSync(join(ROOT, 'data', 'production', 'provider-capabilities.json'), 'utf8'));
const campaign = provider.campaigns.find((entry) => entry.id === 'campaign:higgsfield-trial-24h');
const snapshot = provider.snapshots.find((entry) => entry.id === campaign.providerSnapshotId);
for (const name of readdirSync(join(ROOT, 'data', 'production', 'plans')).filter((name) => name.endsWith('.json'))) {
	const plan = JSON.parse(readFileSync(join(ROOT, 'data', 'production', 'plans', name), 'utf8'));
	let overBudget = 0;
	let invalidSegments = 0;
	const blockers = new Map();
	for (const shot of plan.shots) {
		for (const blocker of shot.blockers) blockers.set(blocker, (blockers.get(blocker) ?? 0) + 1);
		if (!checkReferenceBudget(shot.requiredReferences, snapshot.limits).ok) overBudget += 1;
		for (const segment of shot.segments) {
			if (segment.endMs <= segment.startMs || segment.endMs - segment.startMs > campaign.maxSegmentMs) invalidSegments += 1;
		}
	}
	console.log(`${plan.plan.scriptId}: ${plan.plan.status}; shots=${plan.shots.length}; over-reference-budget=${overBudget}; invalid-segments=${invalidSegments}`);
	for (const [blocker, count] of [...blockers].sort((a, b) => b[1] - a[1])) console.log(`  - ${blocker}: ${count}`);
}
console.log(`provider=${snapshot.model}; executable=${snapshot.executable}; campaign-preflight=${campaign.requiresEntitlementPreflight}`);
