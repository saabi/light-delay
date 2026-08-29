<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import {
		getCharacters,
		getLocalizedComparisonTaxonomy,
		getLocalizedEntityVariants,
		getLocalizedNarrativeFunctions,
		getLocalizedScript,
		listLocalizedScripts
	} from '$lib/data/repositories/index';
	import { getCharacterById } from '$lib/data/repositories/lookups';
	import { compareScripts } from '$lib/data/selectors/comparison';
	import { getFoundationalConflictWarnings } from '$lib/data/validation/validateComparison';
	import { withLocale } from '$lib/utils/paths';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';
	import { onMount } from 'svelte';
	import StoryLanguageNotice from '$lib/components/controls/StoryLanguageNotice.svelte';
	import { scriptLabel, scriptStatusLabel } from '$lib/data/selectors/scriptPresentation';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { editorialValueLabel } from '$lib/data/selectors/editorialPresentation';
	import { storyText } from '$lib/data/selectors/localized';
	import type { StoryText } from '$lib/types/i18n';

	const locale = getLocale();
	const registry = listLocalizedScripts(locale);
	const taxonomy = getLocalizedComparisonTaxonomy(locale);
	const characters = getCharacters().characters.map((character) => getCharacterById(character.id)!);
	const variants = getLocalizedEntityVariants(locale).variants;
	let interactive = $state(false);
	const functionLabels = new Map(
		getLocalizedNarrativeFunctions(locale).functions.map((item) => [item.id, item.label])
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
	const primary = $derived(getLocalizedScript(primaryId, locale));
	const against = $derived(getLocalizedScript(againstId, locale));
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
		return value === 'same'
			? m.compare_same()
			: value === 'different'
				? m.compare_different()
				: m.compare_not_declared();
	}

	function characterName(id: string) {
		return characters.find((character) => character.id === id)?.name ?? id;
	}

	function participationText(value?: {
		declared: boolean;
		used: boolean;
		functionAssigned: boolean;
	}) {
		if (!value) return m.compare_not_declared();
		const labels = [];
		if (value.declared) labels.push(m.compare_declared());
		if (value.used) labels.push(m.compare_used());
		if (value.functionAssigned) labels.push(m.compare_function());
		return labels.length ? labels.join(' · ') : m.compare_not_declared();
	}

	function roleText(
		character: { role?: StoryText } | undefined,
		variant: { roleOverride?: StoryText } | undefined
	) {
		return storyText(variant?.roleOverride ?? character?.role, locale) || m.compare_profile_missing();
	}

	function changeAgainst(event: Event) {
		const next = (event.currentTarget as HTMLSelectElement).value;
		void goto(
			withLocale(`/compare/${encodeScriptId(primaryId)}?against=${encodeURIComponent(next)}`)
		);
	}

	onMount(() => {
		interactive = true;
		if (requestedAgainst === againstId) return;
		void goto(
			withLocale(`/compare/${encodeScriptId(primaryId)}?against=${encodeURIComponent(againstId)}`),
			{ replaceState: true }
		);
	});
</script>

