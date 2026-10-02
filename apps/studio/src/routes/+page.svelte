<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		AuthoringChangeSet,
		DocumentVersionScope,
		ScreenplayDraft,
		ScreenplayElement,
		ScreenplayProposal
	} from '@light-delay/v2-core';
	import type { ScreenplayView } from '@light-delay/v2-core';
	import {
		authoringApplication,
		authoringFixtureIds,
		authorizeManualAuthoringRetry,
		onAuthoringConnectionState,
		studioAuthoringContext
	} from '$lib/authoring-client';
	import { AuthoringRequestError, type ConnectionState } from '$lib/authoring-retry';
	import { describeOperation, draftSavedMessage } from '$lib/authoring-presenter';
	import { autosize } from '$lib/autosize';
	import { sameScreenplayText } from '$lib/screenplay-text';

	let view = $state<ScreenplayView>();
	let elements = $state<ScreenplayElement[]>([]);
	let draft = $state<ScreenplayDraft>();
	let proposal = $state<ScreenplayProposal>();
	let proposalBaseElements = $state<ScreenplayElement[]>([]);
	let history = $state<readonly AuthoringChangeSet[]>([]);
	let selectedVersionId = $state<string>(authoringFixtureIds.featureVersion);
	let draftIds = $state<Record<string, string>>({});
	let status = $state('Opening screenplay…');
	let busy = $state(false);
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

	const revisionKey = (versionId: string, revision: number) => `${versionId}@${revision}`;
	const scope = $derived<DocumentVersionScope>({
		documentId: authoringFixtureIds.primaryDocument,
		versionId: selectedVersionId
	});
	const pendingProposal = $derived(proposal?.status === 'pending' ? proposal : undefined);

	onMount(() => {
		const unsubscribe = onAuthoringConnectionState((state) => {
			connection = state;
			if (state.kind === 'unavailable' && activeAction) retryAction = activeAction;
		});
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

	function toggleHistory() {
		historyOpen = !historyOpen;
		restoreTarget = undefined;
		if (historyOpen) {
			reviewOpen = false;
			void loadRevisionTexts();
		}
	}

	async function perform(action: () => Promise<void>) {
		activeAction = action;
		retryAction = undefined;
		busy = true;
		try {
			await action();
			if (connection.kind !== 'unavailable' && retryAction === action) retryAction = undefined;
		} catch (error) {
			status = error instanceof Error ? error.message : 'Studio request failed';
			if (error instanceof AuthoringRequestError && error.transient)
				retryAction = activeAction ?? action;
		} finally {
			activeAction = undefined;
			busy = false;
		}
	}

	async function retryNow() {
		authorizeManualAuthoringRetry();
		if (retryAction) await perform(retryAction);
		else await openVersion(selectedVersionId);
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
			}
			elements = (draft?.elements ?? view?.elements ?? []).map((element) => ({ ...element }));
			dirty = false;
			status = proposal
				? 'Proposal ready for review — not yet accepted'
				: draft && view && draft.baseDocumentVersion !== view.documentVersion
					? 'Draft saved · authoritative screenplay changed since this Draft started'
					: draft
						? draftSavedMessage()
						: 'Authoritative screenplay';
			history = nextHistory;
			void loadRevisionTexts();
		} catch (error) {
			status = error instanceof Error ? error.message : 'Could not load screenplay';
			if (error instanceof AuthoringRequestError && error.transient)
				retryAction = () => openVersion(versionId);
		} finally {
			busy = false;
		}
	}

	function updateText(elementId: string, text: string) {
		proposalAttemptId = undefined;
		elements = elements.map((element) =>
			element.id === elementId ? { ...element, text } : element
		);
		dirty = true;
		status = 'Unsaved Draft changes';
		proposal = undefined;
	}

	function moveElement(index: number, direction: -1 | 1) {
		proposalAttemptId = undefined;
		const target = index + direction;
		if (target < 0 || target >= elements.length) return;
		const reordered = [...elements];
		[reordered[index], reordered[target]] = [reordered[target], reordered[index]];
		elements = reordered;
		dirty = true;
		status = 'Unsaved Draft changes';
		proposal = undefined;
	}

	function removeElement(elementId: string) {
		proposalAttemptId = undefined;
		elements = elements.filter((element) => element.id !== elementId);
		dirty = true;
		status = 'Unsaved Draft changes';
		proposal = undefined;
	}

	function addAction() {
		proposalAttemptId = undefined;
		localElementCounter += 1;
		elements = [
			...elements,
			{
				id: `element:studio-action-${Date.now()}-${localElementCounter}`,
				kind: 'action',
				text: 'New action.'
			}
		];
		dirty = true;
		status = 'Unsaved Draft changes';
		proposal = undefined;
	}

	async function saveDraft() {
		if (!view) return;
		busy = true;
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
		if (result.ok && result.kind === 'draft-saved') {
			draft = result.draft;
			draftIds[selectedVersionId] = draft.id;
			draftIds = { ...draftIds };
			dirty = false;
			status = draftSavedMessage();
		} else if (!result.ok) status = result.error.message;
		busy = false;
	}

	async function proposeChanges() {
		if (dirty || !draft) await saveDraft();
		if (!draft) return;
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
			status = 'Proposal ready for review — not yet accepted';
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
					status = 'Proposal ready for review — not yet accepted';
					retryAction = undefined;
				} catch {
					status = 'Proposal created · Review refresh pending';
					retryAction = refresh;
				}
			};
			await refresh();
		} else if (!result.ok) status = result.error.message;
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
			status = 'Proposal rejected — authoritative screenplay unchanged';
		} else if (!result.ok) status = result.error.message;
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
				status = message;
				retryAction = undefined;
				void loadRevisionTexts();
			} catch {
				status = `${message} · Authoritative refresh pending`;
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
			await refreshCommitted(
				`Accepted into project history as revision ${result.revision.number}`,
				selectedVersionId
			);
		} else if (!result.ok) status = `Proposal not accepted: ${result.error.message}`;
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
			await refreshCommitted(
				`Restored as new project revision ${result.revision.number}`,
				selectedVersionId
			);
		} else if (!result.ok) status = `Restore not applied: ${result.error.message}`;
		busy = false;
	}
