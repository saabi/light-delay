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
		studioAuthoringContext
	} from '$lib/authoring-client';
	import { describeOperation, draftSavedMessage } from '$lib/authoring-presenter';

	let view = $state<ScreenplayView>();
	let elements = $state<ScreenplayElement[]>([]);
	let draft = $state<ScreenplayDraft>();
	let proposal = $state<ScreenplayProposal>();
	let history = $state<readonly AuthoringChangeSet[]>([]);
	let selectedVersionId = $state<string>(authoringFixtureIds.featureVersion);
	let draftIds = $state<Record<string, string>>({});
	let status = $state('Opening screenplay…');
	let busy = $state(false);
	let dirty = $state(false);
	let reviewOpen = $state(false);
	let historyOpen = $state(false);
	let localElementCounter = 0;

	const scope = $derived<DocumentVersionScope>({
		documentId: authoringFixtureIds.primaryDocument,
		versionId: selectedVersionId
	});
	const pendingProposal = $derived(proposal?.status === 'pending' ? proposal : undefined);

	onMount(() => {
		void openVersion(selectedVersionId);
	});

	async function openVersion(versionId: string) {
		busy = true;
		selectedVersionId = versionId;
		proposal = undefined;
		reviewOpen = false;
		const nextScope = { documentId: authoringFixtureIds.primaryDocument, versionId };
		view = await authoringApplication.getScreenplayView(authoringFixtureIds.project, nextScope);
		const draftId = draftIds[versionId];
		draft = draftId
			? await authoringApplication.getDraft(authoringFixtureIds.project, draftId)
			: undefined;
		elements = (draft?.elements ?? view?.elements ?? []).map((element) => ({ ...element }));
		dirty = false;
		status = draft ? draftSavedMessage() : 'Authoritative screenplay';
		history = await authoringApplication.listHistory(authoringFixtureIds.project);
		busy = false;
	}

	function updateText(elementId: string, text: string) {
		elements = elements.map((element) =>
			element.id === elementId ? { ...element, text } : element
		);
		dirty = true;
		status = 'Unsaved Draft changes';
		proposal = undefined;
	}

	function moveElement(index: number, direction: -1 | 1) {
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
		elements = elements.filter((element) => element.id !== elementId);
		dirty = true;
		status = 'Unsaved Draft changes';
		proposal = undefined;
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
				baseProjectRevision: view.projectRevision,
				baseDocumentVersion: view.documentVersion,
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
		const result = await authoringApplication.handle(
			{
				type: 'CreateProposal',
				projectId: authoringFixtureIds.project,
				draftId: draft.id
			},
			studioAuthoringContext
		);
		if (result.ok && result.kind === 'proposal-created') {
			proposal = result.proposal;
			reviewOpen = true;
			status = 'Proposal ready for review — not yet accepted';
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
			status = `Accepted into project history as revision ${result.revision.number}`;
			proposal = await authoringApplication.getProposal(
				authoringFixtureIds.project,
				pendingProposal.id
			);
			draft = undefined;
			delete draftIds[selectedVersionId];
			draftIds = { ...draftIds };
			view = await authoringApplication.getScreenplayView(authoringFixtureIds.project, scope);
			elements = view?.elements.map((element) => ({ ...element })) ?? [];
			history = await authoringApplication.listHistory(authoringFixtureIds.project);
			dirty = false;
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
			view = await authoringApplication.getScreenplayView(authoringFixtureIds.project, scope);
			elements = view?.elements.map((element) => ({ ...element })) ?? [];
			draft = undefined;
			proposal = undefined;
			delete draftIds[selectedVersionId];
			draftIds = { ...draftIds };
			history = await authoringApplication.listHistory(authoringFixtureIds.project);
			dirty = false;
			status = `Restored as new project revision ${result.revision.number}`;
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
			<button class:active={historyOpen} onclick={() => (historyOpen = !historyOpen)}
				>History</button
			>
			<button class="primary" disabled={busy || (!draft && !dirty)} onclick={proposeChanges}
				>Review changes</button
			>
		</div>
	</header>

	<div class="subbar">
		<div class="version-switcher" aria-label="Story version">
			<button
				class:active={selectedVersionId === authoringFixtureIds.featureVersion}
				onclick={() => openVersion(authoringFixtureIds.featureVersion)}>Feature</button
			>
			<button
				class:active={selectedVersionId === authoringFixtureIds.trailerVersion}
				onclick={() => openVersion(authoringFixtureIds.trailerVersion)}>Trailer</button
			>
		</div>
		<p class:accepted={status.startsWith('Accepted') || status.startsWith('Restored')}>{status}</p>
		<button disabled={busy || !dirty} onclick={saveDraft}>Save Draft</button>
	</div>

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
							aria-label={element.kind}
							class:sceneHeading={element.kind === 'scene-heading'}
							rows={element.kind === 'action' ? 2 : 1}
							value={element.text}
							oninput={(event) => updateText(element.id, event.currentTarget.value)}></textarea>
						<div class="element-actions">
							<button
								aria-label="Move up"
								disabled={index === 0}
								onclick={() => moveElement(index, -1)}>↑</button
							>
							<button
								aria-label="Move down"
								disabled={index === elements.length - 1}
								onclick={() => moveElement(index, 1)}>↓</button
							>
							<button aria-label="Remove element" onclick={() => removeElement(element.id)}
								>Remove</button
							>
						</div>
					</div>
				{/each}
				<button class="add-action" onclick={addAction}>+ Action</button>
			</article>
			<footer>
				<span
					>{dirty
						? 'Draft has unsaved changes'
						: draft
							? 'Draft saved · provisional'
							: 'Authoritative projection'}</span
				>
				<span>In-memory M2 store · resets when this Studio process stops</span>
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
						{#each proposal.operations as operation}<li>{describeOperation(operation)}</li>{/each}
					</ul>
					<p class="hint">
						Source: deterministic local Draft comparison. Nothing changes in project history until
						you accept.
					</p>
					{#if pendingProposal}
						<div class="proposal-actions">
							<button onclick={rejectProposal}>Reject</button>
							<button class="primary" onclick={acceptProposal}>Accept changes</button>
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
				<p class="hint">
					Restore affects only this screenplay and cut. It appends a new project revision.
				</p>
				<ul class="history-list">
					<li>
						<span>Initial screenplay</span><button onclick={() => restoreRevision(0)}
							>Restore</button
						>
					</li>
					{#each history as changeSet}
						<li>
							<div>
								<strong>Revision {changeSet.resultingRevision}</strong><small
									>{changeSet.intent}</small
								>
							</div>
							<button onclick={() => restoreRevision(changeSet.resultingRevision)}>Restore</button>
						</li>
					{/each}
				</ul>
			</aside>
		{/if}
	</main>
</div>

<style>
	.shell {
		min-height: 100vh;
	}
	header {
		height: 48px;
		display: grid;
		grid-template-columns: minmax(240px, 1fr) auto minmax(240px, 1fr);
		align-items: center;
		padding: 0 18px;
		border-bottom: 1px solid var(--studio-hairline);
		background: rgba(247, 247, 245, 0.96);
		font-size: 12px;
	}
	.project {
		display: flex;
		gap: 10px;
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
		padding: 0 10px;
		cursor: pointer;
	}
	nav button.active {
		color: var(--studio-text);
		box-shadow: inset 0 -1px var(--studio-text);
	}
	.actions {
		justify-self: end;
		display: flex;
		align-items: center;
		gap: 4px;
		height: 100%;
	}
	button.primary {
		color: white;
		background: var(--studio-accent);
		border-radius: var(--studio-radius-sm);
		height: 30px;
		padding: 0 12px;
	}
	button:disabled {
		opacity: 0.42;
		cursor: default;
	}
	.subbar {
		min-height: 42px;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: 0 18px;
		border-bottom: 1px solid var(--studio-hairline);
		background: var(--studio-surface);
		font-size: 11px;
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
		gap: 3px;
	}
	.version-switcher button {
		border: 0;
		border-radius: var(--studio-radius-sm);
		background: transparent;
		padding: 6px 9px;
		color: var(--studio-text-muted);
		cursor: pointer;
	}
	.version-switcher button.active {
		background: var(--studio-surface-subtle);
		color: var(--studio-text);
	}
	main {
		min-height: calc(100vh - 90px);
		display: grid;
		grid-template-columns: 1fr;
	}
	main.withPanel {
		grid-template-columns: minmax(0, 1fr) var(--studio-panel-width);
	}
	.workspace {
		padding: 42px 56px 28px;
	}
	.document-meta {
		max-width: var(--studio-reading-width);
		margin: 0 auto 16px;
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: var(--studio-text-muted);
	}
	.page {
		max-width: var(--studio-reading-width);
		min-height: 70vh;
		margin: auto;
		background: var(--studio-surface);
		padding: 68px 84px 96px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.045);
		font-family: 'Courier Prime', 'Courier New', monospace;
		font-size: 15px;
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
		resize: vertical;
		overflow: hidden;
		border: 0;
		background: transparent;
		color: var(--studio-text);
		font: inherit;
		line-height: inherit;
		padding: 2px 0;
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
		background: linear-gradient(transparent calc(100% - 1px), var(--studio-hairline) 0);
	}
	.element-actions {
		position: absolute;
		left: calc(100% + 14px);
		top: 0;
		display: flex;
		gap: 2px;
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
		font:
			10px/1.2 Inter,
			sans-serif;
		cursor: pointer;
		padding: 4px;
		white-space: nowrap;
	}
	.add-action {
		margin-top: 18px;
		color: var(--studio-accent);
	}
	.workspace footer {
		max-width: var(--studio-reading-width);
		margin: 13px auto 0;
		display: flex;
		justify-content: space-between;
		font-size: 10px;
		color: var(--studio-text-muted);
	}
	aside {
		border-left: 1px solid var(--studio-hairline);
		background: var(--studio-surface);
		padding: 16px 18px;
		font-size: 12px;
	}
	.aside-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 26px;
	}
	.aside-head button {
		height: auto;
	}
	aside h2 {
		font-size: 15px;
		margin: 5px 0 18px;
	}
	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--studio-text-muted);
		font-size: 10px;
	}
	.change-list {
		padding: 0;
		list-style: none;
		margin: 0 0 18px;
	}
	.change-list li {
		padding: 9px 0;
		border-top: 1px solid var(--studio-hairline);
	}
	.proposal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 20px;
	}
	.proposal-actions button {
		border: 0;
		background: transparent;
		padding: 8px 11px;
		cursor: pointer;
	}
	.history-list {
		list-style: none;
		margin: 20px 0 0;
		padding: 0;
	}
	.history-list li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 0;
		border-top: 1px solid var(--studio-hairline);
	}
	.history-list small {
		display: block;
		margin-top: 4px;
		color: var(--studio-text-muted);
		line-height: 1.35;
	}
	.history-list button {
		border: 0;
		background: transparent;
		color: var(--studio-accent);
		cursor: pointer;
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
			gap: 8px;
		}
		.subbar p {
			grid-column: 1 / -1;
			grid-row: 2;
			padding-bottom: 8px;
		}
		.workspace {
			padding: 30px 16px;
		}
		.page {
			padding: 48px 32px;
		}
		main.withPanel {
			grid-template-columns: 1fr;
		}
		aside {
			position: fixed;
			right: 0;
			top: 90px;
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
			gap: 12px;
			flex-direction: column;
		}
	}
</style>
