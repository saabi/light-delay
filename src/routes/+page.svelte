<script lang="ts">
	import LocaleSwitcher from '$lib/components/controls/LocaleSwitcher.svelte';
	import { getProject } from '$lib/data/repositories/index';
	import * as m from '$lib/paraglide/messages.js';
	import { encodeScriptId } from '$lib/utils/scriptId';
	import { withBase, withLocale } from '$lib/utils/paths';

	const project = getProject().project;
	const scriptId = encodeScriptId(project.canonicalScriptId);
</script>

<svelte:head
	><meta
		name="keywords"
		content="science fiction, short film, first contact, animatic, hard science fiction"
	/></svelte:head
>

<div class="landing">
	<header class="site-header">
		<a class="brand" href={withLocale('/')} aria-label={m.nav_home()}
			><img src={withBase('/brand/light-delay-logo.svg')} alt="Light Delay" /></a
		>
		<nav aria-label={m.nav_primary()}>
			<a href={withLocale(`/animatic/${scriptId}`)}>{m.nav_animatic()}</a><a
				href={withLocale('/project')}>{m.nav_project()}</a
			><a href="https://github.com/saabi/light-delay">{m.nav_github()}</a><LocaleSwitcher compact />
		</nav>
	</header>
	<main id="content">
		<section class="hero">
			<div class="hero-copy">
				<p class="eyebrow">{m.landing_eyebrow()}</p>
				<h1>{m.landing_title()}</h1>
				<p class="lede">{m.landing_lede()}</p>
				<div class="actions">
					<a class="primary" href={withLocale(`/animatic/${scriptId}`)}>{m.landing_watch()}</a><a
						href={withLocale(`/script/${scriptId}`)}>{m.landing_read()}</a
					>
				</div>
			</div>
			<div class="signal" aria-hidden="true">
				<div class="beam"></div>
				<div class="eclipse"></div>
				<div class="arrival"></div>
			</div>
		</section>
		<section class="overview" aria-label={m.landing_format_title()}>
			<article>
				<span>01</span>
				<h2>{m.landing_about_title()}</h2>
				<p>{m.landing_about_body()}</p>
			</article>
			<article>
				<span>02</span>
				<h2>{m.landing_format_title()}</h2>
				<p>{m.landing_format_body()}</p>
			</article>
			<article>
				<span>03</span>
				<h2>{m.landing_status_title()}</h2>
				<p>{m.landing_status_body()}</p>
			</article>
		</section>
		<section class="explore">
			<p class="eyebrow">{m.landing_explore_title()}</p>
			<div class="cards">
				<a href={withLocale(`/script/${scriptId}`)}
					><h2>{m.landing_card_script()}</h2>
					<p>{m.landing_card_script_body()}</p>
					<b>{m.action_open()} →</b></a
				><a href={withLocale(`/animatic/${scriptId}`)}
					><h2>{m.landing_card_animatic()}</h2>
					<p>{m.landing_card_animatic_body()}</p>
					<b>{m.action_open()} →</b></a
				><a href={withLocale('/art')}
					><h2>{m.landing_card_art()}</h2>
					<p>{m.landing_card_art_body()}</p>
					<b>{m.action_open()} →</b></a
				><a href={withLocale('/project')}
					><h2>{m.landing_card_archive()}</h2>
					<p>{m.landing_card_archive_body()}</p>
					<b>{m.landing_project()} →</b></a
				>
			</div>
		</section>
	</main>
	<footer>
		<span>Light Delay · {m.footer_development()}</span><span>{m.landing_rights()}</span>
	</footer>
</div>