</script>

<svelte:head><title>Studio — Harbor Light</title></svelte:head>

<div class="shell">
	<header>
		<div class="project">
			<strong>{view?.projectName ?? 'Studio'}</strong><span>{view?.documentTitle}</span>
		</div>
		<nav aria-label="Workspace"><button class="active">Write</button></nav>
		<div class="actions">
			<button class:active={historyOpen} onclick={toggleHistory}>History</button>
			{#if pendingProposal && !dirty}
				<!-- A proposal is already waiting: reopen it instead of creating another (review U6). -->
				<button
					class:active={reviewOpen}
					onclick={() => {
						reviewOpen = true;
						historyOpen = false;
					}}>Open review</button
				>
			{:else}
				<button
					class="primary"
					disabled={busy || (!draft && !dirty)}
					onclick={() => perform(proposeChanges)}>Review changes</button
				>
			{/if}
		</div>
	</header>

	<div class="subbar">
		<div class="version-switcher" aria-label="Story version">
			<button
				class:active={selectedVersionId === authoringFixtureIds.featureVersion}
				disabled={busy}
				onclick={() => perform(() => switchVersion(authoringFixtureIds.featureVersion))}
				>Feature</button
			>
			<button
				class:active={selectedVersionId === authoringFixtureIds.trailerVersion}
				disabled={busy}
				onclick={() => perform(() => switchVersion(authoringFixtureIds.trailerVersion))}
				>Trailer</button
			>
		</div>
		<p class:accepted={status.startsWith('Accepted') || status.startsWith('Restored')}>{status}</p>
		{#if !view && !busy}<button onclick={() => openVersion(selectedVersionId)}>Retry</button>{/if}
		<button disabled={busy || !dirty} onclick={() => perform(saveDraft)}>Save Draft</button>
	</div>
	{#if connection.kind !== 'ready'}
		<!-- An overlay, so the notice never moves the document while typing (review U8). -->
		<div class="connection-warning" role="status">
			{connection.kind === 'retrying'
				? `Reconnecting… (attempt ${connection.attempt} of 3)`
				: connection.reason === 'busy'
					? 'Studio is busy. Unsaved changes are held in this tab until they save.'
					: connection.reason === 'unknown'
						? 'Couldn’t confirm the last save. Unsaved changes are held in this tab until they save.'
						: 'Database unavailable. Unsaved changes are held in this tab until they save.'}
			{#if connection.kind === 'unavailable'}
				<button onclick={retryNow} disabled={busy}>Retry now</button>
			{/if}
		</div>
	{/if}

	<main class:withPanel={reviewOpen || historyOpen}>
		<section class="workspace" aria-busy={busy}>
			<div class="document-meta">
				<span>Screenplay · {view?.versionLabel ?? ''} cut</span>
				<span>{view ? `Project revision ${view.projectRevision}` : ''}</span>
			</div>
			<article class="page" aria-label="Screenplay editor">
				{#each elements as element, index (element.id)}
					<div
						class="element"
						class:dialogue={element.kind === 'dialogue'}
						class:character={element.kind === 'character'}
					>
						<textarea
							disabled={busy}
							aria-label={element.kind}
							class:sceneHeading={element.kind === 'scene-heading'}
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
				<button class="add-action" disabled={busy} onclick={addAction}>+ Action</button>
			</article>
			<footer>
				<span
					>{dirty
						? 'Draft has unsaved changes'
						: draft
							? 'Draft saved · provisional'
							: 'Authoritative projection'}</span
				>
				<span>Studio Write</span>
			</footer>
		</section>

		{#if reviewOpen}
			<aside aria-label="Proposal review">
				<div class="aside-head">
					<strong>Proposal</strong><button onclick={() => (reviewOpen = false)}>Close</button>
				</div>
				{#if proposal}
					<p class="eyebrow">{proposal.status}</p>
					<h2>
						{proposal.operations.length} screenplay change{proposal.operations.length === 1
							? ''
							: 's'}
					</h2>
					<ul class="change-list">
						{#each proposal.operations as operation}
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
					<p class="hint">
						Source: deterministic local Draft comparison. Nothing changes in project history until
						you accept.
					</p>
					{#if pendingProposal}
						<div class="proposal-actions">
							<button onclick={() => perform(rejectProposal)}>Reject</button>
							<button class="primary" onclick={() => perform(acceptProposal)}>Accept changes</button
							>
						</div>
					{/if}
				{:else}
					<p>Save a Draft, then review its semantic screenplay changes here.</p>
				{/if}
			</aside>
		{:else if historyOpen}
			<aside aria-label="Project history">
				<div class="aside-head">
					<strong>History</strong><button onclick={() => (historyOpen = false)}>Close</button>
				</div>
				{#if restoreTarget !== undefined}
					{@const target = restoreTarget}
					<!-- Restore shows the text it will bring back and asks first (review U5). -->
					<section class="restore-preview" aria-label="Restore preview">
						<p class="eyebrow">Restore preview</p>
						<h2>{target === 0 ? 'Initial screenplay' : `Revision ${target}`}</h2>
						<ol class="preview-text">
							{#each revisionText(target) ?? [] as element (element.id)}
								<li
									class:sceneHeading={element.kind === 'scene-heading'}
									class:character={element.kind === 'character'}
									class:dialogue={element.kind === 'dialogue'}
								>
									{element.text}
								</li>
							{/each}
						</ol>
						<p class="hint">
							Restoring replaces the current {view?.versionLabel ?? ''} text with this version. It is
							added to history; nothing is deleted.
						</p>
						{#if dirty || draft}
							<p class="caution">Your edits that have not been accepted will be replaced.</p>
						{/if}
						<div class="proposal-actions">
							<button onclick={() => (restoreTarget = undefined)}>Cancel</button>
							<button class="primary" onclick={() => perform(() => restoreRevision(target))}
								>Restore this version</button
							>
						</div>
					</section>
				{:else}
					<p class="hint">
						Restore affects only this screenplay and cut. It appends a new project revision.
					</p>
					{#if revisionTextsFailed}
						<p class="hint">
							Couldn’t load earlier versions.
							<button class="link" onclick={loadRevisionTexts}>Retry</button>
						</p>
					{/if}
					<ul class="history-list">
						{#snippet restoreControl(revision: number)}
							{#if isCurrentText(revision)}
								<span class="current-tag">Current text</span>
							{:else if revisionText(revision)}
								<button onclick={() => (restoreTarget = revision)}>Restore…</button>
							{/if}
						{/snippet}
						<li>
							<span>Initial screenplay</span>{@render restoreControl(0)}
						</li>
						{#each history as changeSet (changeSet.id)}
							<li>
								<div>
									<strong>Revision {changeSet.resultingRevision}</strong><small
										>{changeSet.intent}</small
									>
								</div>
								{@render restoreControl(changeSet.resultingRevision)}
							</li>
						{/each}
					</ul>
				{/if}
			</aside>
		{/if}
	</main>
</div>

<style>
	/* Sizes follow the type and target tokens in studio.css (review U7). */
	.connection-warning {
		position: fixed;
		z-index: 10;
		left: 50%;
		bottom: 1.25rem;
		transform: translateX(-50%);
		max-width: min(36rem, calc(100vw - 2rem));
		padding: 0.5rem 0.75rem 0.5rem 1rem;
		border-radius: var(--studio-radius-md);
		background: var(--studio-notice);
		color: var(--studio-text);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
		font-size: var(--studio-text-sm);
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.connection-warning button {
		border: 1px solid currentColor;
		border-radius: var(--studio-radius-sm);
		background: transparent;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.shell {
		min-height: 100vh;
	}
	header {
		height: 3rem;
		display: grid;
		grid-template-columns: minmax(15rem, 1fr) auto minmax(15rem, 1fr);
		align-items: center;
		padding: 0 1.125rem;
		border-bottom: 1px solid var(--studio-hairline);
		background: rgba(247, 247, 245, 0.96);
		font-size: var(--studio-text-ui);
	}
	.project {
		display: flex;
		gap: 0.625rem;
		align-items: baseline;
	}
	.project span,
	.hint {
		color: var(--studio-text-muted);
	}
	nav {
		height: 100%;
	}
	nav button,
	.actions button,
	.aside-head button {
		height: 100%;
		border: 0;
		background: transparent;
		color: var(--studio-text-muted);
		padding: 0 0.625rem;
		cursor: pointer;
	}
	nav button.active,
	.actions button.active {
		color: var(--studio-text);
		box-shadow: inset 0 -1px var(--studio-text);
	}
	.actions {
		justify-self: end;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		height: 100%;
	}
	button.primary {
		color: var(--studio-on-accent);
		background: var(--studio-accent);
		border-radius: var(--studio-radius-sm);
		height: 2rem;
		padding: 0 0.75rem;
	}
	.actions button.primary {
		height: 2rem;
		color: var(--studio-on-accent);
	}
	button:disabled {
		opacity: 0.42;
		cursor: default;
	}
	.subbar {
		min-height: 2.75rem;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: 0 1.125rem;
		border-bottom: 1px solid var(--studio-hairline);
		background: var(--studio-surface);
		font-size: var(--studio-text-sm);
	}
	.subbar > button {
		justify-self: end;
		border: 0;
		background: transparent;
		color: var(--studio-accent);
		cursor: pointer;
	}
	.subbar p {
		margin: 0;
		color: var(--studio-text-muted);
	}
	.subbar p.accepted {
		color: var(--studio-success);
	}
	.version-switcher {
		display: flex;
		gap: 0.1875rem;
	}
	.version-switcher button {
		border: 0;
		border-radius: var(--studio-radius-sm);
		background: transparent;
		padding: 0.375rem 0.5625rem;
		color: var(--studio-text-muted);
		cursor: pointer;
	}
	.version-switcher button.active {
		background: var(--studio-surface-subtle);
		color: var(--studio-text);
	}
	main {
		min-height: calc(100vh - 5.75rem);
		display: grid;
		grid-template-columns: 1fr;
	}
	main.withPanel {
		grid-template-columns: minmax(0, 1fr) var(--studio-panel-width);
	}
	.workspace {
		padding: 2.625rem 3.5rem 1.75rem;
	}
	.document-meta {
		max-width: var(--studio-reading-width);
		margin: 0 auto 1rem;
		display: flex;
		justify-content: space-between;
		font-size: var(--studio-text-xs);
		color: var(--studio-text-muted);
	}
	.page {
		max-width: var(--studio-reading-width);
		min-height: 70vh;
		margin: auto;
		background: var(--studio-surface);
		padding: 4.25rem 5.25rem 6rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.045);
		font-family: var(--studio-font-screenplay);
		font-size: var(--studio-text-md);
		line-height: 1.55;
	}
	.element {
		position: relative;
		margin: 0 0 1.35em;
	}
	.element.dialogue {
		width: 62%;
		margin: 0 auto 1.6em;
	}
	.element.character {
		width: 62%;
		margin: 1.6em auto 0.2em;
		text-align: center;
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
		padding: 0.125rem 0;
	}
	textarea.sceneHeading {
		font-weight: 700;
		text-transform: uppercase;
	}
	.character textarea {
		text-align: center;
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
		left: calc(100% + 0.875rem);
		top: 0;
		display: flex;
		gap: 0.125rem;
		opacity: 0;
		transition: opacity 0.12s ease;
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
		margin-top: 1.125rem;
		color: var(--studio-accent);
	}
	.workspace footer {
		max-width: var(--studio-reading-width);
		margin: 0.8125rem auto 0;
		display: flex;
		justify-content: space-between;
		font-size: var(--studio-text-xs);
		color: var(--studio-text-muted);
	}
	aside {
		border-left: 1px solid var(--studio-hairline);
		background: var(--studio-surface);
		padding: 1rem 1.125rem;
		font-size: var(--studio-text-ui);
	}
	.aside-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.625rem;
	}
	.aside-head button {
		height: auto;
	}
	aside h2 {
		font-size: var(--studio-text-md);
		margin: 0.3125rem 0 1.125rem;
	}
	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--studio-text-muted);
		font-size: var(--studio-text-xs);
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
	.proposal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}
	.proposal-actions button:not(.primary) {
		border: 0;
		background: transparent;
		padding: 0.5rem 0.6875rem;
		cursor: pointer;
	}
	.proposal-actions button.primary {
		border: 0;
		cursor: pointer;
	}
	.history-list {
		list-style: none;
		margin: 1.25rem 0 0;
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
	.history-list small {
		display: block;
		margin-top: 0.25rem;
		font-size: var(--studio-text-sm);
		color: var(--studio-text-muted);
		line-height: 1.35;
	}
	.history-list button,
	button.link {
		border: 0;
		background: transparent;
		color: var(--studio-accent);
		cursor: pointer;
		white-space: nowrap;
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
	.preview-text .sceneHeading {
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
	@media (max-width: 850px) {
		header {
			grid-template-columns: 1fr auto;
		}
		nav {
			display: none;
		}
		.subbar {
			grid-template-columns: 1fr auto;
			gap: 0.5rem;
		}
		.subbar p {
			grid-column: 1 / -1;
			grid-row: 2;
			padding-bottom: 0.5rem;
		}
		.workspace {
			padding: 1.875rem 1rem;
		}
		.page {
			padding: 3rem 2rem;
		}
		main.withPanel {
			grid-template-columns: 1fr;
		}
		aside {
			position: fixed;
			right: 0;
			top: 5.75rem;
			bottom: 0;
			width: min(88vw, var(--studio-panel-width));
			box-shadow: -8px 0 24px rgba(0, 0, 0, 0.08);
			overflow: auto;
		}
		.element-actions {
			position: static;
			opacity: 1;
			justify-content: flex-end;
		}
		.workspace footer {
			gap: 0.75rem;
			flex-direction: column;
		}
	}
</style>
