<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import LifecycleNotice from '$lib/components/app/LifecycleNotice.svelte';
	import ImageCarousel from '$lib/components/media/ImageCarousel.svelte';
	import { withLocale } from '$lib/utils/paths';
	import { encodeRouteId } from '$lib/utils/routeId';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { storyText } from '$lib/data/selectors/localized';
	import type { LocalizedCharacter } from '$lib/data/repositories/lookups';

	let { data } = $props();
	const entity = $derived(data.entity);
	const locale = getLocale();
	const character = $derived(
		data.kind === 'characters' ? (entity as unknown as LocalizedCharacter) : undefined
	);
	const voiceDescription = $derived(
		data.voiceProfile?.description
			? storyText(data.voiceProfile.description, locale)
			: undefined
	);
	const voiceVariants = $derived(
		(data.voiceProfile?.variants ?? []).filter(
			(variant) =>
				variant.locale ||
				variant.languageFormation ||
				variant.prosody ||
				variant.dialogueStyle
		)
	);
	const languageLabel = (language: string) =>
		language === 'es' ? m.language_spanish() : m.language_english();
	const labels = {
		characters: m.entities_characters(),
		locations: m.entities_locations(),
		objects: m.entities_objects(),
		vehicles: m.entities_vehicles(),
		factions: m.entities_factions()
	};
	const label = $derived(labels[data.kind as keyof typeof labels]);

	const slides = $derived(
		data.assets
			.filter(
				(asset) =>
					asset.kind === 'image' && !asset.path.toLowerCase().endsWith('.svg')
			)
			.map((asset) => {
				const caption = storyText(asset.title, locale) || asset.id;
				return {
					id: asset.id,
					src: asset.path,
					alt: caption,
					caption,
					href: withLocale(`/assets/${encodeRouteId(asset.id)}`)
				};
			})
	);
</script>

<svelte:head>
	{#if data.lifecycle.status !== 'active'}<meta name="robots" content="noindex,follow" />{/if}
</svelte:head>

<main class="page">
	<p class="crumb">
		<a href={withLocale(`/entities/${data.kind}`)}>{label}</a>
		<span>/</span>
		<span>{entity.name}</span>
	</p>
	<PageHeader eyebrow={label} title={entity.name} lede={entity.description} meta={[entity.id]} />
	<LifecycleNotice lifecycle={data.lifecycle} />

	{#if character}
		<section class="profile" aria-label={m.entities_character_profile()}>
			<div class="profile-item">
				<h2>{m.entities_role()}</h2>
				<p>{character.role}</p>
			</div>
			{#if character.traits?.length}
				<div class="profile-item">
					<h2>{m.entities_traits()}</h2>
					<ul>
						{#each character.traits as trait}
							<li>{trait}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if character.appearance}
				<div class="profile-item">
					<h2>{m.entities_appearance()}</h2>
					<p>{character.appearance}</p>
				</div>
			{/if}
			{#if character.costume}
				<div class="profile-item">
					<h2>{m.entities_costume()}</h2>
					<p>{character.costume}</p>
				</div>
			{/if}
			{#if voiceDescription}
				<div class="profile-item voice-profile">
					<h2>{m.entities_voice()}</h2>
					<p>{voiceDescription}</p>
					{#if voiceVariants.length}
						<div class="voice-variants">
							{#each voiceVariants as variant (variant.language)}
								<article class="voice-variant">
									<h3>
										{languageLabel(variant.language)}
										{#if variant.locale}<code>{variant.locale}</code>{/if}
									</h3>
									{#if variant.languageFormation}
										<dl>
											<dt>{m.entities_voice_formation()}</dt>
											<dd>
												<strong>{storyText(variant.languageFormation.place, locale)}</strong>
												<span>{storyText(variant.languageFormation.variety, locale)}</span>
											</dd>
										</dl>
									{/if}
									{#if variant.prosody}
										<dl>
											<dt>{m.entities_voice_prosody()}</dt>
											<dd>{storyText(variant.prosody, locale)}</dd>
										</dl>
									{/if}
									{#if variant.dialogueStyle}
										<dl>
											<dt>{m.entities_voice_dialogue_style()}</dt>
											<dd>{storyText(variant.dialogueStyle, locale)}</dd>
										</dl>
									{/if}
								</article>
							{/each}
						</div>
					{/if}
					{#if !data.voiceProfile?.variants.some((variant) => variant.sampleAssetIds?.length)}
						<p class="pending">{m.entities_voice_sample_pending()}</p>
					{/if}
				</div>
			{/if}
		</section>
	{/if}

	{#if slides.length}
		<section>
			<h2>{m.entities_related_assets()}</h2>
			<ImageCarousel {slides} />
		</section>
	{/if}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.crumb {
		display: flex;
		gap: 0.5rem;
		color: var(--muted);
		font-size: 0.9rem;
		margin: 0 0 1rem;
	}

	.crumb a {
		color: var(--cyan);
		text-decoration: none;
	}

	h2 {
		margin: 0 0 1rem;
		font: 700 1.2rem var(--font-serif);
	}

	.profile {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin: 0 0 2.5rem;
	}

	.profile-item {
		padding: 1rem 1.1rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--panel);
	}

	.profile-item h2 {
		margin-bottom: 0.5rem;
	}

	.profile-item p,
	.profile-item ul {
		margin: 0;
		color: var(--muted);
		line-height: 1.55;
	}

	.profile-item ul {
		padding-left: 1.2rem;
	}

	.profile-item .pending {
		margin-top: 0.7rem;
		font-size: 0.85rem;
		color: var(--warning, var(--muted));
	}

	.voice-profile {
		grid-column: 1 / -1;
	}

	.voice-variants {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.voice-variant {
		padding: 0.85rem;
		border: 1px solid var(--line);
		border-radius: 0.6rem;
		background: color-mix(in srgb, var(--panel) 75%, var(--bg));
	}

	.voice-variant h3 {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		margin: 0 0 0.75rem;
		color: var(--gold);
		font: 650 1rem var(--font-serif);
	}

	.voice-variant code {
		color: var(--muted);
		font: 500 0.78rem var(--font-mono);
	}

	.voice-variant dl {
		margin: 0.7rem 0 0;
	}

	.voice-variant dt {
		margin-bottom: 0.18rem;
		color: var(--text);
		font-size: 0.74rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.voice-variant dd {
		margin: 0;
		color: var(--muted);
		line-height: 1.5;
	}

	.voice-variant dd strong,
	.voice-variant dd span {
		display: block;
	}

	.voice-variant dd strong {
		color: var(--text);
	}

	@media (max-width: 480px) {
		.crumb {
			flex-wrap: wrap;
		}

		.profile {
			grid-template-columns: 1fr;
		}

		.voice-variants {
			grid-template-columns: 1fr;
		}
	}
</style>
