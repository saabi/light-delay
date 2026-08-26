<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import {
		getCanonicalScript,
		getDocuments,
		getProject,
		listScripts
	} from '$lib/data/repositories/index';
	import { resolveDocument } from '$lib/data/selectors/localized';
	import {
		scriptKindLabel,
		scriptLabel,
		scriptStatusLabel
	} from '$lib/data/selectors/scriptPresentation';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import { encodeScriptId } from '$lib/utils/scriptId';
	import { withLocale } from '$lib/utils/paths';

	const project = getProject().project;
	const scripts = listScripts();
	const canonical = getCanonicalScript();
	const documents = $derived(
		getDocuments().documents.map((document) => resolveDocument(document, getLocale()))
	);
</script>

<main class="page">
	<PageHeader
		eyebrow={m.project_eyebrow()}
		title={m.project_title()}
		lede={m.project_lede()}
		meta={[
			`${canonical.scenes.length} ${m.script_scenes()}`,
			`${canonical.shots.length} ${m.animatic_shots()}`,
			'ES · EN'
		]}
	/>
	<section class="grid" aria-label={m.nav_primary()}>
		<a class="card" href={withLocale(`/script/${encodeScriptId(project.canonicalScriptId)}`)}
			><span>01</span>
			<h2>{m.nav_script()}</h2>
			<p>{m.landing_card_script_body()}</p>
			<b>{m.action_open()} →</b></a
		>
		<a class="card" href={withLocale(`/animatic/${encodeScriptId(project.canonicalScriptId)}`)}
			><span>02</span>
			<h2>{m.nav_animatic()}</h2>
			<p>{m.landing_card_animatic_body()}</p>
			<b>{m.action_open()} →</b></a
		>
		<a class="card" href={withLocale('/art')}
			><span>03</span>
			<h2>{m.nav_art()}</h2>
			<p>{m.landing_card_art_body()}</p>
			<b>{m.action_open()} →</b></a
		>
		<a class="card" href={withLocale('/entities/characters')}
			><span>04</span>
			<h2>{m.nav_entities()}</h2>
			<p>{m.landing_card_archive_body()}</p>
			<b>{m.action_open()} →</b></a
		>
	</section>
	<section class="lists">
		<div>
			<h2>{m.project_scripts()}</h2>
			<ul>
				{#each scripts as entry (entry.id)}<li>
						<div>
							<a href={withLocale(`/script/${encodeScriptId(entry.id)}`)}>{scriptLabel(entry)}</a
							><small>{scriptKindLabel(entry.kind)} · {scriptStatusLabel(entry.status)}</small>
						</div>
						<a href={withLocale(`/animatic/${encodeScriptId(entry.id)}`)}>{m.nav_animatic()}</a>
					</li>{/each}
			</ul>
		</div>
		<div>
			<h2>{m.project_documents()}</h2>
			<ul>
				{#each documents as doc (doc.id)}<li>
						<div>
							<a href={withLocale(`/documents/${doc.slug}`)}>{doc.title}</a><small
								>{doc.status}</small
							>
						</div>
					</li>{/each}
			</ul>
		</div>
	</section>
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 3.5rem var(--page-gutter) 4.5rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	.card {
		min-height: 200px;
		padding: 1.5rem;
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
	.card span {
		color: var(--cyan);
		font: 800 0.73rem var(--font-mono);
	}
	.card h2 {
		margin: 1.1rem 0 0.6rem;
		font: 700 1.35rem var(--font-serif);
	}
	.card p {
		margin: 0;
		color: var(--muted);
	}
	.card b {
		margin-top: auto;
		padding-top: 1rem;
		color: var(--gold);
	}
	.lists {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-top: 2.75rem;
	}
	.lists h2 {
		font: 700 1.3rem var(--font-serif);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--panel);
	}
	li a {
		color: var(--ink);
		text-decoration: none;
	}
	li > a {
		color: var(--gold);
	}
	small {
		display: block;
		margin-top: 0.2rem;
		color: var(--muted);
		font-size: 0.7rem;
		text-transform: uppercase;
	}
	@media (max-width: 680px) {
		.page {
			padding-top: 2rem;
		}
		.grid,
		.lists {
			grid-template-columns: 1fr;
		}
		.card {
			min-height: 170px;
		}
	}
</style>
