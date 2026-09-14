/**
 * Visual stretch layout, membership, and digest helpers.
 * Browser-safe (no fs, no sharp, no node:crypto). Shared by Node scripts and the SvelteKit app.
 */

/**
 * @typedef {{ rows: number, cols: number, gutterFraction?: number, panelAspect?: string, blankCells?: number[], minOuterMarginFraction?: number }} GridLayout
 * @typedef {{ x: number, y: number, w: number, h: number }} FrameRegion
 * @typedef {{ top: number, right: number, bottom: number, left: number }} SheetMargins
 */

export const VISUAL_STRETCH_COMPILER_VERSION = '1.0.0';
export const DEFAULT_GUTTER_FRACTION = 0.02;
export const DEFAULT_PANEL_ASPECT = '16:9';

/**
 * @param {number} memberCount
 * @param {{ allowFourByFour?: boolean }} [options]
 * @returns {{ rows: number, cols: number, blankCells: number[] } | { error: string }}
 */
export function selectGridForMemberCount(memberCount, options = {}) {
	if (!Number.isInteger(memberCount) || memberCount < 1) {
		return { error: 'member_count_invalid' };
	}
	if (memberCount <= 4) {
		const cells = 4;
		const blankCells = [];
		for (let cell = memberCount + 1; cell <= cells; cell += 1) blankCells.push(cell);
		return { rows: 2, cols: 2, blankCells };
	}
	if (memberCount <= 9) {
		const blankCells = [];
		for (let cell = memberCount + 1; cell <= 9; cell += 1) blankCells.push(cell);
		return { rows: 3, cols: 3, blankCells };
	}
	if (options.allowFourByFour && memberCount <= 16) {
		const blankCells = [];
		for (let cell = memberCount + 1; cell <= 16; cell += 1) blankCells.push(cell);
		return { rows: 4, cols: 4, blankCells };
	}
	return { error: 'member_count_exceeds_default_ladder' };
}

/**
 * @param {string} aspect
 * @returns {number}
 */
export function aspectRatioValue(aspect) {
	const [w, h] = String(aspect).split(':').map(Number);
	if (!w || !h) return 16 / 9;
	return w / h;
}

/**
 * Compute letterbox/pillarbox margins so content aspect fits inside sheet aspect.
 * @param {{ width: number, height: number }} outputSize
 * @param {string} contentAspect
 * @param {number} [minOuterMarginFraction]
 * @returns {{ top: number, right: number, bottom: number, left: number }}
 */
export function computeMargins(outputSize, contentAspect = DEFAULT_PANEL_ASPECT, minOuterMarginFraction = 0) {
	const sheetAspect = outputSize.width / outputSize.height;
	const targetAspect = aspectRatioValue(contentAspect);
	let top = 0;
	let right = 0;
	let bottom = 0;
	let left = 0;
	if (sheetAspect > targetAspect) {
		const contentWidth = targetAspect / sheetAspect;
		const side = (1 - contentWidth) / 2;
		left = side;
		right = side;
	} else if (sheetAspect < targetAspect) {
		const contentHeight = sheetAspect / targetAspect;
		const side = (1 - contentHeight) / 2;
		top = side;
		bottom = side;
	}
	const floor = Math.max(0, minOuterMarginFraction || 0);
	return {
		top: Math.max(top, floor),
		right: Math.max(right, floor),
		bottom: Math.max(bottom, floor),
		left: Math.max(left, floor)
	};
}

/**
 * @param {GridLayout} layout
 * @param {SheetMargins} margins
 * @returns {Array<{ cellIndex: number, orderSlot: number, frameRegion: FrameRegion }>}
 */
export function derivePanelRegions(layout, margins) {
	const rows = layout.rows;
	const cols = layout.cols;
	const gutter = layout.gutterFraction ?? DEFAULT_GUTTER_FRACTION;
	const blank = new Set(layout.blankCells ?? []);
	const contentX = margins.left;
	const contentY = margins.top;
	const contentW = 1 - margins.left - margins.right;
	const contentH = 1 - margins.top - margins.bottom;
	const gutterX = gutter;
	const gutterY = gutter;
	const cellW = (contentW - gutterX * (cols - 1)) / cols;
	const cellH = (contentH - gutterY * (rows - 1)) / rows;
	const regions = [];
	let orderSlot = 0;
	for (let r = 0; r < rows; r += 1) {
		for (let c = 0; c < cols; c += 1) {
			const cellIndex = r * cols + c + 1;
			if (blank.has(cellIndex)) continue;
			orderSlot += 1;
			const x = contentX + c * (cellW + gutterX);
			const y = contentY + r * (cellH + gutterY);
			regions.push({
				cellIndex,
				orderSlot,
				frameRegion: roundRegion({ x, y, w: cellW, h: cellH })
			});
		}
	}
	return regions;
}

