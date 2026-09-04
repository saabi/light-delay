<script lang="ts">
	import { page } from '$app/state';
	import AnimaticPlayer from '$lib/components/animatic/AnimaticPlayer.svelte';
	import { getLocalizedScript } from '$lib/data/repositories/index';
	import { getLanguageState } from '$lib/state/language.svelte';
	import { getCueById, getShotMedia } from '$lib/data/repositories/lookups';
	import { setShotIndex } from '$lib/state/player.svelte';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';
	import { withLocale } from '$lib/utils/paths';
	import type { Cue, Shot } from '$lib/types/script';
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { storyText } from '$lib/data/selectors/localized';
	import * as m from '$lib/paraglide/messages.js';

	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const language = $derived(getLanguageState());
	const script = $derived(getLocalizedScript(scriptId, language.dialogueLanguage));
	const encoded = $derived(encodeScriptId(scriptId));
	const outlineHref = $derived(withLocale(`/outline/${encoded}`));

	const orderedShots = $derived(
		[...script.shots].sort((a, b) => {
			if (a.sceneId === b.sceneId) return a.order - b.order;
			const sa = script.scenes.find((s) => s.id === a.sceneId)?.order ?? 0;
			const sb = script.scenes.find((s) => s.id === b.sceneId)?.order ?? 0;
			return sa - sb || a.order - b.order;
		})
	);

	const shots = $derived(
		orderedShots.map((shot: Shot) => {
			const cues: Cue[] = [];
			for (const placement of shot.cuePlacements) {
				const cue = getCueById(script, placement.cueId);
				if (cue) cues.push(cue);
			}
			return {
				shot,
				media: getShotMedia(script, shot),
				cues
			};
		})
	);

	onMount(() => {
		const shotParam = page.url.searchParams.get('shot');
		if (!shotParam) return;
		const idx = orderedShots.findIndex((s) => s.id === shotParam);
		if (idx >= 0) setShotIndex(idx);
	});
</script>

{#if shots.length === 0}
	<main class="empty-page">
		<PageHeader
			eyebrow={m.animatic_label()}
			title={storyText(script.script.title, language.dialogueLanguage)}
			lede={m.animatic_empty_body()}
			meta={[m.animatic_empty_title()]}
		/>
		<a href={outlineHref}>{m.animatic_open_outline()}</a>
	</main>
{:else}
	<AnimaticPlayer {script} {shots} returnHref={withLocale(`/animatic/${encoded}`)} />
{/if}

<style>
	.empty-page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}
	.empty-page a {
		color: var(--cyan);
	}
</style>
