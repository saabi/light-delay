<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { REPORT_ENTRIES } from '$lib/data/reports/index';
	import { reportDescription, reportTitle } from '$lib/data/selectors/reportPresentation';
	import { withLocale } from '$lib/utils/paths';
	import * as m from '$lib/paraglide/messages.js';
</script>

<main class="page">
	<PageHeader
		eyebrow={m.reports_eyebrow()}
		title={m.reports_title()}
		lede={m.reports_lede()}
		meta={[`${REPORT_ENTRIES.length} informes`]}
	/>
	<section class="grid" aria-label={m.reports_title()}>
		{#each REPORT_ENTRIES as entry (entry.id)}
			<a class="card" href={withLocale(`/reports/${entry.id}`)}>
				<h2>{reportTitle(entry.titleKey)}</h2>
				<p>{reportDescription(entry.descriptionKey)}</p>
				<b>{m.action_open()} →</b>
			</a>
		{/each}
	</section>
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.card {
		min-height: 160px;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: linear-gradient(145deg, #112638, #0b1722);
		color: var(--ink);
		text-decoration: none;
		display: flex;
		flex-direction: column;
	}

	.card:hover {
		border-color: var(--cyan);
		transform: translateY(-2px);
	}

	.card h2 {
		margin: 0 0 0.6rem;
		font: 700 1.15rem var(--font-serif);
	}

	.card p {
		margin: 0;
		color: var(--muted);
		font-size: 0.9rem;
	}

	.card b {
		margin-top: auto;
		padding-top: 1rem;
		color: var(--gold);
	}

	@media (max-width: 680px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
