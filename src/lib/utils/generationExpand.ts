export type GenerationExpandState = {
	groupIds: string[];
	cardIds: string[];
	openGroupIds: Set<string>;
	expandedCardIds: Set<string>;
};

export type GenerationExpandPatch = Pick<GenerationExpandState, 'openGroupIds' | 'expandedCardIds'>;

export function allGroupsExpanded(state: GenerationExpandState): boolean {
	return state.groupIds.length > 0 && state.groupIds.every((id) => state.openGroupIds.has(id));
}

export function allCardsExpanded(state: GenerationExpandState): boolean {
	return state.cardIds.length > 0 && state.cardIds.every((id) => state.expandedCardIds.has(id));
}

export function anyGroupsExpanded(state: GenerationExpandState): boolean {
	return state.groupIds.some((id) => state.openGroupIds.has(id));
}

export function anyCardsExpanded(state: GenerationExpandState): boolean {
	return state.cardIds.some((id) => state.expandedCardIds.has(id));
}

/** Expand only the outermost level that still has collapsed items (groups, then cards). */
export function expandNextLevel(state: GenerationExpandState): GenerationExpandPatch {
	if (!allGroupsExpanded(state)) {
		return { openGroupIds: new Set(state.groupIds), expandedCardIds: state.expandedCardIds };
	}
	if (!allCardsExpanded(state)) {
		return { openGroupIds: state.openGroupIds, expandedCardIds: new Set(state.cardIds) };
	}
	return { openGroupIds: state.openGroupIds, expandedCardIds: state.expandedCardIds };
}

/** Collapse only the innermost level that still has expanded items (cards, then groups). */
export function collapseNextLevel(state: GenerationExpandState): GenerationExpandPatch {
	if (anyCardsExpanded(state)) {
		return { openGroupIds: state.openGroupIds, expandedCardIds: new Set() };
	}
	if (anyGroupsExpanded(state)) {
		return { openGroupIds: new Set(), expandedCardIds: state.expandedCardIds };
	}
	return { openGroupIds: state.openGroupIds, expandedCardIds: state.expandedCardIds };
}
