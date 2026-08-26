<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import {
		getCharacters,
		getComparisonTaxonomy,
		getEntityVariants,
		getNarrativeFunctions,
		getScript,
		listScripts
	} from '$lib/data/repositories/index';
	import { compareScripts } from '$lib/data/selectors/comparison';
	import { getFoundationalConflictWarnings } from '$lib/data/validation/validateComparison';
	import { withBase } from '$lib/utils/paths';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';
	import { onMount } from 'svelte';

	const registry = listScripts();
	const taxonomy = getComparisonTaxonomy();
	const characters = getCharacters().characters;
	const variants = getEntityVariants().variants;
	let interactive = $state(false);
	const functionLabels = new Map(
		getNarrativeFunctions().functions.map((item) => [item.id, item.label])
	);

	const primaryId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const validAgainstIds = $derived(
		registry.map((entry) => entry.id).filter((id) => id !== primaryId)
	);
	const requestedAgainst = $derived(browser ? page.url.searchParams.get('against') : null);
	const againstId = $derived(
		requestedAgainst && validAgainstIds.includes(requestedAgainst)
			? requestedAgainst
			: validAgainstIds[0]
	);
	const primary = $derived(getScript(primaryId));
	const against = $derived(getScript(againstId));
	const result = $derived(
		compareScripts({
			primary,
			against,
			taxonomy,
			characters,
			variants
		})
	);
	const foundationalWarnings = $derived(
		getFoundationalConflictWarnings(primary, against, taxonomy)
	);
	const primaryEntry = $derived(registry.find((entry) => entry.id === primaryId));
	const againstEntry = $derived(registry.find((entry) => entry.id === againstId));

	function comparisonLabel(value: string) {
		return value === 'same' ? 'Coincide' : value === 'different' ? 'Difiere' : 'Sin especificar';
	}

	function characterName(id: string) {
		return characters.find((character) => character.id === id)?.name ?? id;
	}

	function participationText(value?: {
		declared: boolean;
		used: boolean;
		functionAssigned: boolean;
	}) {
		if (!value) return 'No consta';
		const labels = [];
		if (value.declared) labels.push('declarado');
		if (value.used) labels.push('usado');
		if (value.functionAssigned) labels.push('función');
		return labels.length ? labels.join(' · ') : 'No consta';
	}

	function roleText(
		character: (typeof characters)[number] | undefined,
		variant: (typeof variants)[number] | undefined
	) {
		return variant?.roleOverride ?? character?.role ?? 'Sin perfil declarado';
	}

	function changeAgainst(event: Event) {
		const next = (event.currentTarget as HTMLSelectElement).value;
		void goto(
			withBase(`/compare/${encodeScriptId(primaryId)}?against=${encodeURIComponent(next)}`)
		);
	}

	onMount(() => {
		interactive = true;
		if (requestedAgainst === againstId) return;
		void goto(
			withBase(`/compare/${encodeScriptId(primaryId)}?against=${encodeURIComponent(againstId)}`),
			{ replaceState: true }
		);
	});
</script>

