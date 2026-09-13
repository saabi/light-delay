/**
 * Dry-run compile for a visual stretch (stdout only; does not fill plan compiledPrompt).
 * Usage: node scripts/compile-visual-stretch.mjs --script light-delay-festival-master --stretch <id>
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	computeMargins,
	derivePanelRegions,
	formatBlockingForPrompt,
	providerAllowsFourByFour,
	readArgValue,
	selectGridForMemberCount,
	selectLargestSuitableOutputSize,
	stretchBlockingBlockers,
	stretchJobId,
	validateGridLayout,
	DEFAULT_GUTTER_FRACTION
} from './lib/visual-stretch.mjs';
import { computeStretchDigest } from './lib/visual-stretch-digest.mjs';
import { stripSpokenDialogueQuotes } from './lib/still-prompt-no-dialogue.mjs';
import {
	collectStillStretchReferences,
	referenceBudgetBlockers
} from './lib/visual-stretch-jobs.mjs';
import { resolveCampaignProviders } from './lib/provider-capabilities.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const scriptSlug = readArgValue(args, '--script');
const stretchId = readArgValue(args, '--stretch');
if (!scriptSlug || !stretchId) {
	console.error('Usage: node scripts/compile-visual-stretch.mjs --script <slug> --stretch <id>');
	process.exit(1);
}

const script = JSON.parse(readFileSync(join(ROOT, 'data/scripts', `${scriptSlug}.json`), 'utf8'));
const providerCapabilities = JSON.parse(
	readFileSync(join(ROOT, 'data/production/provider-capabilities.json'), 'utf8')
);
const { stillProvider } = resolveCampaignProviders(
	providerCapabilities,
	'campaign:higgsfield-trial-24h'
);
const stretch = (script.visualStretches || []).find((s) => s.id === stretchId);
if (!stretch) throw new Error(`Stretch not found: ${stretchId}`);

const shotsById = new Map(script.shots.map((s) => [s.id, s]));
const members = [...stretch.members].sort((a, b) => a.order - b.order);
const allowFourByFour = providerAllowsFourByFour(stillProvider);
const layout =
	stretch.generationProfile?.gridLayout ??
	(() => {
		const selected = selectGridForMemberCount(members.length, { allowFourByFour });
		if ('error' in selected) throw new Error(selected.error);
		return {
			rows: selected.rows,
			cols: selected.cols,
			gutterFraction: DEFAULT_GUTTER_FRACTION,
			panelAspect: '16:9',
			blankCells: selected.blankCells
		};
	})();

const outputSize = selectLargestSuitableOutputSize(
	stillProvider?.outputSizes,
	layout,
	stillProvider?.minPanelResolution
);
const stillRefs = collectStillStretchReferences(stretch);
const blockers = [
	...stretchBlockingBlockers(stretch),
	...validateGridLayout(layout, members.length, {
		outputSize,
		minPanelResolution: stillProvider?.minPanelResolution,
		allowFourByFour
	}),
	...referenceBudgetBlockers(stillRefs, stillProvider?.limits),
	'editorial_prompt_freeze_not_approved'
];

const computedMargins = computeMargins(
	outputSize,
	layout.panelAspect,
	layout.minOuterMarginFraction ?? 0
);
const regions = derivePanelRegions(layout, computedMargins);
const promptDigest = computeStretchDigest(stretch, script);
const blockingLines = formatBlockingForPrompt(stretch.blocking);

const sharedFragment = [
	'Ordered multi-panel storyboard sheet for a continuous stretch.',
	`Layout: ${layout.rows}x${layout.cols} equal 16:9 panels, gutterFraction ${layout.gutterFraction}, blankCells ${JSON.stringify(layout.blankCells ?? [])}.`,
	'Blank cells must be a flat neutral field with no characters, props, or text.',
	`Location: ${stretch.locationId}.`,
	stretch.physics?.en ? `Physics: ${stretch.physics.en}` : null,
	stretch.lighting?.en ? `Lighting: ${stretch.lighting.en}` : null,
	stretch.sharedDescription?.en ? `Shared: ${stretch.sharedDescription.en}` : null,
	`Present cast: ${(stretch.presentCharacterIds || []).join(', ')}.`,
	blockingLines ? `Blocking:\n${blockingLines}` : null
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
