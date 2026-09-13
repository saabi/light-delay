/**
 * Dry-run compile for a visual stretch (stdout only; does not fill plan compiledPrompt).
 * Usage: node scripts/compile-visual-stretch.mjs --script light-delay-festival-master --stretch <id>
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
	buildStretchDigestPayload,
	computeMargins,
	derivePanelRegions,
	selectGridForMemberCount,
	stretchJobId,
	validateGridLayout,
	DEFAULT_GUTTER_FRACTION
} from './lib/visual-stretch.mjs';
import { stripSpokenDialogueQuotes } from './lib/still-prompt-no-dialogue.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const scriptSlug = args[args.indexOf('--script') + 1];
const stretchId = args[args.indexOf('--stretch') + 1];
if (!scriptSlug || !stretchId) {
	console.error('Usage: node scripts/compile-visual-stretch.mjs --script <slug> --stretch <id>');
	process.exit(1);
}

const script = JSON.parse(readFileSync(join(ROOT, 'data/scripts', `${scriptSlug}.json`), 'utf8'));
const providerCapabilities = JSON.parse(
	readFileSync(join(ROOT, 'data/production/provider-capabilities.json'), 'utf8')
);
const stillProvider = providerCapabilities.snapshots.find((s) => s.model === 'gpt-image-2');
const stretch = (script.visualStretches || []).find((s) => s.id === stretchId);
if (!stretch) throw new Error(`Stretch not found: ${stretchId}`);

const shotsById = new Map(script.shots.map((s) => [s.id, s]));
const takesById = new Map(script.takes.map((t) => [t.id, t]));
const members = [...stretch.members].sort((a, b) => a.order - b.order);
const layout =
	stretch.generationProfile?.gridLayout ??
	(() => {
		const selected = selectGridForMemberCount(members.length);
		if (selected.error) throw new Error(selected.error);
		return {
			rows: selected.rows,
			cols: selected.cols,
			gutterFraction: DEFAULT_GUTTER_FRACTION,
			panelAspect: '16:9',
			blankCells: selected.blankCells
		};
	})();

const outputSize = stillProvider?.outputSizes?.[0] ?? { width: 1536, height: 1024 };
const blockers = [];
for (const err of validateGridLayout(layout, members.length, {
	outputSize,
	minPanelResolution: stillProvider?.minPanelResolution
})) {
	blockers.push(err);
}
const incompleteBlocking = (stretch.presentCharacterIds || []).some((characterId) => {
	const row = (stretch.blocking || []).find((b) => b.characterId === characterId);
	return !row?.zoneOrSeat || !row?.posture;
});
if (incompleteBlocking) blockers.push('missing_stretch_blocking');
blockers.push('editorial_prompt_freeze_not_approved');

const computedMargins = computeMargins(
	outputSize,
	layout.panelAspect,
	layout.minOuterMarginFraction ?? 0
);
const regions = derivePanelRegions(layout, computedMargins);
const digestPayload = buildStretchDigestPayload({
	stretch: { ...stretch, generationProfile: { ...stretch.generationProfile, gridLayout: layout } },
	shotsById,
	takesById,
	computedMargins,
	providerProfileId: stillProvider?.id
});
const promptDigest = createHash('sha256').update(JSON.stringify(digestPayload)).digest('hex');

const sharedFragment = [
	'Ordered multi-panel storyboard sheet for a continuous stretch.',
	`Layout: ${layout.rows}x${layout.cols} equal 16:9 panels, gutterFraction ${layout.gutterFraction}, blankCells ${JSON.stringify(layout.blankCells ?? [])}.`,
	'Blank cells must be a flat neutral field with no characters, props, or text.',
	`Location: ${stretch.locationId}.`,
	stretch.physics?.en ? `Physics: ${stretch.physics.en}` : null,
	stretch.lighting?.en ? `Lighting: ${stretch.lighting.en}` : null,
	stretch.sharedDescription?.en ? `Shared: ${stretch.sharedDescription.en}` : null,
	`Present cast: ${(stretch.presentCharacterIds || []).join(', ')}.`,
	`Blocking: ${JSON.stringify(stretch.blocking || [])}.`
]
	.filter(Boolean)
	.join('\n');

const panelFragments = members.map((member, index) => {
	const shot = shotsById.get(member.shotId);
	const region = regions[index];
	const description = stripSpokenDialogueQuotes(shot?.description?.en ?? '');
	return [
		`Panel ${member.order} (cell ${region?.cellIndex}, region ${JSON.stringify(region?.frameRegion)}):`,
		`Shot ${member.shotId}.`,
		member.startState?.en ? `Start: ${member.startState.en}` : null,
		member.event?.en ? `Event: ${member.event.en}` : null,
		member.endState?.en ? `End: ${member.endState.en}` : null,
		`Delta/description: ${description}`,
		shot?.composition?.size ? `Composition size: ${shot.composition.size}.` : null,
		`Visible: ${(shot?.visibleRefs || [])
			.filter((r) => r.kind === 'character')
			.map((r) => r.id)
			.join(', ')}.`
	]
		.filter(Boolean)
		.join(' ');
});

const compiledPreview = [sharedFragment, ...panelFragments].join('\n\n');

const report = {
	stretchId: stretch.id,
	jobId: stretchJobId(stretch),
	mode: 'combined_storyboard_sheet',
	gridLayout: layout,
	computedMargins,
	outputSize,
	promptDigest,
	compiledPrompt: null,
	compiledPreview,
	blockers: [...new Set(blockers)],
	panels: members.map((member, index) => ({
		order: member.order,
		shotId: member.shotId,
		frameRegion: regions[index]?.frameRegion
	}))
};

console.log(JSON.stringify(report, null, 2));
