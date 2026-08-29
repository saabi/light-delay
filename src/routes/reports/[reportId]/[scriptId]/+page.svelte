<script lang="ts">
	import { error } from '@sveltejs/kit';
	import { page } from '$app/state';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import DialogueTimingReportView from '$lib/components/reports/DialogueTimingReportView.svelte';
	import EditorialReportView from '$lib/components/reports/EditorialReportView.svelte';
	import {
		buildReport,
		createProjectContext,
		getReportEntry
	} from '$lib/data/reports/index';
	import { getLocalizedScript, listLocalizedScripts } from '$lib/data/repositories/index';
	import { reportDescription, reportTitle } from '$lib/data/selectors/reportPresentation';
	import { scriptLabel } from '$lib/data/selectors/scriptPresentation';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import { withLocale } from '$lib/utils/paths';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';

	const locale = getLocale();
	const reportId = $derived(page.params.reportId ?? '');
	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const entry = $derived.by(() => {
		try {
			return getReportEntry(reportId);
		} catch {
			error(404, `Report not found: ${reportId}`);
		}
	});
	const scripts = listLocalizedScripts(locale);
	const scriptEntry = $derived(scripts.find((item) => item.id === scriptId));
	$effect(() => {
		if (!scriptEntry) error(404, `Script not found: ${scriptId}`);
	});
	const projectCtx = createProjectContext();
	const report = $derived(
		scriptEntry
			? buildReport(reportId, getLocalizedScript(scriptId, locale), locale, projectCtx)
			: null
	);
</script>

<main class="page">
	{#if report && scriptEntry}
		<PageHeader
			eyebrow={m.reports_eyebrow()}
			title="{reportTitle(entry.titleKey)} · {scriptLabel(scriptEntry)}"
			lede={reportDescription(entry.descriptionKey)}
			meta={[
				`${m.reports_generated_at()}: ${new Date(report.generatedAt).toLocaleString(locale)}`
			]}
		/>
		<nav class="nav">
			<a href={withLocale('/reports')}>← {m.reports_back_to_hub()}</a>
			<a href={withLocale(`/reports/${reportId}`)}>{reportTitle(entry.titleKey)}</a>
			<a href={withLocale(`/script/${encodeScriptId(scriptId)}`)}>{m.reports_open_script()}</a>
			<a href={withLocale(`/animatic/${encodeScriptId(scriptId)}`)}>{m.reports_open_animatic()}</a>
		</nav>

		{#if reportId === 'dialogue-timing'}
			<DialogueTimingReportView {report} />
		{:else}
			<EditorialReportView {reportId} {report} diskAuditEnabled={projectCtx.diskAuditEnabled} />
		{/if}
	{/if}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		font-size: 0.88rem;
	}

	.nav a {
		color: var(--gold);
		text-decoration: none;
	}
</style>
