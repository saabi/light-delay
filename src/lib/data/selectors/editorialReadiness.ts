import {
	countTakesNeedingRegeneration,
	shotCompletenessFlags,
	shotReadinessChips,
	takeNeedsRegeneration
} from '../../../../scripts/lib/editorial-reports.mjs';
import type { ScriptFile, Shot, Take } from '$lib/types/script';

export {
	countTakesNeedingRegeneration,
	shotCompletenessFlags,
	shotReadinessChips,
	takeNeedsRegeneration
};

export type ShotReadinessChip = 'regenerate' | 'missing_purpose' | 'missing_camera';

export function getShotReadinessChips(
	script: ScriptFile,
	shot: Shot
): ShotReadinessChip[] {
	const take = shot.selectedTakeId
		? script.takes.find((t) => t.id === shot.selectedTakeId)
		: undefined;
	return shotReadinessChips(shot, take) as ShotReadinessChip[];
}

export function countScriptTakesNeedingRegeneration(script: ScriptFile): number {
	return countTakesNeedingRegeneration(script);
}

export function takeNeedsImageRegeneration(take: Take | undefined): boolean {
	return takeNeedsRegeneration(take);
}

export { shotCompletenessFlags as getShotCompletenessFlags };