/**
 * @param {FrameRegion} region
 * @returns {FrameRegion}
 */
export function roundRegion(region) {
	/** @type {(n: number) => number} */
	const q = (n) => Math.round(n * 1e6) / 1e6;
	return { x: q(region.x), y: q(region.y), w: q(region.w), h: q(region.h) };
}

/**
 * @param {GridLayout | null | undefined} layout
 * @param {number} memberCount
 * @param {{ minPanelResolution?: { width: number, height: number }, outputSize?: { width: number, height: number }, allowFourByFour?: boolean }} [opts]
 * @returns {string[]}
 */
export function validateGridLayout(layout, memberCount, opts = {}) {
	const errors = [];
	if (!layout || !Number.isInteger(layout.rows) || !Number.isInteger(layout.cols)) {
		return ['grid_layout_missing_rows_cols'];
	}
	if (layout.rows < 1 || layout.cols < 1) errors.push('grid_layout_non_positive');
	if (layout.panelAspect && layout.panelAspect !== '16:9') errors.push('grid_layout_panel_aspect');
	if (typeof layout.gutterFraction !== 'number' || layout.gutterFraction < 0 || layout.gutterFraction >= 0.5) {
		errors.push('grid_layout_gutter_invalid');
	}
	const cells = layout.rows * layout.cols;
	const blanks = layout.blankCells ?? [];
	if (!Array.isArray(blanks)) {
		errors.push('grid_layout_blank_cells_invalid');
		return errors;
	}
	const blankSet = new Set();
	for (const cell of blanks) {
		if (!Number.isInteger(cell) || cell < 1 || cell > cells) {
			errors.push(`grid_layout_blank_out_of_range:${cell}`);
			continue;
		}
		if (blankSet.has(cell)) errors.push(`grid_layout_blank_duplicate:${cell}`);
		blankSet.add(cell);
	}
	const usable = cells - blankSet.size;
	if (usable !== memberCount) {
		errors.push(`grid_layout_member_mismatch:usable=${usable},members=${memberCount}`);
	}
	if (memberCount === cells && blankSet.size > 0) {
		errors.push('grid_layout_blank_on_full_grid');
	}
	if (layout.rows === 1 && layout.cols === 3) {
		errors.push('grid_layout_1x3_rejected');
	}
	if (layout.rows === 4 && layout.cols === 4 && !opts.allowFourByFour) {
		errors.push('grid_layout_4x4_not_allowed');
	}
	if (opts.outputSize && opts.minPanelResolution) {
		const margins = computeMargins(
			opts.outputSize,
			layout.panelAspect ?? DEFAULT_PANEL_ASPECT,
			layout.minOuterMarginFraction ?? 0
		);
		const regions = derivePanelRegions(layout, margins);
		for (const region of regions) {
			const pw = opts.outputSize.width * region.frameRegion.w;
			const ph = opts.outputSize.height * region.frameRegion.h;
			if (pw < opts.minPanelResolution.width || ph < opts.minPanelResolution.height) {
				errors.push('grid_layout_panel_resolution_too_low');
				break;
			}
		}
	}
	return errors;
}

/**
 * @param {{ visualStretches?: any[] }} script
 * @param {string} shotId
 */
export function findStretchForShot(script, shotId) {
	for (const stretch of script.visualStretches ?? []) {
		const member = (stretch.members ?? []).find(
			/** @param {{ shotId: string }} m */ (m) => m.shotId === shotId
		);
		if (member) return { stretch, member };
	}
	return null;
}

/**
 * @param {{ id: string, revision: number }} stretch
 */
export function stretchJobId(stretch) {
	return `${stretch.id}:rev-${stretch.revision}`;
}

/**
 * Stable digest payload for stretch + member shot authority.
 * Does not include selectedTakeId or take prompt/refs — selecting a derived
 * candidate must not invalidate that candidate's own stretchDigest.
 * @param {{ stretch: any, shotsById: Map<string, any> }} args
 * @returns {{
 *   compilerVersion: string,
 *   stretchId: string,
 *   revision: number,
 *   videoReferencePolicy: 'fallback' | 'explicit',
 *   videoReferenceAssetIds?: string[],
 *   referenceAssetIds: string[],
 *   members: any[],
 *   [key: string]: unknown
 * }}
 */
