<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type {
		AuthoringChangeSet,
		DocumentVersionScope,
		ScreenplayDraft,
		ScreenplayElement,
		ScreenplayProposal,
		ScreenplayView
	} from '@light-delay/v2-core';
	import {
		GlyphCapacitySensor,
		emptyGlyphCapacityValue,
		type GlyphCapacityValue
	} from 'svelte-glyph-capacity';
	import {
		authoringApplication,
		authoringFixtureIds,
		authorizeManualAuthoringRetry,
		onAuthoringConnectionState,
		studioAuthoringContext
	} from '$lib/authoring-client';
	import { AuthoringRequestError, type ConnectionState } from '$lib/authoring-retry';
	import { describeHistoryEntry, describeOperation, explainError } from '$lib/authoring-presenter';
	import { autosize } from '$lib/autosize';
	import { layoutFor, marginlessLayouts } from '$lib/layout';
	import { sameScreenplayText } from '$lib/screenplay-text';

	/** Until the product has a name and mark, the identity slot holds this neutral wordmark. */
	const appName = 'Studio';
	const cuts = [
		{ id: authoringFixtureIds.featureVersion, label: 'Feature' },
		{ id: authoringFixtureIds.trailerVersion, label: 'Trailer' }
	];
	const cutLabels: Record<string, string> = Object.fromEntries(
		cuts.map((cut) => [cut.id, cut.label])
	);

	type SaveState = { text: string; tone?: 'success' | 'attention'; action?: 'retry' | 'save' };

	let view = $state<ScreenplayView>();
	let elements = $state<ScreenplayElement[]>([]);
	let draft = $state<ScreenplayDraft>();
	let proposal = $state<ScreenplayProposal>();
	let proposalBaseElements = $state<ScreenplayElement[]>([]);
	let history = $state<readonly AuthoringChangeSet[]>([]);
	let selectedVersionId = $state<string>(authoringFixtureIds.featureVersion);
	let draftIds = $state<Record<string, string>>({});
	/* A transient outcome ("Changes accepted", an error) shown in the save state until the next edit. */
	let notice = $state<SaveState>();
	let busy = $state(false);
	let saving = $state(false);
	let dirty = $state(false);
	let reviewOpen = $state(false);
	let historyOpen = $state(false);
	let localElementCounter = 0;
	let connection = $state<ConnectionState>({ kind: 'ready' });
	let retryAction = $state<(() => Promise<void>) | undefined>();
	let activeAction: (() => Promise<void>) | undefined;
	let proposalAttemptId: string | undefined;
	/* Screenplay text at each history revision, per cut. Revisions are immutable, so entries never go stale. */
	let revisionTexts = $state<Record<string, readonly ScreenplayElement[] | null>>({});
	let revisionTextsFailed = $state(false);
	let restoreTarget = $state<number | undefined>();
	let cutMenuOpen = $state(false);
	let cutButton = $state<HTMLButtonElement>();
	let cutMenu = $state<HTMLDivElement>();

	/* Layout comes only from the root sensor through layoutFor (STUDIO_DESIGN_SYSTEM.md). */
	let capacity = $state<GlyphCapacityValue>(emptyGlyphCapacityValue);
	let fontsReady = $state(false);
	const layout = $derived(
		fontsReady && capacity.text.maxChars > 0
			? layoutFor({
					maxChars: capacity.text.maxChars,
					maxLines: capacity.text.maxLines,
					pixelLandscape: capacity.orientations.pixelLandscape
				})
			: undefined
	);
	const marginless = $derived(!!layout && marginlessLayouts.includes(layout));

	const revisionKey = (versionId: string, revision: number) => `${versionId}@${revision}`;
	const scope = $derived<DocumentVersionScope>({
		documentId: authoringFixtureIds.primaryDocument,
		versionId: selectedVersionId
	});
	const pendingProposal = $derived(proposal?.status === 'pending' ? proposal : undefined);
	const cutLabel = $derived(view?.versionLabel ?? cutLabels[selectedVersionId]);
	const historyNewestFirst = $derived([...history].reverse());

	/* The only place the document's save state appears (STUDIO_DESIGN_SYSTEM.md § State and vocabulary). */
	const saveState = $derived.by<SaveState | undefined>(() => {
		if (connection.kind === 'retrying') return { text: 'Reconnecting…' };
		if (connection.kind === 'unavailable')
			return {
				/* A specific outcome ("Changes accepted · couldn’t refresh") beats the generic one. */
				text:
					notice?.text ??
					(connection.reason === 'unknown'
						? 'Couldn’t confirm the last change'
						: dirty
							? 'Not saved'
							: 'Can’t reach Studio'),
				tone: 'attention',
				action: 'retry'
			};
		if (!view)
			return busy
				? { text: 'Opening…' }
				: { text: 'Couldn’t open the screenplay', tone: 'attention', action: 'retry' };
		if (notice) return notice;
		if (saving) return { text: 'Saving…' };
		/* Saving stays manual until autosave (Phase 3); the save action lives in the save state. */
		if (dirty) return { text: 'Unsaved changes', action: 'save' };
		if (draft) return { text: 'Saved' };
		return undefined;
	});

	onMount(() => {
		const unsubscribe = onAuthoringConnectionState((state) => {
			connection = state;
			if (state.kind === 'unavailable' && activeAction) retryAction = activeAction;
		});
		/* Measurements are final only once the bundled faces have loaded. */
		void document.fonts.ready.then(() => (fontsReady = true));
		void openVersion(selectedVersionId);
		/* Never lose typed text: warn before leaving while edits are not saved (review U2). */
		const guardUnsaved = (event: BeforeUnloadEvent) => {
			if (!dirty) return;
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', guardUnsaved);
		return () => {
			unsubscribe();
			window.removeEventListener('beforeunload', guardUnsaved);
		};
	});

	/* Close the cut menu on any press outside it. */
	$effect(() => {
		if (!cutMenuOpen) return;
		const close = (event: PointerEvent) => {
			const target = event.target as Node;
			if (!cutMenu?.contains(target) && !cutButton?.contains(target)) cutMenuOpen = false;
		};
		window.addEventListener('pointerdown', close);
		return () => window.removeEventListener('pointerdown', close);
	});

	function failureNotice(error: unknown) {
		/* Transient failures are already shown by the connection state; don't repeat them. */
		if (error instanceof AuthoringRequestError && error.transient) return;
		console.error(error);
		notice = { text: 'Something went wrong', tone: 'attention' };
	}

	async function perform(action: () => Promise<void>) {
		activeAction = action;
		retryAction = undefined;
		busy = true;
		try {
			await action();
			if (connection.kind !== 'unavailable' && retryAction === action) retryAction = undefined;
		} catch (error) {
			failureNotice(error);
			if (error instanceof AuthoringRequestError && error.transient)
				retryAction = activeAction ?? action;
		} finally {
			activeAction = undefined;
			busy = false;
			saving = false;
		}
	}

	async function retryNow() {
		authorizeManualAuthoringRetry();
		if (retryAction) await perform(retryAction);
		else await openVersion(selectedVersionId);
	}

	/* Switching cut saves unsaved edits first; if they cannot be saved, stay on this cut (review U2). */
	async function switchVersion(versionId: string) {
		if (versionId === selectedVersionId) return;
		if (dirty) {
			await saveDraft();
			if (dirty) return;
		}
		restoreTarget = undefined;
		await openVersion(versionId);
	}

	async function openCutMenu() {
		cutMenuOpen = true;
		await tick();
		cutMenu?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
	}

	function closeCutMenu() {
		cutMenuOpen = false;
		cutButton?.focus();
	}

	function chooseCut(versionId: string) {
		closeCutMenu();
		void perform(() => switchVersion(versionId));
	}

	function cutMenuKeydown(event: KeyboardEvent) {
		const items = [...(cutMenu?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
		const index = items.indexOf(document.activeElement as HTMLElement);
		if (event.key === 'Escape' || event.key === 'Tab') {
			event.preventDefault();
			closeCutMenu();
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const step = event.key === 'ArrowDown' ? 1 : -1;
			items[(index + step + items.length) % items.length]?.focus();
		} else if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
		}
	}

	async function loadRevisionTexts() {
		if (!historyOpen) return;
		const versionId = selectedVersionId;
		const versionScope = { documentId: authoringFixtureIds.primaryDocument, versionId };
		const revisions = [0, ...history.map((changeSet) => changeSet.resultingRevision)];
		const missing = revisions.filter(
			(revision) => !(revisionKey(versionId, revision) in revisionTexts)
		);
		if (missing.length === 0) return;
		try {
			const loaded = await Promise.all(
				missing.map(
					async (revision) =>
						[
							revision,
							(
								await authoringApplication.getScreenplayView(
									authoringFixtureIds.project,
									versionScope,
									revision
								)
							)?.elements ?? null
						] as const
				)
			);
			const next = { ...revisionTexts };
			for (const [revision, texts] of loaded) next[revisionKey(versionId, revision)] = texts;
			revisionTexts = next;
			revisionTextsFailed = false;
		} catch {
			revisionTextsFailed = true;
		}
	}

	function revisionText(revision: number) {
		return revisionTexts[revisionKey(selectedVersionId, revision)];
	}

	/* Restore is offered only when it would change the current text (review U5). */
	function isCurrentText(revision: number) {
		const texts = revisionText(revision);
		return !!texts && !!view && sameScreenplayText(texts, view.elements);
	}

	function historyEntry(changeSet: AuthoringChangeSet) {
		return describeHistoryEntry(changeSet, {
			viewedVersionId: selectedVersionId,
			cutLabels,
			baseElements: revisionText(changeSet.baseRevision) ?? undefined
		});
	}

	function revisionTitle(revision: number) {
		if (revision === 0) return 'Initial screenplay';
		const changeSet = history.find((item) => item.resultingRevision === revision);
		if (!changeSet) return 'Earlier version';
		const entry = historyEntry(changeSet);
		return `${entry.summary} · ${entry.when}`;
	}

	function toggleHistory() {
		historyOpen = !historyOpen;
		restoreTarget = undefined;
		if (historyOpen) {
			reviewOpen = false;
			void loadRevisionTexts();
		}
	}

	async function openVersion(versionId: string) {
		busy = true;
		try {
			const nextScope = { documentId: authoringFixtureIds.primaryDocument, versionId };
			const projectId = authoringFixtureIds.project;
			const [nextView, drafts, proposals, nextHistory] = await Promise.all([
				authoringApplication.getScreenplayView(projectId, nextScope),
				authoringApplication.listDrafts(projectId),
				authoringApplication.listProposals(projectId),
				authoringApplication.listHistory(projectId)
			]);
			selectedVersionId = versionId;
			proposal = undefined;
			proposalBaseElements = [];
			reviewOpen = false;
			view = nextView;
			const consumed = new Set(
				proposals.filter((item) => item.status === 'accepted').map((item) => item.source.ref.id)
			);
			const matching = drafts
				.filter(
					(item) =>
						item.scope.documentId === nextScope.documentId &&
						item.scope.versionId === nextScope.versionId &&
						!consumed.has(item.id)
				)
				.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
			draft = matching.find((item) => item.id === draftIds[versionId]) ?? matching[0];
			if (draft) draftIds = { ...draftIds, [versionId]: draft.id };
			const pending = proposals
				.filter(
					(item) =>
						item.status === 'pending' &&
						item.scope.documentId === nextScope.documentId &&
						item.scope.versionId === nextScope.versionId &&
						(!draft || item.source.ref.id === draft.id)
				)
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
			proposal = pending[0];
			if (proposal) {
				proposalBaseElements =
					(
						await authoringApplication.getScreenplayView(
							projectId,
							proposal.scope,
							proposal.baseProjectRevision
						)
					)?.elements.map((element) => ({ ...element })) ?? [];
				reviewOpen = true;
				historyOpen = false;
			}
			elements = (draft?.elements ?? view?.elements ?? []).map((element) => ({ ...element }));
			dirty = false;
			notice =
				!proposal && draft && view && draft.baseDocumentVersion !== view.documentVersion
					? { text: 'Saved · the screenplay changed since you started', tone: 'attention' }
					: undefined;
			history = nextHistory;
			void loadRevisionTexts();
		} catch (error) {
			failureNotice(error);
			if (error instanceof AuthoringRequestError && error.transient)
				retryAction = () => openVersion(versionId);
		} finally {
			busy = false;
		}
	}

	function edited() {
		proposalAttemptId = undefined;
		dirty = true;
		notice = undefined;
		proposal = undefined;
	}

	function updateText(elementId: string, text: string) {
		elements = elements.map((element) =>
			element.id === elementId ? { ...element, text } : element
		);
		edited();
	}

	function moveElement(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= elements.length) return;
		const reordered = [...elements];
		[reordered[index], reordered[target]] = [reordered[target], reordered[index]];
		elements = reordered;
		edited();
	}

	function removeElement(elementId: string) {
		elements = elements.filter((element) => element.id !== elementId);
		edited();
	}

	function addAction() {
		localElementCounter += 1;
		elements = [
			...elements,
			{
				id: `element:studio-action-${Date.now()}-${localElementCounter}`,
				kind: 'action',
				text: 'New action.'
			}
		];
		edited();
	}

	async function saveDraft() {
		if (!view) return;
		busy = true;
		saving = true;
		const result = await authoringApplication.handle(
			{
				type: 'SaveDraft',
				projectId: authoringFixtureIds.project,
				...(draft ? { draftId: draft.id } : {}),
				scope,
				baseProjectRevision: draft?.baseProjectRevision ?? view.projectRevision,
				baseDocumentVersion: draft?.baseDocumentVersion ?? view.documentVersion,
				elements
			},
			studioAuthoringContext
		);
		saving = false;
		if (result.ok && result.kind === 'draft-saved') {
			draft = result.draft;
			draftIds[selectedVersionId] = draft.id;
			draftIds = { ...draftIds };
			dirty = false;
			notice = undefined;
		} else if (!result.ok)
			notice = { text: `Not saved: ${explainError(result.error)}`, tone: 'attention' };
		busy = false;
	}

	async function proposeChanges() {
		if (dirty || !draft) await saveDraft();
		if (!draft || dirty) return;
		busy = true;
		proposalAttemptId ??= `proposal:${crypto.randomUUID()}`;
		const result = await authoringApplication.handle(
			{
				type: 'CreateProposal',
				projectId: authoringFixtureIds.project,
				draftId: draft.id,
				proposalId: proposalAttemptId,
				expectedDraftUpdatedAt: draft.updatedAt
			},
			studioAuthoringContext
		);
		if (result.ok && result.kind === 'proposal-created') {
			proposalAttemptId = undefined;
			proposal = result.proposal;
			reviewOpen = true;
			historyOpen = false;
			notice = undefined;
			const refresh = async () => {
				activeAction = refresh;
				try {
					proposalBaseElements =
						(
							await authoringApplication.getScreenplayView(
								authoringFixtureIds.project,
								result.proposal.scope,
								result.proposal.baseProjectRevision
							)
						)?.elements.map((element) => ({ ...element })) ?? [];
					notice = undefined;
					retryAction = undefined;
				} catch {
					notice = { text: 'Review ready · couldn’t load the comparison', tone: 'attention' };
					retryAction = refresh;
				}
			};
			await refresh();
		} else if (!result.ok)
			notice = { text: `Can’t review: ${explainError(result.error)}`, tone: 'attention' };
		busy = false;
	}

	async function rejectProposal() {
		if (!pendingProposal) return;
		busy = true;
		const result = await authoringApplication.handle(
			{
				type: 'RejectProposal',
				projectId: authoringFixtureIds.project,
				proposalId: pendingProposal.id,
				reason: 'Rejected in Write review'
			},
			studioAuthoringContext
		);
		if (result.ok && result.kind === 'proposal-rejected') {
			proposal = result.proposal;
			notice = { text: 'Rejected · the screenplay is unchanged' };
		} else if (!result.ok)
			notice = { text: `Couldn’t reject: ${explainError(result.error)}`, tone: 'attention' };
		busy = false;
	}

	async function refreshCommitted(message: string, versionId: string) {
		const refresh = async () => {
			activeAction = refresh;
			try {
				const nextScope = { documentId: authoringFixtureIds.primaryDocument, versionId };
				const [nextView, nextHistory] = await Promise.all([
					authoringApplication.getScreenplayView(authoringFixtureIds.project, nextScope),
					authoringApplication.listHistory(authoringFixtureIds.project)
				]);
				view = nextView;
				elements = nextView?.elements.map((element) => ({ ...element })) ?? [];
				history = nextHistory;
				draft = undefined;
				proposal = undefined;
				proposalBaseElements = [];
				reviewOpen = false;
				delete draftIds[versionId];
				draftIds = { ...draftIds };
				dirty = false;
				notice = { text: message, tone: 'success' };
				retryAction = undefined;
				void loadRevisionTexts();
			} catch {
				notice = { text: `${message} · couldn’t refresh`, tone: 'attention' };
				retryAction = refresh;
			}
		};
		await refresh();
	}

	async function acceptProposal() {
		if (!pendingProposal) return;
		busy = true;
		const result = await authoringApplication.handle(
			{
				type: 'AcceptProposal',
				projectId: authoringFixtureIds.project,
				proposalId: pendingProposal.id
			},
			studioAuthoringContext
		);
		if (result.ok && result.kind === 'proposal-accepted') {
			proposal = undefined;
			reviewOpen = false;
			await refreshCommitted('Changes accepted', selectedVersionId);
		} else if (!result.ok)
			notice = { text: `Couldn’t accept: ${explainError(result.error)}`, tone: 'attention' };
		busy = false;
	}

	async function restoreRevision(targetRevision: number) {
		if (!view) return;
		busy = true;
		const result = await authoringApplication.handle(
			{
				type: 'RestoreScreenplay',
				projectId: authoringFixtureIds.project,
				scope,
				targetRevision,
				expectedDocumentVersion: view.documentVersion,
				intent: `Restore ${view.documentTitle} — ${view.versionLabel}`
			},
			studioAuthoringContext
		);
		if (result.ok && result.kind === 'screenplay-restored') {
			restoreTarget = undefined;
			proposal = undefined;
			reviewOpen = false;
			await refreshCommitted('Restored', selectedVersionId);
		} else if (!result.ok)
			notice = { text: `Couldn’t restore: ${explainError(result.error)}`, tone: 'attention' };
		busy = false;
	}
</script>

<svelte:head
	><title>{view ? `${view.documentTitle} · ${cutLabel} — ${appName}` : appName}</title></svelte:head
>

<GlyphCapacitySensor class="app-root" bind:value={capacity}>
	<div
		class="shell"
		data-layout={layout}
		data-capacity={capacity.text.maxChars > 0
			? `${capacity.text.maxChars}x${capacity.text.maxLines}`
			: undefined}
	>
		<header class="app-bar">
			<a class="identity" href="/" aria-label={`${appName} home`}>
				<svg class="mark" viewBox="0 0 16 16" aria-hidden="true"
					><path
						d="M8 1.5 14.5 8 8 14.5 1.5 8Z"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					/></svg
				>
				<span class="wordmark">{appName}</span>
			</a>

			<nav class="breadcrumb" aria-label="Location">
				{#if view}
					<span class="crumb crumb-project">{view.projectName}</span>
					<span class="separator" aria-hidden="true">/</span>
					<span class="crumb crumb-document">{view.documentTitle}</span>
					<span class="separator" aria-hidden="true">·</span>
				{/if}
				<span class="cut-switcher">
					<button
						bind:this={cutButton}
						class="cut-button"
						aria-haspopup="menu"
						aria-expanded={cutMenuOpen}
						aria-label={`Cut: ${cutLabel}`}
						disabled={busy}
						onclick={() => (cutMenuOpen ? closeCutMenu() : openCutMenu())}
						onkeydown={(event) => {
							if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !cutMenuOpen) {
								event.preventDefault();
								void openCutMenu();
							}
						}}>{cutLabel}<span class="caret" aria-hidden="true">▾</span></button
					>
					{#if cutMenuOpen}
						<div
							bind:this={cutMenu}
							class="menu"
							role="menu"
							aria-label="Cut"
							tabindex="-1"
							onkeydown={cutMenuKeydown}
						>
							{#each cuts as cut (cut.id)}
								<button
									role="menuitemradio"
									aria-checked={cut.id === selectedVersionId}
									tabindex="-1"
									onclick={() => chooseCut(cut.id)}>{cut.label}</button
								>
							{/each}
						</div>
					{/if}
				</span>
			</nav>

			<p class="save-state" role="status" data-tone={saveState?.tone}>
				{#if saveState}
					<span>{saveState.text}</span>
					{#if saveState.action === 'retry'}
						<button class="link" onclick={retryNow} disabled={busy}>Retry</button>
					{:else if saveState.action === 'save'}
						<button class="link" onclick={() => perform(saveDraft)} disabled={busy}>Save</button>
					{/if}
				{/if}
			</p>

			<div class="actions">
				<button class:active={historyOpen} aria-pressed={historyOpen} onclick={toggleHistory}
					>History</button
				>
				{#if pendingProposal && !dirty}
					<!-- A proposal is already waiting: reopen it instead of creating another (review U6). -->
					<button
						class:active={reviewOpen}
						aria-pressed={reviewOpen}
						onclick={() => {
							reviewOpen = true;
							historyOpen = false;
						}}>Open review</button
					>
				{:else}
					<button
						class="primary"
						disabled={busy || (!draft && !dirty)}
						aria-label="Review changes"
						onclick={() => perform(proposeChanges)}
						><span class="label-long">Review changes</span><span class="label-short">Review</span
						></button
					>
				{/if}
			</div>
		</header>

		<div class="body">
			<main class="workspace" aria-busy={busy}>
				<div class="document" class:marginless>
					{#if view}
						<p class="running-header">{view.documentTitle} · {cutLabel}</p>
					{/if}
					<article class="page" aria-label="Screenplay">
						{#each elements as element, index (element.id)}
							<div
								class="element"
								class:scene-heading={element.kind === 'scene-heading'}
								class:action={element.kind === 'action'}
								class:character={element.kind === 'character'}
								class:dialogue={element.kind === 'dialogue'}
							>
								<textarea
									disabled={busy}
									aria-label={element.kind}
									rows="1"
									value={element.text}
									use:autosize={element.text}
									oninput={(event) => updateText(element.id, event.currentTarget.value)}></textarea>
								<div class="element-actions">
									<button
										aria-label="Move up"
										disabled={busy || index === 0}
										onclick={() => moveElement(index, -1)}>↑</button
									>
									<button
										aria-label="Move down"
										disabled={busy || index === elements.length - 1}
										onclick={() => moveElement(index, 1)}>↓</button
									>
									<button
										aria-label="Remove element"
										disabled={busy}
										onclick={() => removeElement(element.id)}>Remove</button
									>
								</div>
							</div>
						{/each}
						<button class="add-action" disabled={busy || !view} onclick={addAction}>+ Action</button
						>
					</article>
				</div>
			</main>

			{#if reviewOpen}
				<aside class="panel" aria-label="Changes to review">
					<div class="panel-head">
						<h2>Review changes</h2>
						<button onclick={() => (reviewOpen = false)}>Close</button>
					</div>
					{#if proposal}
						<p class="eyebrow">
							{proposal.status === 'pending'
								? 'Waiting for your review'
								: proposal.status === 'accepted'
									? 'Accepted'
									: 'Rejected'}
						</p>
						<h3>
							{proposal.operations.length} screenplay change{proposal.operations.length === 1
								? ''
								: 's'}
						</h3>
						<ul class="change-list">
							{#each proposal.operations as operation, index (index)}
								{@const review = describeOperation(operation, proposalBaseElements)}
								<li>
									<strong>{review.title}</strong>
									{#if review.before}
										<span class="review-label">Before</span>
										<blockquote>{review.before}</blockquote>
									{/if}
									{#if review.after}
										<span class="review-label">After</span>
										<blockquote>{review.after}</blockquote>
									{/if}
									{#if review.detail}<small>{review.detail}</small>{/if}
								</li>
							{/each}
						</ul>
						<p class="hint">Nothing changes in the screenplay until you accept.</p>
						{#if pendingProposal}
							<div class="panel-actions">
								<button onclick={() => perform(rejectProposal)}>Reject</button>
								<button class="primary" onclick={() => perform(acceptProposal)}
									>Accept changes</button
								>
							</div>
						{/if}
					{:else}
						<p class="hint">Save your changes, then review them here.</p>
					{/if}
				</aside>
			{:else if historyOpen}
				<aside class="panel" aria-label="History">
					<div class="panel-head">
						<h2>History</h2>
						<button onclick={() => (historyOpen = false)}>Close</button>
					</div>
					{#if restoreTarget !== undefined}
						{@const target = restoreTarget}
						<!-- Restore shows the text it will bring back and asks first (review U5). -->
						<section class="restore-preview" aria-label="Restore preview">
							<p class="eyebrow">Restore preview</p>
							<h3>{revisionTitle(target)}</h3>
							<ol class="preview-text">
								{#each revisionText(target) ?? [] as element (element.id)}
									<li
										class:scene-heading={element.kind === 'scene-heading'}
										class:character={element.kind === 'character'}
										class:dialogue={element.kind === 'dialogue'}
									>
										{element.text}
									</li>
								{/each}
							</ol>
							<p class="hint">
								Restoring replaces the current {cutLabel} text with this version. It is added to history;
								nothing is deleted.
							</p>
							{#if dirty || draft}
								<p class="caution">Your edits that have not been accepted will be replaced.</p>
							{/if}
							<div class="panel-actions">
								<button onclick={() => (restoreTarget = undefined)}>Cancel</button>
								<button class="primary" onclick={() => perform(() => restoreRevision(target))}
									>Restore this version</button
								>
							</div>
						</section>
					{:else}
						<p class="hint">Restoring affects only the {cutLabel} cut and nothing is deleted.</p>
						{#if revisionTextsFailed}
							<p class="hint">
								Couldn’t load earlier versions.
								<button class="link" onclick={loadRevisionTexts}>Retry</button>
							</p>
						{/if}
						<ol class="history-list">
							{#snippet restoreControl(revision: number)}
								{#if isCurrentText(revision)}
									<span class="current-tag">Current text</span>
								{:else if revisionText(revision)}
									<button class="link" onclick={() => (restoreTarget = revision)}>Restore…</button>
								{/if}
							{/snippet}
							{#each historyNewestFirst as changeSet (changeSet.id)}
								{@const entry = historyEntry(changeSet)}
								<li>
									<div>
										<span class="entry-meta">{entry.who} · {entry.when}</span>
										<span class="entry-summary">{entry.summary}</span>
									</div>
									{@render restoreControl(changeSet.resultingRevision)}
								</li>
							{/each}
							<li>
								<div><span class="entry-summary">Initial screenplay</span></div>
								{@render restoreControl(0)}
							</li>
						</ol>
					{/if}
				</aside>
			{/if}
		</div>
	</div>
</GlyphCapacitySensor>

<style>
	/* All sizes in rem (global) or ch/lh/em (local); px only for hairlines and shadows. */
	:global(.app-root) {
		position: fixed;
		inset: 0;
	}
	.shell {
		height: 100%;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
	}
	/* The user never sees a layout computed from no measurement or a fallback face. */
	.shell:not([data-layout]) {
		visibility: hidden;
	}

	/* ── Application bar ─────────────────────────────────────────────── */
	.app-bar {
		height: 2.75rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 0.75rem;
		border-bottom: 1px solid var(--studio-hairline);
		background: var(--studio-bg);
		font-size: var(--studio-text-ui);
		min-width: 0;
	}
	.identity {
		flex: none;
		width: 6rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: var(--studio-target-min);
		color: var(--studio-text);
		text-decoration: none;
		font-weight: 650;
		letter-spacing: 0.01em;
	}
	.mark {
		width: 1.125rem;
		height: 1.125rem;
		flex: none;
	}
	.breadcrumb {
		flex: 0 1 auto;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		min-width: 0;
		color: var(--studio-text-muted);
	}
	.crumb {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}
	.crumb-document {
		color: var(--studio-text);
	}
	.separator {
		flex: none;
	}
	.cut-switcher {
		position: relative;
		flex: none;
	}
	.cut-button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 0;
		border-radius: var(--studio-radius-sm);
		background: transparent;
		color: var(--studio-text);
		padding: 0 0.375rem;
		cursor: pointer;
	}
	.cut-button:hover,
	.cut-button[aria-expanded='true'] {
		background: var(--studio-surface-subtle);
	}
	.caret {
		color: var(--studio-text-muted);
		font-size: var(--studio-text-xs);
	}
	.menu {
		position: absolute;
		z-index: 20;
		top: calc(100% + 0.25rem);
		left: 0;
		min-width: 9rem;
		display: flex;
		flex-direction: column;
		padding: 0.25rem;
		border: 1px solid var(--studio-hairline);
		border-radius: var(--studio-radius-md);
		background: var(--studio-surface);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
	}
	.menu button {
		text-align: left;
		border: 0;
		border-radius: var(--studio-radius-sm);
		background: transparent;
		padding: 0.375rem 0.625rem 0.375rem 1.5rem;
		cursor: pointer;
		position: relative;
		color: var(--studio-text);
	}
	.menu button:hover,
	.menu button:focus-visible {
		background: var(--studio-surface-subtle);
	}
	.menu button[aria-checked='true']::before {
		content: '✓';
		position: absolute;
		left: 0.5rem;
	}
	/* The save state gives up space first; the cut switcher and actions never shrink. */
	.save-state {
		margin: 0;
		flex: 0 100 auto;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--studio-text-muted);
		white-space: nowrap;
		overflow: hidden;
	}
	.save-state span {
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}
	.save-state button {
		flex: none;
	}
	.save-state[data-tone='success'] {
		color: var(--studio-success);
	}
	.save-state[data-tone='attention'] {
		color: var(--studio-text);
	}
	.actions {
		margin-left: auto;
		flex: none;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.actions button,
	.panel-head button,
	.panel-actions button:not(.primary) {
		border: 0;
		border-radius: var(--studio-radius-sm);
		background: transparent;
		color: var(--studio-text-muted);
		padding: 0 0.625rem;
		cursor: pointer;
	}
	.actions button {
		height: 2rem;
	}
	.actions button.active {
		color: var(--studio-text);
		background: var(--studio-surface-subtle);
	}
	button.primary {
		border: 0;
		color: var(--studio-on-accent);
		background: var(--studio-accent);
		border-radius: var(--studio-radius-sm);
		height: 2rem;
		padding: 0 0.75rem;
		cursor: pointer;
	}
	.actions button.primary {
		color: var(--studio-on-accent);
		background: var(--studio-accent);
	}
	button:disabled {
		opacity: 0.42;
		cursor: default;
	}
	button.link {
		border: 0;
		background: transparent;
		color: var(--studio-accent);
		padding: 0 0.25rem;
		cursor: pointer;
		white-space: nowrap;
	}

	/* ── Body: the document never moves when panels open ──────────── */
	.body {
		position: relative;
		min-height: 0;
	}
	.workspace {
		height: 100%;
		overflow: auto;
		padding: 2rem 1.5rem 4rem;
	}

	/* ── Screenplay page, in characters of the screenplay face ─────── */
	.document {
		font-family: var(--studio-font-screenplay);
		font-size: 1rem;
		width: 85ch;
		max-width: 100%;
		margin: 0 auto;
	}
	.running-header {
		margin: 0 0 0.75rem;
		font-family: var(--studio-font-ui);
		font-size: var(--studio-text-xs);
		color: var(--studio-text-muted);
	}
	.page {
		min-height: 66lh;
		background: var(--studio-surface);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.045);
		/* 85ch page: 15ch left and 10ch right margins leave the 60ch text measure. */
		padding: 6lh 10ch 6lh 15ch;
		line-height: 1;
	}
	.element {
		position: relative;
		width: 60ch;
		max-width: 100%;
		margin: 0 0 1lh;
	}
	.element.character {
		width: auto;
		margin: 0;
		padding-left: 22ch;
	}
	.element.dialogue {
		width: 35ch;
		margin-left: 10ch;
	}
	textarea {
		display: block;
		width: 100%;
		/* Elements grow with their text (autosize); no grips, nothing clipped (review U1, U4). */
		resize: none;
		overflow: hidden;
		border: 0;
		border-radius: var(--studio-radius-sm);
		background: transparent;
		color: var(--studio-text);
		font: inherit;
		line-height: inherit;
		padding: 0;
	}
	.scene-heading textarea {
		font-weight: 700;
		text-transform: uppercase;
	}
	.character textarea {
		text-transform: uppercase;
	}
	textarea:focus {
		outline: none;
	}
	textarea:focus-visible {
		outline: 2px solid var(--studio-focus);
		outline-offset: 0.25rem;
	}
	.element-actions {
		position: absolute;
		top: -0.25rem;
		left: calc(100% + 1ch);
		display: flex;
		gap: 0.125rem;
		opacity: 0;
		transition: opacity 0.12s ease;
	}
	.character .element-actions {
		left: calc(22ch + 12ch);
	}
	.element:focus-within .element-actions,
	.element:hover .element-actions {
		opacity: 1;
	}
	.element-actions button,
	.add-action {
		border: 0;
		background: transparent;
		color: var(--studio-text-muted);
		font-family: var(--studio-font-ui);
		font-size: var(--studio-text-ui);
		line-height: 1.2;
		cursor: pointer;
		padding: 0.25rem;
		white-space: nowrap;
	}
	.add-action {
		margin-top: 1lh;
		color: var(--studio-accent);
	}

	/* Below the size class that fits the page: no paper margins, indents compress. */
	.document.marginless {
		width: auto;
	}
	.marginless .page {
		min-height: 0;
		padding: 2lh 1rem 3lh;
	}
	.marginless .element,
	.marginless .element.dialogue {
		width: auto;
	}
	.marginless .element.character {
		padding-left: 40%;
	}
	.marginless .element.dialogue {
		margin-left: 15%;
		margin-right: 15%;
	}
	.marginless .element-actions {
		position: static;
		opacity: 1;
		justify-content: flex-end;
		margin-top: 0.25rem;
	}
	.marginless .element.character .element-actions {
		margin-left: -40%;
	}

	/* ── Panels float over the page edge; they never move it ──────── */
	.panel {
		position: absolute;
		z-index: 10;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(var(--studio-panel-width), 100%);
		overflow: auto;
		padding: 1rem 1.125rem 2rem;
		background: var(--studio-surface);
		border-left: 1px solid var(--studio-hairline);
		box-shadow: -8px 0 24px rgba(0, 0, 0, 0.08);
		font-size: var(--studio-text-ui);
	}
	[data-layout='wide'] .panel {
		box-shadow: none;
	}
	[data-layout='phone'] .panel,
	[data-layout='compact'] .panel {
		width: 100%;
		border-left: 0;
	}
	.panel-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.panel h2 {
		margin: 0;
		font-size: var(--studio-text-md);
	}
	.panel h3 {
		margin: 0.25rem 0 1rem;
		font-size: var(--studio-text-ui);
	}
	.panel-head button {
		height: 2rem;
	}
	.eyebrow {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--studio-text-muted);
		font-size: var(--studio-text-xs);
	}
	.hint {
		color: var(--studio-text-muted);
	}
	.change-list {
		padding: 0;
		list-style: none;
		margin: 0 0 1.125rem;
	}
	.change-list li {
		padding: 0.5625rem 0;
		border-top: 1px solid var(--studio-hairline);
	}
	.change-list strong,
	.change-list small,
	.review-label {
		display: block;
	}
	.review-label {
		margin-top: 0.625rem;
		font-size: var(--studio-text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--studio-text-muted);
	}
	.change-list blockquote {
		margin: 0.1875rem 0 0;
		padding: 0.4375rem 0.5625rem;
		background: var(--studio-surface-subtle);
		border-left: 2px solid var(--studio-hairline);
		font-family: var(--studio-font-screenplay);
		line-height: 1.4;
	}
	.change-list small {
		margin-top: 0.5rem;
		font-size: var(--studio-text-sm);
		color: var(--studio-text-muted);
	}
	.panel-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}
	.panel-actions button:not(.primary) {
		height: 2rem;
	}
	.history-list {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
	}
	.history-list li {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-top: 1px solid var(--studio-hairline);
	}
	.entry-meta {
		display: block;
		font-size: var(--studio-text-sm);
		color: var(--studio-text-muted);
	}
	.entry-summary {
		display: block;
	}
	.current-tag {
		color: var(--studio-text-muted);
		font-size: var(--studio-text-sm);
		white-space: nowrap;
	}
	.preview-text {
		list-style: none;
		margin: 0;
		padding: 0.75rem;
		max-height: 50vh;
		overflow: auto;
		background: var(--studio-surface-subtle);
		font-family: var(--studio-font-screenplay);
		font-size: var(--studio-text-sm);
		line-height: 1.45;
	}
	.preview-text li {
		margin: 0 0 0.75em;
		white-space: pre-wrap;
	}
	.preview-text .scene-heading {
		font-weight: 700;
		text-transform: uppercase;
	}
	.preview-text .character {
		text-align: center;
		margin-bottom: 0.1em;
	}
	.preview-text .dialogue {
		margin-inline: 12%;
	}
	.caution {
		color: var(--studio-text);
		background: var(--studio-notice);
		padding: 0.5rem 0.625rem;
		border-radius: var(--studio-radius-sm);
	}

	/* ── Narrow layouts: the bar keeps identity, location and save state ─ */
	[data-layout='phone'] .wordmark,
	[data-layout='compact'] .wordmark {
		display: none;
	}
	[data-layout='phone'] .identity,
	[data-layout='compact'] .identity {
		width: auto;
	}
	[data-layout='narrow'] .crumb-project,
	[data-layout='narrow'] .crumb-project + .separator,
	[data-layout='phone'] .crumb,
	[data-layout='phone'] .separator,
	[data-layout='compact'] .crumb,
	[data-layout='compact'] .separator,
	[data-layout='compact'] .running-header {
		display: none;
	}
	.label-short,
	[data-layout='phone'] .label-long,
	[data-layout='compact'] .label-long {
		display: none;
	}
	[data-layout='phone'] .label-short,
	[data-layout='compact'] .label-short {
		display: inline;
	}
	[data-layout='phone'] .app-bar,
	[data-layout='compact'] .app-bar {
		gap: 0.5rem;
		padding: 0 0.5rem;
	}
	[data-layout='phone'] .workspace,
	[data-layout='compact'] .workspace,
	[data-layout='narrow'] .workspace {
		padding: 1rem 0.75rem 3rem;
	}
</style>
