/**
 * Re-export visual-stretch helpers for the app and Vitest.
 * @see scripts/lib/visual-stretch.mjs
 */
export {
	VISUAL_STRETCH_COMPILER_VERSION,
	DEFAULT_GUTTER_FRACTION,
	DEFAULT_PANEL_ASPECT,
	selectGridForMemberCount,
	aspectRatioValue,
	computeMargins,
	derivePanelRegions,
	roundRegion,
	validateGridLayout,
	findStretchForShot,
	stretchJobId,
	buildStretchDigestPayload,
	findAdjacentUnstretchedPairs,
	isStretchBlockingComplete,
	stretchBlockingBlockers,
	providerAllowsFourByFour,
	selectLargestSuitableOutputSize,
	formatBlockingForPrompt,
	scriptAnimaticFramesSegment,
	readArgValue
} from '../../../scripts/lib/visual-stretch.mjs';
