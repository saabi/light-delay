<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import {
		getCanonicalScript,
		getDocuments,
		getProject,
		listScripts
	} from '$lib/data/repositories/index';
	import { encodeScriptId } from '$lib/utils/scriptId';
	import { withBase } from '$lib/utils/paths';

	const project = getProject().project;
	const documents = getDocuments().documents;
	const scripts = listScripts();
	const canonical = getCanonicalScript();
	const shotCount = canonical.shots.length;
	const sceneCount = canonical.scenes.length;
</script>

<main class="page">
	<PageHeader
		eyebrow="Proyecto"
		title="{project.title} / Luz Tardía"
		lede={project.description ?? 'Cortometraje de ciencia ficción de primer contacto.'}
		meta={[`${sceneCount} escenas (canónico)`, `${shotCount} tomas`, 'Guion canónico ES']}
	/>

	<section class="grid" aria-label="Secciones del proyecto">
		<a class="card" href={withBase(`/script/${encodeScriptId(project.canonicalScriptId)}`)}>
			<span>01</span>
			<h2>Guion</h2>
			<p>Lectura del guion corto desde datos estructurados (actos, escenas, beats y cues).</p>
			<b>Abrir guion →</b>
		</a>
		<a class="card" href={withBase(`/animatic/${encodeScriptId(project.canonicalScriptId)}`)}>
			<span>02</span>
			<h2>Animatic</h2>
			<p>Desglose de tomas, duraciones editables y modo película (por script).</p>
			<b>Abrir animatic →</b>
		</a>
		<a class="card" href={withBase('/art')}>
			<span>03</span>
			<h2>Arte</h2>
			<p>Galería visual de personajes, localizaciones, objetos y vehículos.</p>
			<b>Ver arte →</b>
		</a>
		<a class="card" href={withBase('/entities/characters')}>
			<span>04</span>
			<h2>Entidades</h2>
			<p>Índice de personajes, lugares, objetos, naves y facciones.</p>
			<b>Explorar →</b>
		</a>
	</section>

	<section class="scripts" aria-label="Scripts registrados">
		<h2>Scripts / cuts</h2>
		<ul>
			{#each scripts as entry (entry.id)}
				<li>
					<div>
						<a href={withBase(`/script/${encodeScriptId(entry.id)}`)}>{entry.label}</a>
						<small>{entry.kind} · {entry.status}</small>
					</div>
					<a class="animatic" href={withBase(`/animatic/${encodeScriptId(entry.id)}`)}>Animatic</a>
				</li>
			{/each}
		</ul>
	</section>

	<section class="docs">
		<h2>Documentos</h2>
		<ul>
			{#each documents as doc (doc.id)}
				<li>
					<a href={withBase(`/documents/${doc.slug}`)}>{doc.title}</a>
					<small>{doc.status}</small>
				</li>
			{/each}
		</ul>
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
		min-height: 220px;
		padding: 1.5rem;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: linear-gradient(145deg, #112638, #0b1722);
		text-decoration: none;
		display: flex;
		flex-direction: column;
		transition:
			0.2s transform,
			0.2s border-color;
	}

	.card:hover {
		transform: translateY(-3px);
		border-color: var(--cyan);
	}

	.card > span {
		color: var(--cyan);
		font: 800 0.73rem var(--font-mono);
	}

	.card h2 {
		margin: 1.25rem 0 0.65rem;
		font: 700 1.35rem/1.2 var(--font-serif);
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
		font-size: 0.85rem;
	}

	.scripts,
	.docs {
		margin-top: 2.75rem;
	}

	.scripts h2,
	.docs h2 {
		margin: 0 0 0.85rem;
		font: 700 1.25rem var(--font-serif);
	}

	.scripts ul,
	.docs ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}

	.scripts li,
	.docs li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--panel);
		align-items: center;
	}

	.scripts a,
	.docs a {
		color: var(--ink);
		text-decoration: none;
	}

	.scripts a:hover,
	.docs a:hover {
		color: var(--cyan);
	}

	.scripts small,
	.docs small {
		display: block;
		margin-top: 0.2rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.72rem;
	}

	.scripts .animatic {
		color: var(--gold);
		font-size: 0.85rem;
		white-space: nowrap;
	}

	@media (max-width: 680px) {
		.page {
			padding-top: 2rem;
			padding-bottom: 3rem;
		}

		.grid {
			grid-template-columns: 1fr;
		}

		.card {
			min-height: 190px;
			padding: 1.2rem;
		}
	}

	@media (max-width: 480px) {
		.scripts li,
		.docs li {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
