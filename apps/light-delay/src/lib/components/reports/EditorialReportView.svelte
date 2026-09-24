<script lang="ts">
	import ReportSummary from './ReportSummary.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		reportId,
		report,
		diskAuditEnabled = false
	}: {
		reportId: string;
		report: Record<string, unknown>;
		diskAuditEnabled?: boolean;
	} = $props();

	const summary = $derived((report.summary as Record<string, unknown>) ?? {});
	const listSections = $derived(
		Object.entries(report).filter(
			([key, value]) =>
				key !== 'summary' &&
				key !== 'scriptId' &&
				key !== 'language' &&
				key !== 'generatedAt' &&
				Array.isArray(value) &&
				value.length > 0
		) as Array<[string, Record<string, unknown>[]]>
	);
</script>

<ReportSummary {summary} />

{#if reportId === 'visual-art' && !diskAuditEnabled}
	<p class="note">{m.reports_visual_art_disk_note()}</p>
{/if}

{#if report.briefs && Array.isArray(report.briefs)}
	<section>
		<h2>Briefs</h2>
		{#each report.briefs as brief, index (index)}
			<article class="brief">
				<h3>Toma {brief.shotNumber} · escena {brief.sceneNumber}</h3>
				<p>{brief.description}</p>
				{#if brief.replacementBrief}<p><strong>Brief:</strong> {brief.replacementBrief}</p>{/if}
				{#if brief.completenessFlags?.length}
					<p><small>{brief.completenessFlags.join(', ')}</small></p>
				{/if}
			</article>
		{/each}
	</section>
{/if}

{#if report.queue && Array.isArray(report.queue)}
	<section>
		<h2>Queue</h2>
		<table>
			<thead>
				<tr>
					<th>Shot</th>
					<th>Status</th>
					<th>Reasons</th>
				</tr>
			</thead>
			<tbody>
				{#each report.queue as row, index (index)}
					<tr>
						<td>{row.shotNumber ?? row.shotId}</td>
						<td>{row.status}</td>
						<td>{row.reasons?.join(', ')}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}

{#if report.byScene && Array.isArray(report.byScene)}
	<section>
		<h2>Por escena</h2>
		{#each report.byScene as scene, index (index)}
			<h3>Escena {scene.sceneNumber}</h3>
			<ul>
				{#each scene.shots as shot, shotIndex (shotIndex)}
					<li>T{shot.shotNumber}: {shot.flags?.join(', ')}</li>
				{/each}
			</ul>
		{/each}
	</section>
{/if}

{#each listSections as [title, rows] (title)}
	<section>
		<h2>{title}</h2>
		<table>
			<thead>
				<tr>
					{#each Object.keys(rows[0] ?? {}) as col (col)}
						<th>{col}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row, index (index)}
					<tr>
						{#each Object.values(row) as cell, cellIndex (cellIndex)}
							<td>
								{#if Array.isArray(cell)}
									{cell.join(', ')}
								{:else if typeof cell === 'object' && cell !== null}
									{JSON.stringify(cell)}
								{:else}
									{String(cell ?? '')}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/each}

{#if report.byType}
	<section>
		<h2>byType</h2>
		<ul>
			{#each Object.entries(report.byType as Record<string, number>) as [type, count] (type)}
				<li>{type}: {count}</li>
			{/each}
		</ul>
	</section>
{/if}

{#if listSections.length === 0 && !report.briefs && !report.queue && !report.byScene && !report.byType}
	<p class="empty">{m.reports_no_rows()}</p>
{/if}

<style>
	h2,
	h3 {
		font: 700 1.05rem var(--font-serif);
		margin: 1.5rem 0 0.75rem;
	}

	.note {
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--gold);
		background: var(--panel2);
		color: var(--muted);
		font-size: 0.88rem;
	}

	.brief {
		padding: 1rem;
		margin-bottom: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--panel);
	}

	.brief h3 {
		margin-top: 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}

	th,
	td {
		padding: 0.4rem 0.55rem;
		border-bottom: 1px solid var(--line);
		text-align: left;
		vertical-align: top;
	}

	th {
		color: var(--muted);
		font-size: 0.7rem;
		text-transform: uppercase;
	}

	ul {
		margin: 0;
		padding-left: 1.2rem;
	}

	.empty {
		color: var(--muted);
		font-style: italic;
	}
</style>