<main class="page">
	<PageHeader
		eyebrow={m.compare_eyebrow()}
		title={`${primaryEntry ? scriptLabel(primaryEntry) : primary.script.title} ↔ ${againstEntry ? scriptLabel(againstEntry) : against.script.title}`}
		lede={m.compare_lede()}
		meta={[
			scriptStatusLabel(primary.script.status),
			scriptStatusLabel(against.script.status),
			primary.script.continuityId
		]}
	/>

	<label class="against-picker">
		<span>{m.compare_against()}</span>
		<select
			aria-label={m.compare_picker_aria()}
			value={againstId}
			disabled={!interactive}
			onchange={changeAgainst}
		>
			{#each registry.filter((entry) => entry.id !== primaryId) as entry (entry.id)}
				<option value={entry.id}>{scriptLabel(entry)}</option>
			{/each}
		</select>
	</label>
	<StoryLanguageNotice />

	{#if foundationalWarnings.length}
		<aside class="warning" aria-label={m.compare_foundational_conflicts()}>
			<strong>{m.compare_conflict_title()}</strong>
			{m.compare_conflict_body()}
		</aside>
	{/if}

	<section>
		<h2>{m.compare_canon()}</h2>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (la tabla debe poder desplazarse con teclado) -->
		<div class="table-wrap" role="region" tabindex="0" aria-label={m.compare_canon_region()}>
			<table>
				<thead
					><tr
						><th>{m.compare_dimension()}</th><th>{primaryEntry ? scriptLabel(primaryEntry) : ''}</th
						><th>{againstEntry ? scriptLabel(againstEntry) : ''}</th><th>{m.compare_result()}</th
						></tr
					></thead
				>
				<tbody>
					{#each result.canon as row (row.definition.id)}
						<tr>
							<th>{row.definition.label}</th>
							<td
								>{row.primary?.statement ?? m.compare_unspecified()}<small
									>{row.primary?.status
										? editorialValueLabel(row.primary.status, locale)
										: ''}</small
								></td
							>
							<td
								>{row.against?.statement ?? m.compare_unspecified()}<small
									>{row.against?.status
										? editorialValueLabel(row.against.status, locale)
										: ''}</small
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
		<h2>{m.compare_events()}</h2>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (la tabla debe poder desplazarse con teclado) -->
		<div class="table-wrap" role="region" tabindex="0" aria-label={m.compare_events_region()}>
			<table>
				<thead
					><tr
						><th>{m.compare_event()}</th><th>{primaryEntry ? scriptLabel(primaryEntry) : ''}</th><th
							>{againstEntry ? scriptLabel(againstEntry) : ''}</th
						><th>{m.compare_result()}</th></tr
					></thead
				>
				<tbody>
					{#each result.events as row (row.definition.id)}
						<tr>
							<th>{row.definition.label}</th>
							<td
								>{row.primary?.status
									? editorialValueLabel(row.primary.status, locale)
									: m.compare_unspecified()}{#if row.primary?.sceneIds?.[0]}<a
										href={withLocale(
											`/script/${encodeScriptId(primaryId)}#${row.primary.sceneIds[0]}`
										)}>{m.compare_view_scene()}</a
									>{/if}</td
							>
							<td
								>{row.against?.status
									? editorialValueLabel(row.against.status, locale)
									: m.compare_unspecified()}{#if row.against?.sceneIds?.[0]}<a
										href={withLocale(
											`/script/${encodeScriptId(againstId)}#${row.against.sceneIds[0]}`
										)}>{m.compare_view_scene()}</a
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
		<h2>{m.compare_cast()}</h2>
		<div class="cast-grid">
			{#each result.cast as row (row.characterId)}
				<article>
					<h3>{row.character?.name ?? row.characterId}</h3>
					<p>
						<b>{primaryEntry ? scriptLabel(primaryEntry) : ''}:</b>
						{participationText(row.primary)}
					</p>
					{#if row.primary}<p class="profile">
							{m.compare_role()}: {roleText(row.character, row.primaryVariant)}
						</p>{/if}
					<p>
						<b>{againstEntry ? scriptLabel(againstEntry) : ''}:</b>
						{participationText(row.against)}
					</p>
					{#if row.against}<p class="profile">
							{m.compare_role()}: {roleText(row.character, row.againstVariant)}
						</p>{/if}
					{#if row.primaryVariant || row.againstVariant}
						<p class="variant">
							{m.compare_variants()}: {row.primaryVariant?.label ?? m.compare_base()} / {row
								.againstVariant?.label ?? m.compare_base()}
						</p>
						{#if row.primaryVariant?.biographyOverride || row.againstVariant?.biographyOverride}
							<p class="profile">
								{m.compare_biography()}: {row.primaryVariant?.biographyOverride ?? m.compare_base()} /
								{row.againstVariant?.biographyOverride ?? m.compare_base()}
							</p>
						{/if}
					{/if}
				</article>
			{/each}
		</div>
	</section>

	<section>
		<h2>{m.compare_functions()}</h2>
		<ul class="functions">
			{#each [...result.functions] as [id, assignments] (id)}
				<li>
					<strong>{functionLabels.get(id) ?? id}</strong>
					<span
						>{assignments.primary.map((item) => characterName(item.characterId)).join(', ') ||
							m.compare_unassigned()}</span
					>
					<span
						>{assignments.against.map((item) => characterName(item.characterId)).join(', ') ||
							m.compare_unassigned()}</span
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
