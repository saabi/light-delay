<script lang="ts">
	import { page } from '$app/state';
	import AnimaticPlayer from '$lib/components/animatic/AnimaticPlayer.svelte';
	import { getScript } from '$lib/data/repositories/index';
	import { getCueById, getShotImagePath } from '$lib/data/repositories/lookups';
	import { setShotIndex } from '$lib/state/player.svelte';
	import type { Cue, Shot } from '$lib/types/script';
	import { onMount } from 'svelte';

	const script = getScript();
	const orderedShots = [...script.shots].sort((a, b) => {
		if (a.sceneId === b.sceneId) return a.order - b.order;
		const sa = script.scenes.find((s) => s.id === a.sceneId)?.order ?? 0;
		const sb = script.scenes.find((s) => s.id === b.sceneId)?.order ?? 0;
		return sa - sb || a.order - b.order;
	});

	const shots = orderedShots.map((shot: Shot) => {
		const cues: Cue[] = [];
		for (const placement of shot.cuePlacements) {
			const cue = getCueById(placement.cueId);
			if (cue) cues.push(cue);
		}
		return {
			shot,
			imageSrc: getShotImagePath(shot),
			cues
		};
	});

	onMount(() => {
		const shotParam = page.url.searchParams.get('shot');
		if (!shotParam) return;
		const idx = orderedShots.findIndex((s) => s.id === shotParam);
		if (idx >= 0) setShotIndex(idx);
	});
</script>

<AnimaticPlayer {script} {shots} returnHref="/animatic" />
