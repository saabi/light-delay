<script lang="ts">
	import { page } from '$app/state';
	import AnimaticPlayer from '$lib/components/animatic/AnimaticPlayer.svelte';
	import { getScript } from '$lib/data/repositories/index';
	import { getCueById, getShotMedia } from '$lib/data/repositories/lookups';
	import { setShotIndex } from '$lib/state/player.svelte';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';
	import { withLocale } from '$lib/utils/paths';
	import type { Cue, Shot } from '$lib/types/script';
	import { onMount } from 'svelte';

	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const script = $derived(getScript(scriptId));
	const encoded = $derived(encodeScriptId(scriptId));

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

<AnimaticPlayer {script} {shots} returnHref={withLocale(`/animatic/${encoded}`)} />
