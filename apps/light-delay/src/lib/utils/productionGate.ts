/**
 * Re-export Take.productionGate helpers for the app and Vitest.
 * @see scripts/lib/production-gate.mjs
 */
export {
	KNOWN_PRODUCTION_GATE_REASON_CODES,
	PRODUCTION_GATE_STATUSES,
	PRODUCTION_GATE_MEDIA,
	productionGateMedium,
	gateAppliesToMedium,
	gateMediumTag,
	effectiveProductionGateStatus,
	isProductionGateHold,
	resolveShotSourceTakeIds,
	resolveStretchMemberSourceTakeIds,
	evaluatePrerequisiteAssets,
	collectProductionGateValidation,
	deriveGenerationGateFromTakes,
	stretchMemberGateBlockers,
	describePrerequisiteStatus
} from '$project-tools/lib/production-gate.mjs';
