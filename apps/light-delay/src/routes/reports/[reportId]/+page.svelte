<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import ReportScriptLinks from '$lib/components/reports/ReportScriptLinks.svelte';
	import { getReportEntry } from '$lib/data/reports/index';
	import { listLocalizedScripts } from '$lib/data/repositories/index';
	import { reportDescription, reportTitle } from '$lib/data/selectors/reportPresentation';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import { withLocale } from '$lib/utils/paths';

	let { data } = $props();

	const locale = getLocale();
	const entry = $derived(getReportEntry(data.reportId));
	const scripts = $derived(listLocalizedScripts(locale));
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
	<ReportScriptLinks {scripts} reportId={data.reportId} summaries={data.summaries} />
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
