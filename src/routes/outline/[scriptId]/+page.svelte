<script lang="ts">
	import { page } from '$app/state';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import StoryLanguageNotice from '$lib/components/controls/StoryLanguageNotice.svelte';
	import OutlineFramingSection from '$lib/components/outline/OutlineFramingSection.svelte';
	import OutlineProseBlocks from '$lib/components/outline/OutlineProseBlocks.svelte';
	import {
		getLocalizedOutline,
		getProject,
		listLocalizedScripts,
		outlinePathForScript
	} from '$lib/data/repositories/index';
	import { storyText } from '$lib/data/selectors/localized';
	import {
		scriptKindLabel,
		scriptLabel,
		scriptStatusLabel
	} from '$lib/data/selectors/scriptPresentation';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { getLanguageState } from '$lib/state/language.svelte';
	import type {
		OutlineCoverageEvidence,
		OutlineStep,
		OutlineStorySection
	} from '$lib/types/outline';
	import type { StoryText } from '$lib/types/i18n';
	import { withLocale } from '$lib/utils/paths';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';

	const locale = getLocale();
	const language = $derived(getLanguageState());
	const registry = listLocalizedScripts(locale);
	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const entry = $derived(registry.find((item) => item.id === scriptId));
	const outline = $derived(getLocalizedOutline(scriptId, language.dialogueLanguage));
	const storySteps = $derived(
		outline
			? outline.steps.filter((step) => step.level === 'story').sort((a, b) => a.order - b.order)
			: []
	);
	const detailSteps = $derived(
		outline
			? outline.steps.filter((step) => step.level === 'detail').sort((a, b) => a.order - b.order)
			: []
	);
	const beforeFraming = $derived(
		(outline?.framing ?? [])
			.filter((section) => section.placement === 'before_story')
			.sort((a, b) => a.order - b.order)
	);
	const afterFraming = $derived(
		(outline?.framing ?? [])
			.filter((section) => section.placement === 'after_story')
			.sort((a, b) => a.order - b.order)
	);
	const storyGroups = $derived.by(() => {
		const sections = [...(outline?.storySections ?? [])].sort((a, b) => a.order - b.order);
		if (!sections.length)
			return [
				{
					id: 'outline-story-list',
					order: 1,
					title: undefined,
					steps: storySteps
				}
			];
		return sections.map((section) => ({
			...section,
			steps: storySteps.filter((step) => step.sectionId === section.id)
		}));
	});
	const byId = $derived(new Map(outline?.steps.map((step) => [step.id, step]) ?? []));
	const expectedPath = $derived(outlinePathForScript(scriptId));
	const scriptHref = $derived(withLocale(`/script/${encodeScriptId(scriptId)}`));
	const canonicalId = getProject().project.canonicalScriptId;

	function children(parentId: string) {
		return detailSteps.filter((step) => step.parentStepId === parentId);
	}
	function coverageLabel(value: string) {
		const labels: Record<string, () => string> = {
			not_started: m.outline_coverage_not_started,
			partial: m.outline_coverage_partial,
			covered: m.outline_coverage_covered,
			deferred: m.outline_coverage_deferred,
			not_applicable: m.outline_coverage_not_applicable
		};
		return (labels[value] ?? m.outline_coverage_not_started)();
	}
	function targetLabel(value: string) {
		return value === 'treatment'
			? m.outline_coverage_treatment()
			: value === 'script'
				? m.outline_coverage_script()
				: m.outline_coverage_animatic();
	}
	function outlineStatusLabel(value: 'draft' | 'reviewed' | 'locked') {
		return value === 'draft'
			? m.script_status_draft()
			: value === 'reviewed'
				? m.outline_file_status_reviewed()
				: m.outline_file_status_locked();
	}
	function evidenceIds(evidence: OutlineCoverageEvidence) {
		return [
			...(evidence.sceneIds ?? []),
			...(evidence.beatIds ?? []),
			...(evidence.cueIds ?? []),
			...(evidence.shotIds ?? [])
		];
	}
	function text(value: StoryText | undefined) {
		return storyText(value, language.dialogueLanguage);
	}
	function groupTitle(group: OutlineStorySection | { title?: StoryText }) {
		return group.title ? text(group.title) : m.outline_story();
	}
</script>