<main class="page">
	<PageHeader
		eyebrow="Comparación editorial"
		title={`${primaryEntry?.label ?? primary.script.title} ↔ ${againstEntry?.label ?? against.script.title}`}
		lede="Comparación declarativa de canon, eventos, reparto y funciones. La ausencia de datos no implica omisión narrativa."
		meta={[primary.script.status, against.script.status, primary.script.continuityId]}
	/>

	<label class="against-picker">
		<span>Comparar con</span>
		<select
			aria-label="Comparar con otro guion"
			value={againstId}
			disabled={!interactive}
			onchange={changeAgainst}
		>
			{#each registry.filter((entry) => entry.id !== primaryId) as entry (entry.id)}
				<option value={entry.id}>{entry.label}</option>
			{/each}
		</select>
	</label>

	{#if foundationalWarnings.length}
		<aside class="warning" aria-label="Conflictos fundacionales">
			<strong>Conflicto de continuidad:</strong> estos scripts declaran valores establecidos distintos
			en una dimensión fundacional. Revise el canon antes de tratarlos como equivalentes.
		</aside>
	{/if}

	<section>
		<h2>Canon</h2>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (la tabla debe poder desplazarse con teclado) -->
		<div
			class="table-wrap"
			role="region"
			tabindex="0"
			aria-label="Comparación de canon; desplazamiento horizontal"
		>
			<table>
				<thead
					><tr
						><th>Dimensión</th><th>{primaryEntry?.label}</th><th>{againstEntry?.label}</th><th
							>Resultado</th
						></tr
					></thead
				>
				<tbody>
					{#each result.canon as row (row.definition.id)}
						<tr>
							<th>{row.definition.label}</th>
							<td
								>{row.primary?.statement ?? 'Sin especificar'}<small
									>{row.primary?.status ?? ''}</small
								></td
							>
							<td
								>{row.against?.statement ?? 'Sin especificar'}<small
									>{row.against?.status ?? ''}</small
								></td
							>
							<td
								><span class:changed={row.comparison === 'different'}
									>{comparisonLabel(row.comparison)}</span
								></td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>Eventos principales</h2>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (la tabla debe poder desplazarse con teclado) -->
		<div
			class="table-wrap"
			role="region"
			tabindex="0"
			aria-label="Comparación de eventos; desplazamiento horizontal"
		>
			<table>
				<thead
					><tr
						><th>Evento</th><th>{primaryEntry?.label}</th><th>{againstEntry?.label}</th><th
							>Resultado</th
						></tr
					></thead
				>
				<tbody>
					{#each result.events as row (row.definition.id)}
						<tr>
							<th>{row.definition.label}</th>
							<td
								>{row.primary?.status ?? 'Sin especificar'}{#if row.primary?.sceneIds?.[0]}<a
										href={withBase(
											`/script/${encodeScriptId(primaryId)}#${row.primary.sceneIds[0]}`
										)}>Ver escena</a
									>{/if}</td
							>
							<td
								>{row.against?.status ?? 'Sin especificar'}{#if row.against?.sceneIds?.[0]}<a
										href={withBase(
											`/script/${encodeScriptId(againstId)}#${row.against.sceneIds[0]}`
										)}>Ver escena</a
									>{/if}</td
							>
							<td>{comparisonLabel(row.comparison)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>Reparto</h2>
		<div class="cast-grid">
			{#each result.cast as row (row.characterId)}
				<article>
					<h3>{row.character?.name ?? row.characterId}</h3>
					<p><b>{primaryEntry?.label}:</b> {participationText(row.primary)}</p>
					{#if row.primary}<p class="profile">
							Rol: {roleText(row.character, row.primaryVariant)}
						</p>{/if}
					<p><b>{againstEntry?.label}:</b> {participationText(row.against)}</p>
					{#if row.against}<p class="profile">
							Rol: {roleText(row.character, row.againstVariant)}
						</p>{/if}
					{#if row.primaryVariant || row.againstVariant}
						<p class="variant">
							Variantes: {row.primaryVariant?.label ?? 'base'} / {row.againstVariant?.label ??
								'base'}
						</p>
						{#if row.primaryVariant?.biographyOverride || row.againstVariant?.biographyOverride}
							<p class="profile">
								Biografía: {row.primaryVariant?.biographyOverride ?? 'base'} / {row.againstVariant
									?.biographyOverride ?? 'base'}
							</p>
						{/if}
					{/if}
				</article>
			{/each}
		</div>
	</section>

	<section>
		<h2>Funciones narrativas</h2>
		<ul class="functions">
			{#each [...result.functions] as [id, assignments] (id)}
				<li>
					<strong>{functionLabels.get(id) ?? id}</strong>
					<span
						>{assignments.primary.map((item) => characterName(item.characterId)).join(', ') ||
							'Sin asignar'}</span
					>
					<span
						>{assignments.against.map((item) => characterName(item.characterId)).join(', ') ||
							'Sin asignar'}</span
					>
				</li>
			{/each}
		</ul>
	</section>
</main>

<style>
	.page {
		max-width: 1320px;
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}
	section {
		margin-top: 2.5rem;
	}
	h2 {
		font: 700 1.4rem var(--font-serif);
	}
	.against-picker {
		display: grid;
		gap: 0.4rem;
		max-width: 420px;
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
	}
	.against-picker span,
	small {
		color: var(--muted);
		font-size: 0.75rem;
		text-transform: uppercase;
	}
	select {
		padding: 0.6rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		color: var(--ink);
		background: var(--panel2);
	}
	.table-wrap {
		overflow-x: auto;
		overscroll-behavior-x: contain;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background:
			linear-gradient(90deg, var(--panel), transparent 1rem) left,
			linear-gradient(-90deg, var(--panel), transparent 1rem) right;
		background-repeat: no-repeat;
		background-size: 2rem 100%;
	}
	.table-wrap:focus-visible {
		outline: 2px solid var(--cyan);
		outline-offset: 2px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 760px;
	}
	th,
	td {
		padding: 0.8rem;
		border-bottom: 1px solid var(--line);
		text-align: left;
		vertical-align: top;
	}
	thead th {
		color: var(--cyan);
		background: var(--panel2);
	}
	tbody th {
		width: 18%;
		color: var(--gold);
	}
	td small,
	td a {
		display: block;
		margin-top: 0.35rem;
	}
	td a {
		color: var(--cyan);
	}
	.changed {
		color: var(--gold);
	}
	.warning {
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid var(--gold);
		border-radius: var(--radius);
		color: var(--gold);
		background: var(--panel);
	}
	.cast-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
		gap: 0.75rem;
	}
	.cast-grid article {
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
	}
	.cast-grid h3,
	.cast-grid p {
		margin: 0 0 0.45rem;
	}
	.cast-grid p {
		color: var(--muted);
		font-size: 0.86rem;
	}
	.variant {
		color: var(--gold) !important;
	}
	.profile {
		padding-left: 0.65rem;
		border-left: 2px solid var(--line);
	}
	.functions {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	.functions li {
		display: grid;
		grid-template-columns: minmax(180px, 1fr) 1fr 1fr;
		gap: 1rem;
		padding: 0.8rem;
		border: 1px solid var(--line);
		border-radius: 8px;
	}
	@media (max-width: 700px) {
		.page {
			padding-top: 2rem;
		}

		.against-picker {
			max-width: none;
		}

		.against-picker select {
			width: 100%;
			min-width: 0;
		}

		.functions li {
			grid-template-columns: 1fr;
		}
	}
</style>
