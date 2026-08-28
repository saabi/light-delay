/**
 * Re-export spoken-duration core for the app and Vitest.
 * Node report scripts import the same module from scripts/lib/.
 */
export {
	estimateDialogueVariantMs,
	estimateSpokenMsFromText,
	isOffCameraPresentation,
	MONTAGE_SURPLUS_SPOKEN_RATIO,
	MONTAGE_SURPLUS_THRESHOLD_MS,
	OFF_CAMERA_PRESENTATIONS,
	PACE_MULTIPLIERS,
	paceMultiplier,
	roundSpokenMs,
	SILENT_LONG_SHOT_MS,
	SPOKEN_FLOOR_MS,
	wordCount,
	wpmForLanguage
} from '../../../scripts/lib/spoken-duration-core.mjs';
