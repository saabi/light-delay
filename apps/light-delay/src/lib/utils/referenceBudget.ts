/**
 * Re-export reference-budget helpers for the app and Vitest.
 * @see scripts/lib/reference-budget.mjs
 */
export {
	entityKindFromId,
	collectShotVisibleEntityIds,
	collectOnScreenCharacterIds,
	collectStretchVisibleEntityIds,
	indexEntityReferenceAssets,
	assetPassesCoverageQuality,
	resolveReferenceCoverage,
	excessSlotsFromViolations,
	prioritizeAttachedAssets,
	greedyPackCover,
	evaluateReferenceBudget,
	evaluateVideoStretchReferenceBudget,
	locationAncestryRoot,
	locationsShareAncestry
} from '$project-tools/lib/reference-budget.mjs';