<style>
	.landing {
		min-height: 100vh;
		overflow: hidden;
		background: radial-gradient(circle at 78% 18%, #153149 0, #07131d 32%, #03090e 72%);
	}
	.site-header {
		position: relative;
		z-index: 4;
		max-width: 82rem;
		margin: auto;
		padding: 1.25rem var(--page-gutter);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
	}
	.brand img {
		display: block;
		width: clamp(10rem, 18vw, 15rem);
		height: auto;
	}
	.site-header nav {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.site-header nav > a {
		color: var(--muted);
		font-size: 0.82rem;
		font-weight: 700;
		text-decoration: none;
	}
	.site-header nav > a:hover {
		color: var(--cyan);
	}
	main {
		max-width: 82rem;
		margin: auto;
		padding: 0 var(--page-gutter) 5rem;
	}
	.hero {
		min-height: min(46rem, 78vh);
		display: grid;
		grid-template-columns: minmax(0, 0.95fr) minmax(22rem, 1.05fr);
		align-items: center;
		gap: 4rem;
	}
	.hero-copy {
		position: relative;
		z-index: 2;
	}
	.eyebrow {
		color: var(--cyan);
		font: 800 0.72rem var(--font-mono);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	h1 {
		max-width: 14ch;
		margin: 0.7rem 0 1.25rem;
		font: 700 clamp(3.1rem, 7vw, 6.8rem)/0.92 var(--font-serif);
		letter-spacing: -0.055em;
	}
	.lede {
		max-width: 43rem;
		margin: 0;
		color: var(--muted);
		font-size: clamp(1.05rem, 1.8vw, 1.3rem);
		line-height: 1.6;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 2rem;
	}
	.actions a {
		padding: 0.8rem 1.1rem;
		border: 1px solid var(--line);
		border-radius: 0.65rem;
		color: var(--ink);
		font-weight: 750;
		text-decoration: none;
	}
	.actions .primary {
		border-color: var(--cyan);
		background: var(--cyan);
		color: #031019;
	}
	.signal {
		position: relative;
		min-height: 28rem;
	}
	.beam {
		position: absolute;
		top: 50%;
		left: -10%;
		right: -20%;
		height: 0.3rem;
		background: linear-gradient(90deg, transparent, var(--cyan) 42%, var(--gold));
		box-shadow: 0 0 2rem #5ee7ff88;
	}
	.eclipse {
		position: absolute;
		top: 50%;
		left: 47%;
		width: 14rem;
		aspect-ratio: 1;
		transform: translate(-50%, -50%);
		border: 0.3rem solid var(--cyan);
		border-radius: 50%;
		background: #03090e;
		box-shadow:
			inset -1rem 0 2rem #f1bd6226,
			0 0 5rem #5ee7ff22;
	}
	.eclipse:after {
		content: '';
		position: absolute;
		inset: 9% -7% 9% 67%;
		border-right: 0.35rem solid var(--gold);
		border-radius: 50%;
	}
	.arrival {
		position: absolute;
		top: 50%;
		right: 0;
		width: 1rem;
		aspect-ratio: 1;
		transform: translateY(-50%);
		border-radius: 50%;
		background: var(--gold);
		box-shadow: 0 0 2rem var(--gold);
	}
	.overview {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-block: 1px solid var(--line);
	}
	.overview article {
		padding: 2rem;
		border-right: 1px solid var(--line);
	}
	.overview article:last-child {
		border-right: 0;
	}
	.overview span {
		color: var(--gold);
		font: 800 0.7rem var(--font-mono);
	}
	.overview h2,
	.cards h2 {
		margin: 0.75rem 0;
		font: 700 1.5rem var(--font-serif);
	}
	.overview p,
	.cards p {
		color: var(--muted);
		line-height: 1.6;
	}
	.explore {
		padding-top: 5rem;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-top: 1.2rem;
	}
	.cards a {
		min-height: 15rem;
		padding: 1.4rem;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--line);
		border-radius: 0.8rem;
		background: var(--panel);
		color: var(--ink);
		text-decoration: none;
	}
	.cards a:hover {
		border-color: var(--cyan);
		transform: translateY(-2px);
	}
	.cards b {
		margin-top: auto;
		color: var(--cyan);
		font-size: 0.82rem;
	}
	footer {
		max-width: 82rem;
		margin: auto;
		padding: 1.5rem var(--page-gutter) 2.5rem;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		border-top: 1px solid var(--line);
		color: var(--muted);
		font-size: 0.75rem;
	}
	@media (max-width: 760px) {
		.site-header {
			align-items: flex-start;
		}
		.site-header nav > a {
			display: none;
		}
		.hero {
			min-height: auto;
			grid-template-columns: 1fr;
			gap: 1rem;
			padding: 4rem 0 2rem;
		}
		.signal {
			min-height: 17rem;
			order: -1;
		}
		.eclipse {
			width: 9rem;
		}
		.overview,
		.cards {
			grid-template-columns: 1fr;
		}
		.overview article {
			border-right: 0;
			border-bottom: 1px solid var(--line);
			padding-inline: 0;
		}
		.cards a {
			min-height: 11rem;
		}
		footer {
			flex-direction: column;
		}
	}
</style>
