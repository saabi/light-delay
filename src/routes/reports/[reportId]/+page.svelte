<script lang="ts">
	import { error } from '@sveltejs/kit';
	import { page } from '$app/state';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import ReportScriptLinks from '$lib/components/reports/ReportScriptLinks.svelte';
	import {
		buildReport,
		createProjectContext,
		getReportEntry
	} from '$lib/data/reports/index';
	import { getLocalizedScript, listLocalizedScripts } from '$lib/data/repositories/index';
	import { reportDescription, reportTitle } from '$lib/data/selectors/reportPresentation';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import { withLocale } from '$lib/utils/paths';

	const locale = getLocale();
	const reportId = $derived(page.params.reportId ?? '');
	const entry = $derived.by(() => {
		try {
			return getReportEntry(reportId);
		} catch {
			error(404, `Report not found: ${reportId}`);
		}
	});
	const scripts = $derived(listLocalizedScripts(locale));
	const projectCtx = createProjectContext();
	const summaries = $derived(
		Object.fromEntries(
			scripts.map((script) => [
				script.id,
				buildReport(reportId, getLocalizedScript(script.id, locale), locale, projectCtx).summary
					?.consoleLine ?? ''
			])
		)
	);
</script>

<main class="page">
	<PageHeader
		eyebrow={m.reports_eyebrow()}
		title={reportTitle(entry.titleKey)}
		lede={reportDescription(entry.descriptionKey)}
		meta={[`${scripts.length} guiones`]}
	/>
	<p class="back">
		<a href={withLocale('/reports')}>← {m.reports_back_to_hub()}</a>
	</p>
	<ReportScriptLinks {scripts} {reportId} {summaries} />
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.back {
		margin: 0 0 1.25rem;
	}

	.back a {
		color: var(--gold);
		text-decoration: none;
	}
</style>