export function buildStretchDigestPayload(args) {
	const { stretch, shotsById } = args;
	const members = [...(stretch.members ?? [])].sort((a, b) => a.order - b.order);
	return {
		compilerVersion: VISUAL_STRETCH_COMPILER_VERSION,
		stretchId: stretch.id,
		revision: stretch.revision,
		sharedDescription: stretch.sharedDescription,
		physics: stretch.physics,
		lighting: stretch.lighting,
		locationId: stretch.locationId,
		presentCharacterIds: stretch.presentCharacterIds,
		absentCharacterIds: stretch.absentCharacterIds,
		blocking: stretch.blocking,
		persistentProps: stretch.persistentProps,
		generationProfile: stretch.generationProfile,
		gridLayout: stretch.generationProfile?.gridLayout,
		referenceAssetIds: stretch.referenceAssetIds ?? [],
		...(Object.prototype.hasOwnProperty.call(stretch, 'videoReferenceAssetIds')
			? {
					videoReferencePolicy: 'explicit',
					videoReferenceAssetIds: stretch.videoReferenceAssetIds ?? []
				}
			: { videoReferencePolicy: 'fallback' }),
		members: members.map((member) => {
			const shot = shotsById.get(member.shotId);
			return {
				order: member.order,
				shotId: member.shotId,
				takeScope: member.takeScope,
				/** Explicit compile inputs only — never selectedTakeId. */
				explicitTakeIds: member.takeScope === 'explicit' ? member.takeIds ?? [] : [],
				visualDelta: member.visualDelta,
				startState: member.startState,
				event: member.event,
				endState: member.endState,
				frameRegion: member.frameRegion,
				shotDescription: shot?.description,
				composition: shot?.composition,
				camera: shot?.camera,
				visibleRefs: shot?.visibleRefs,
				offScreenCharacterIds: shot?.offScreenCharacterIds
			};
		})
	};
}

/**
 * Soft heuristic: adjacent same-location shots not covered by any stretch.
 * Uses composite (scene.order, shot.order, shot.id) — never raw shot.order alone.
 * @param {{ visualStretches?: any[], shots?: any[], scenes?: any[] }} script
 * @param {{ locationsById?: Map<string, { parentLocationId?: string }> }} [opts]
 * @returns {Array<{ shotA: string, shotB: string, locationId: string }>}
 */
export function findAdjacentUnstretchedPairs(script, opts = {}) {
	const scenesById = new Map((script.scenes || []).map(/** @param {any} s */ (s) => [s.id, s]));
	const locationsById = opts.locationsById ?? new Map();
	const ancestryRoot = (/** @type {string} */ locationId) => {
		/** @type {Set<string>} */
		const seen = new Set();
		let current = locationId;
		while (current && !seen.has(current)) {
			seen.add(current);
			const parent = locationsById.get(current)?.parentLocationId;
			if (!parent) return current;
			current = parent;
		}
		return locationId;
	};
	const shots = [...(script.shots ?? [])].sort((a, b) => {
		const sceneA = scenesById.get(a.sceneId);
		const sceneB = scenesById.get(b.sceneId);
		const soA = Number.isFinite(sceneA?.order) ? sceneA.order : Number.MAX_SAFE_INTEGER;
		const soB = Number.isFinite(sceneB?.order) ? sceneB.order : Number.MAX_SAFE_INTEGER;
		if (soA !== soB) return soA - soB;
		const oA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
		const oB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
		if (oA !== oB) return oA - oB;
		return String(a.id).localeCompare(String(b.id));
	});
	const covered = new Set();
	for (const stretch of script.visualStretches ?? []) {
		for (const member of stretch.members ?? []) covered.add(member.shotId);
	}
	const pairs = [];
	for (let i = 0; i < shots.length - 1; i += 1) {
		const a = shots[i];
		const b = shots[i + 1];
		if (!a.locationId || !b.locationId) continue;
		if (locationsById.size) {
			if (ancestryRoot(a.locationId) !== ancestryRoot(b.locationId)) continue;
		} else if (a.locationId !== b.locationId) {
			continue;
		}
		if (covered.has(a.id) || covered.has(b.id)) continue;
		pairs.push({ shotA: a.id, shotB: b.id, locationId: a.locationId });
	}
	return pairs;
}

