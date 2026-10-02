import type {
	AuthoringChangeSet,
	AuthoringOperation,
	ScreenplayElement
} from '@light-delay/v2-core';

export interface ProposalReviewItem {
	title: string;
	before?: string;
	after?: string;
	detail?: string;
}

const kindLabel = (kind: ScreenplayElement['kind']) => kind.replace('-', ' ');

function findElement(elements: readonly ScreenplayElement[], elementId: string) {
	return elements.find((element) => element.id === elementId);
}

function quotedAnchor(elements: readonly ScreenplayElement[], elementId: string | null): string {
	if (elementId === null) return 'Move to the start of the screenplay';
	const anchor = findElement(elements, elementId);
	return anchor ? `Place after “${anchor.text}”` : 'Place after the preceding screenplay element';
}

export function describeOperation(
	operation: AuthoringOperation,
	baseElements: readonly ScreenplayElement[]
): ProposalReviewItem {
	if (operation.type === 'InsertScreenplayElement')
		return {
			title: `Add ${kindLabel(operation.element.kind)}`,
			after: operation.element.text,
			detail: quotedAnchor(baseElements, operation.afterElementId)
		};
	if (operation.type === 'UpdateScreenplayElementText') {
		const original = findElement(baseElements, operation.elementId);
		return {
			title: `Revise ${original ? kindLabel(original.kind) : 'screenplay text'}`,
			...(original ? { before: original.text } : {}),
			after: operation.text
		};
	}
	if (operation.type === 'RemoveScreenplayElement') {
		const original = findElement(baseElements, operation.elementId);
		return {
			title: `Remove ${original ? kindLabel(original.kind) : 'screenplay element'} from this cut`,
			...(original ? { before: original.text } : {})
		};
	}
	if (operation.type === 'MoveScreenplayElement') {
		const original = findElement(baseElements, operation.elementId);
		return {
			title: `Move ${original ? kindLabel(original.kind) : 'screenplay element'}`,
			...(original ? { before: original.text } : {}),
			detail: quotedAnchor(baseElements, operation.afterElementId)
		};
	}
	return {
		title: 'Restore an earlier version',
		detail: 'Only this screenplay and cut will be restored'
	};
}

export interface HistoryEntryText {
	who: string;
	when: string;
	/** What changed, worked out from the change itself. */
	summary: string;
	/** What the author said about it, when they wrote a note. */
	note?: string;
}

const principalLabel: Record<AuthoringChangeSet['principal']['kind'], string> = {
	human: 'You',
	agent: 'Assistant',
	importer: 'Import',
	system: 'Studio'
};

const pastTense: Record<string, string> = {
	Add: 'Added',
	Revise: 'Revised',
	Remove: 'Removed',
	Move: 'Moved',
	Restore: 'Restored'
};

function inPastTense(title: string) {
	const [verb, ...rest] = title.split(' ');
	return [pastTense[verb] ?? verb, ...rest].join(' ');
}

function formatWhen(timestamp: string, now: Date) {
	const date = new Date(timestamp);
	const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	return date.toDateString() === now.toDateString()
		? time
		: `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
}

/**
 * Plain-language history entry: "You · 22:15 · Revised dialogue", with the author's note when there
 * is one. Never shows IDs or revision
 * numbers. `baseElements` is the screenplay this change was made against, for the cut being viewed,
 * when it is known; `cutLabel` names that cut.
 */
export function describeHistoryEntry(
	changeSet: AuthoringChangeSet,
	options: {
		viewedVersionId: string;
		cutLabels: Record<string, string>;
		baseElements?: readonly ScreenplayElement[];
		now?: Date;
	}
): HistoryEntryText {
	const who = principalLabel[changeSet.principal.kind];
	const when = formatWhen(changeSet.timestamp, options.now ?? new Date());
	const provenance = changeSet.provenance;
	const scopes = [...new Set(changeSet.operations.map((operation) => operation.scope.versionId))];
	const cut = (versionId: string) => options.cutLabels[versionId] ?? 'another';
	let summary: string;
	if (provenance.kind === 'scoped-restore')
		summary =
			provenance.scope.versionId === options.viewedVersionId
				? 'Restored an earlier version'
				: `Restored an earlier version of the ${cut(provenance.scope.versionId)} cut`;
	else if (provenance.kind === 'checkpoint') summary = provenance.reason;
	else if (scopes.length === 1 && scopes[0] === options.viewedVersionId && options.baseElements) {
		const [first, ...more] = changeSet.operations;
		summary = inPastTense(describeOperation(first, options.baseElements).title);
		if (more.length) summary += ` and ${more.length} more change${more.length === 1 ? '' : 's'}`;
	} else
		summary =
			scopes.length === 1 ? `Changed the ${cut(scopes[0])} cut` : `Changed ${scopes.length} cuts`;
	return changeSet.note
		? { who, when, summary, note: changeSet.note.text }
		: { who, when, summary };
}

/** Plain-language reason for a failed command. Raw messages may use internal vocabulary. */
export function explainError(error: { code: string; message: string }): string {
	switch (error.code) {
		case 'NO_CHANGES':
			return 'there are no changes to review';
		case 'CONFLICT':
			return 'the screenplay changed in the meantime';
		case 'PROPOSAL_ALREADY_RESOLVED':
			return 'these changes were already handled';
		case 'STORE_BUSY':
			return 'Studio is busy, try again';
		case 'STORE_UNAVAILABLE':
			return 'Studio can’t be reached';
		case 'PROJECT_NOT_FOUND':
		case 'REVISION_NOT_FOUND':
		case 'DOCUMENT_VERSION_NOT_FOUND':
		case 'DRAFT_NOT_FOUND':
		case 'PROPOSAL_NOT_FOUND':
			return 'it no longer exists';
		default:
			return 'something went wrong';
	}
}
