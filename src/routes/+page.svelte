<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { getDocuments, getProject, getScript } from '$lib/data/repositories/index';

	const project = getProject().project;
	const documents = getDocuments().documents;
	const script = getScript();
	const shotCount = script.shots.length;
	const sceneCount = script.scenes.length;
</script>

<main class="page">
	<PageHeader
		eyebrow="Proyecto"
		title="{project.title} / Luz Tardía"
		lede={project.description ?? 'Cortometraje de ciencia ficción de primer contacto.'}
		meta={[`${sceneCount} escenas`, `${shotCount} tomas`, 'Guion canónico ES']}
	/>

	<section class="grid" aria-label="Secciones del proyecto">
		<a class="card" href="/script">
			<span>01</span>
			<h2>Guion</h2>
			<p>Lectura del guion corto desde datos estructurados (actos, escenas, beats y cues).</p>
			<b>Abrir guion →</b>
		</a>
		<a class="card" href="/animatic">
			<span>02</span>
			<h2>Animatic</h2>
			<p>Desglose de 100 tomas, duraciones editables y modo película.</p>
			<b>Abrir animatic →</b>
		</a>
		<a class="card" href="/art">
			<span>03</span>
			<h2>Arte</h2>
			<p>Galería visual de personajes, localizaciones, objetos y vehículos.</p>
			<b>Ver arte →</b>
		</a>
		<a class="card" href="/entities/characters">
			<span>04</span>
			<h2>Entidades</h2>
			<p>Índice de personajes, lugares, objetos, naves y facciones.</p>
			<b>Explorar →</b>
		</a>
	</section>

	<section class="docs">
		<h2>Documentos</h2>
		<ul>
			{#each documents as doc (doc.id)}
				<li>
					<a href={`/documents/${doc.slug}`}>{doc.title}</a>
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
		padding: 3.5rem 1.75rem 4.5rem;
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

	.docs {
		margin-top: 2.75rem;
	}

	.docs h2 {
		margin: 0 0 0.85rem;
		font: 700 1.25rem var(--font-serif);
	}

	.docs ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}

	.docs li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--panel);
	}

	.docs a {
		color: var(--ink);
		text-decoration: none;
	}

	.docs a:hover {
		color: var(--cyan);
	}

	.docs small {
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.72rem;
	}

	@media (max-width: 680px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