<main class="page">
	{#if outline}
		<PageHeader
			eyebrow={m.outline_eyebrow()}
			title={text(outline.outline.title)}
			lede={text(outline.outline.synopsis)}
			meta={[
				`v${outline.outline.version}`,
				entry ? scriptKindLabel(entry.kind) : scriptId,
				outlineStatusLabel(outline.outline.status),
				...(outline.storySections?.length
					? [`${outline.storySections.length} ${m.outline_story()}`]
					: []),
				`${storySteps.length} ${m.outline_story_beats()}`,
				...(detailSteps.length ? [`${detailSteps.length} ${m.outline_detail_steps()}`] : [])
			]}
		/>
		<StoryLanguageNotice />

		{#if outline.outline.editorialNotice}
			<aside class="editorial-notice" role="note">
				<strong>{outlineStatusLabel(outline.outline.status)}</strong>
				<p>{text(outline.outline.editorialNotice)}</p>
				{#if outline.outline.source}
					<p class="source">
						{m.outline_source()}: <code>{outline.outline.source.path}</code> ·
						{m.outline_source_revision({ revision: outline.outline.source.revision })}
					</p>
				{/if}
			</aside>
		{/if}

		{#if beforeFraming.length || afterFraming.length || outline.storySections?.length}
			<nav class="jump-nav" aria-label={m.outline_jump_navigation()}>
				{#if beforeFraming.length}<a href="#outline-context-before">{m.outline_context_before()}</a
					>{/if}
				{#each storyGroups as group (group.id)}
					<a href={`#${group.id}`}>{groupTitle(group)}</a>
				{/each}
				{#if afterFraming.length}<a href="#outline-context-after">{m.outline_context_after()}</a
					>{/if}
			</nav>
		{/if}

		{#if beforeFraming.length}
			<section class="outline-region" id="outline-context-before">
				<h2>{m.outline_context_before()}</h2>
				<div class="framing-list">
					{#each beforeFraming as section (section.id)}
						<OutlineFramingSection
							{section}
							language={language.dialogueLanguage}
							initiallyOpen={section.kind === 'purpose' || section.kind === 'premise'}
						/>
					{/each}
				</div>
			</section>
		{/if}

		<section class="outline-region story-region" id="outline-story">
			{#if detailSteps.length === 0}
				<p class="story-only" role="note">{m.outline_story_only()}</p>
			{/if}
			{#each storyGroups as group (group.id)}
				<section class="story-group" id={group.id}>
					<header class="group-header">
						<h2>{groupTitle(group)}</h2>
						<span>{m.outline_sequence_beats({ count: String(group.steps.length) })}</span>
					</header>
					<ol class="story-list">
						{#each group.steps as step (step.id)}
							{@const detail = children(step.id)}
							<li class="story-step" id={step.id}>
								<header class="step-header">
									<span>{step.order}</span>
									<h3>{text(step.title)}</h3>
								</header>
								{#if step.body}
									<OutlineProseBlocks blocks={step.body} language={language.dialogueLanguage} />
								{:else}
									<p class="summary">{text(step.summary)}</p>
								{/if}
								{#if step.causalLinks?.length}
									<div class="causes">
										<strong>{m.outline_why()}</strong>
										{#each step.causalLinks as link}
											<p>
												<a href={`#${link.sourceStepId}`}
													>{text(byId.get(link.sourceStepId)?.title ?? link.sourceStepId)}</a
												>: {text(link.explanation)}
											</p>
										{/each}
									</div>
								{/if}
								{#if detail.length}
									<details class="details">
										<summary>{m.outline_details_show({ count: String(detail.length) })}</summary>
										<ol>
											{#each detail as item (item.id)}
												<li id={item.id}>
													<h4><span>{item.order}</span> {text(item.title)}</h4>
													<p>{text(item.summary)}</p>
													{#if item.coverage}
														<div class="coverage" aria-label={m.outline_coverage()}>
															{#each Object.entries(item.coverage) as [target, evidence]}
																<span data-status={evidence.status}
																	>{targetLabel(target)}: {coverageLabel(evidence.status)}</span
																>
															{/each}
														</div>
													{/if}
													{#each Object.entries(item.coverage ?? {}) as [target, evidence]}
														{@const ids = evidenceIds(evidence)}
														{#if ids.length}
															<p class="refs">
																<strong>{targetLabel(target)} · {m.outline_evidence()}:</strong>
																{#each ids as id, index}
																	{index ? ', ' : ''}{#if id.includes(':scene-')}<a
																			href={`${scriptHref}#${id}`}>{id}</a
																		>{:else}{id}{/if}
																{/each}
															</p>
														{/if}
													{/each}
												</li>
											{/each}
										</ol>
									</details>
								{/if}
							</li>
						{/each}
					</ol>
				</section>
			{/each}
		</section>

		{#if afterFraming.length}
			<section class="outline-region" id="outline-context-after">
				<h2>{m.outline_context_after()}</h2>
				<div class="framing-list">
					{#each afterFraming as section (section.id)}
						<OutlineFramingSection {section} language={language.dialogueLanguage} />
					{/each}
				</div>
			</section>
		{/if}
	{:else}
		<PageHeader
			eyebrow={m.outline_eyebrow()}
			title={entry ? scriptLabel(entry) : m.outline_missing_title()}
			lede={m.outline_missing_lede()}
			meta={entry
				? [scriptKindLabel(entry.kind), scriptStatusLabel(entry.status), scriptId]
				: [scriptId || canonicalId]}
		/>
		<div class="missing" role="status">
			<p>{m.outline_missing_body({ path: expectedPath })}</p>
			<a href={scriptHref}>{m.outline_open_script()}</a>
		</div>
	{/if}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}
	.editorial-notice,
	.story-only {
		margin: 0 0 1.25rem;
		padding: 0.9rem 1rem;
		border: 1px solid color-mix(in srgb, var(--gold) 55%, var(--line));
		border-radius: 10px;
		background: color-mix(in srgb, var(--gold) 7%, var(--panel));
	}
	.editorial-notice p {
		margin: 0.35rem 0 0;
	}
	.editorial-notice strong {
		color: var(--gold);
		text-transform: uppercase;
		font: 750 0.72rem/1 var(--font-mono);
	}
	.source {
		color: var(--muted);
		font-size: 0.78rem;
		overflow-wrap: anywhere;
	}
	.jump-nav {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		gap: 0.45rem;
		overflow-x: auto;
		margin: 0 0 1.5rem;
		padding: 0.65rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: color-mix(in srgb, var(--panel) 94%, transparent);
		backdrop-filter: blur(12px);
	}
	.jump-nav a {
		flex: 0 0 auto;
		padding: 0.3rem 0.55rem;
		border-radius: 999px;
		color: var(--cyan);
		font-size: 0.8rem;
		text-decoration: none;
	}
	.jump-nav a:hover,
	.jump-nav a:focus-visible {
		background: var(--panel2);
		outline: 2px solid var(--cyan);
		outline-offset: 1px;
	}
	.outline-region,
	.story-group,
	.story-step {
		scroll-margin-top: 5.5rem;
	}
	.outline-region {
		margin-top: 2rem;
	}
	.outline-region > h2,
	.group-header h2 {
		font-family: var(--font-serif);
	}
	.framing-list {
		display: grid;
		gap: 0.75rem;
	}
	.story-only {
		color: var(--muted);
		font-size: 0.88rem;
	}
	.story-group + .story-group {
		margin-top: 2.5rem;
	}
	.group-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.9rem;
	}
	.group-header h2 {
		margin: 0;
	}
	.group-header span {
		color: var(--muted);
		font: 0.75rem/1 var(--font-mono);
		white-space: nowrap;
	}
	.story-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1.25rem;
	}
	.story-step {
		padding: 1.2rem 1.3rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--panel);
	}
	.step-header {
		display: flex;
		gap: 0.8rem;
		align-items: baseline;
	}
	.step-header span,
	h4 span {
		font: 700 0.8rem/1 var(--font-mono);
		color: var(--cyan);
	}
	h3 {
		margin: 0;
		font: 650 1.28rem/1.25 var(--font-serif);
	}
	.summary {
		max-width: 52rem;
		color: var(--text);
		font-size: 1.02rem;
	}
	.causes {
		margin: 0.9rem 0;
		padding: 0.75rem 0.9rem;
		border-left: 3px solid var(--gold);
		background: var(--panel2);
		color: var(--muted);
	}
	.causes p {
		margin: 0.35rem 0 0;
	}
	.causes a,
	.refs a,
	.missing a {
		color: var(--cyan);
	}
	.details {
		margin-top: 1rem;
		border-top: 1px solid var(--line);
		padding-top: 0.8rem;
	}
	.details > summary {
		cursor: pointer;
		color: var(--gold);
		font-weight: 650;
	}
	.details ol {
		list-style: none;
		padding: 0;
		margin: 0.8rem 0 0;
		display: grid;
		gap: 0.7rem;
	}
	.details li {
		padding: 0.85rem;
		border-radius: 8px;
		background: var(--panel2);
	}
	h4 {
		margin: 0;
		font-size: 0.98rem;
	}
	.details p {
		margin: 0.4rem 0;
		color: var(--muted);
	}
	.coverage {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.6rem;
	}
	.coverage span {
		font-size: 0.72rem;
		padding: 0.18rem 0.48rem;
		border: 1px solid var(--line);
		border-radius: 999px;
	}
	.coverage span[data-status='covered'] {
		color: var(--cyan);
	}
	.coverage span[data-status='partial'],
	.coverage span[data-status='deferred'] {
		color: var(--gold);
	}
	.refs {
		font: 0.75rem/1.45 var(--font-mono);
		overflow-wrap: anywhere;
	}
	.missing {
		margin-top: 1rem;
		padding: 1.1rem;
		border: 1px dashed var(--line);
		border-radius: 10px;
		background: var(--panel2);
	}
	@media (max-width: 640px) {
		.page {
			padding-top: 1.2rem;
		}
		.jump-nav {
			top: auto;
		}
		.story-step {
			padding: 1rem;
		}
		.summary {
			font-size: 0.95rem;
		}
		.group-header {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.35rem;
		}
	}
</style>