/**
 * @param {{ presentCharacterIds?: string[], blocking?: Array<{ characterId: string, zoneOrSeat?: string, posture?: string }> }} stretch
 */
export function isStretchBlockingComplete(stretch) {
	return !(stretch.presentCharacterIds || []).some((characterId) => {
		const row = (stretch.blocking || []).find((b) => b.characterId === characterId);
		return !row?.zoneOrSeat || !row?.posture;
	});
}

/**
 * @param {{ presentCharacterIds?: string[], blocking?: Array<{ characterId: string, zoneOrSeat?: string, posture?: string }> }} stretch
 * @returns {string[]}
 */
export function stretchBlockingBlockers(stretch) {
	return isStretchBlockingComplete(stretch) ? [] : ['missing_stretch_blocking'];
}

/**
 * @param {{ supportedStoryboardLayouts?: Array<{ rows?: number, columns?: number, cols?: number }> }} [stillProvider]
 */
export function providerAllowsFourByFour(stillProvider) {
	return Boolean(
		stillProvider?.supportedStoryboardLayouts?.some(
			(layout) => layout.rows === 4 && (layout.columns === 4 || layout.cols === 4)
		)
	);
}

/**
 * @param {Array<{ width: number, height: number }> | undefined} outputSizes
 * @param {GridLayout} layout
 * @param {{ width: number, height: number } | undefined} minPanelResolution
 */
export function selectLargestSuitableOutputSize(outputSizes, layout, minPanelResolution) {
	const sorted = [...(outputSizes || [])].sort((a, b) => b.width * b.height - a.width * a.height);
	if (!sorted.length) return { width: 1536, height: 1024 };
	if (!minPanelResolution) return sorted[0];
	for (const outputSize of sorted) {
		const margins = computeMargins(
			outputSize,
			layout.panelAspect ?? DEFAULT_PANEL_ASPECT,
			layout.minOuterMarginFraction ?? 0
		);
		const regions = derivePanelRegions(layout, margins);
		const ok = regions.every((region) => {
			const pw = outputSize.width * region.frameRegion.w;
			const ph = outputSize.height * region.frameRegion.h;
			return pw >= minPanelResolution.width && ph >= minPanelResolution.height;
		});
		if (ok) return outputSize;
	}
	return sorted[0];
}

/**
 * Structured English blocking lines for prompts — no notes / Spanish / invent text.
 * @param {Array<{
 *   characterId: string,
 *   zoneOrSeat?: string,
 *   screenSide?: string,
 *   facing?: string,
 *   posture?: string,
 *   eyelineTarget?: string,
 *   heldEntityRef?: { id?: string } | string,
 *   interactionTarget?: { id?: string } | string
 * }> | undefined} blocking
 */
export function formatBlockingForPrompt(blocking) {
	return (blocking || [])
		.map((row) => {
			const held =
				row.heldEntityRef == null
					? null
					: typeof row.heldEntityRef === 'string'
						? row.heldEntityRef
						: row.heldEntityRef.id;
			const interaction =
				row.interactionTarget == null
					? null
					: typeof row.interactionTarget === 'string'
						? row.interactionTarget
						: row.interactionTarget.id;
			return [
				row.characterId,
				row.zoneOrSeat ? `zoneOrSeat=${row.zoneOrSeat}` : null,
				row.screenSide ? `screenSide=${row.screenSide}` : null,
				row.facing ? `facing=${row.facing}` : null,
				row.posture ? `posture=${row.posture}` : null,
				row.eyelineTarget ? `eyelineTarget=${row.eyelineTarget}` : null,
				held ? `held=${held}` : null,
				interaction ? `interactionTarget=${interaction}` : null
			]
				.filter(Boolean)
				.join('; ');
		})
		.filter(Boolean)
		.join('\n');
}

/**
 * Path segment under static/assets/animatic/frames/ from a script JSON slug.
 * @param {string} scriptSlug e.g. light-delay-festival-master
 */
export function scriptAnimaticFramesSegment(scriptSlug) {
	return String(scriptSlug).replace(/^light-delay-/, '');
}

/**
 * @param {string[]} args
 * @param {string} flag
 * @returns {string | null}
 */
export function readArgValue(args, flag) {
	const index = args.indexOf(flag);
	if (index < 0 || index + 1 >= args.length) return null;
	const value = args[index + 1];
	if (!value || value.startsWith('--')) return null;
	return value;
}
