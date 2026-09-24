<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import LifecycleNotice from '$lib/components/app/LifecycleNotice.svelte';
	import DialogueTimingReportView from '$lib/components/reports/DialogueTimingReportView.svelte';
	import EditorialReportView from '$lib/components/reports/EditorialReportView.svelte';
	import { getReportEntry } from '$lib/data/reports/index';
	import {
		getLifecycleForRef,
		listLocalizedScripts
	} from '$lib/data/repositories/index';
	import { reportDescription, reportTitle } from '$lib/data/selectors/reportPresentation';
	import { scriptLabel } from '$lib/data/selectors/scriptPresentation';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import { withLocale } from '$lib/utils/paths';
	import { encodeScriptId } from '$lib/utils/scriptId';

	let { data } = $props();

	const locale = getLocale();
	const entry = $derived(getReportEntry(data.reportId));
	const scripts = listLocalizedScripts(locale);
	const scriptEntry = $derived(scripts.find((item) => item.id === data.scriptId));
	const lifecycle = $derived(getLifecycleForRef('script', data.scriptId));
	const report = $derived(data.report);
</script>

<svelte:head>
	{#if lifecycle.status !== 'active'}<meta name="robots" content="noindex,follow" />{/if}
</svelte:head>

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
		<LifecycleNotice {lifecycle} />
		<nav class="nav">
			<a href={withLocale('/reports')}>← {m.reports_back_to_hub()}</a>
			<a href={withLocale(`/reports/${data.reportId}`)}>{reportTitle(entry.titleKey)}</a>
			<a href={withLocale(`/script/${encodeScriptId(data.scriptId)}`)}>{m.reports_open_script()}</a>
			<a href={withLocale(`/animatic/${encodeScriptId(data.scriptId)}`)}
				>{m.reports_open_animatic()}</a
			>
		</nav>

		{#if data.reportId === 'dialogue-timing'}
			<DialogueTimingReportView {report} />
		{:else}
			<EditorialReportView
				reportId={data.reportId}
				{report}
				diskAuditEnabled={data.diskAuditEnabled}
			/>
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
