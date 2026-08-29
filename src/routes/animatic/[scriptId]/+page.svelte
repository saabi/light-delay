<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import AnimaticEditor from '$lib/components/animatic/AnimaticEditor.svelte';
	import { getLocalizedScript } from '$lib/data/repositories/index';
	import { getLanguageState } from '$lib/state/language.svelte';
	import { getShotMedia } from '$lib/data/repositories/lookups';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';
	import { withLocale } from '$lib/utils/paths';
	import type { Scene, Shot } from '$lib/types/script';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import StoryLanguageNotice from '$lib/components/controls/StoryLanguageNotice.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { scriptKindLabel } from '$lib/data/selectors/scriptPresentation';

	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const language = $derived(getLanguageState());
	const script = $derived(getLocalizedScript(scriptId, language.dialogueLanguage));
	const encoded = $derived(encodeScriptId(scriptId));
	const initialShotId = $derived(
		browser ? (page.url.searchParams.get('shot') ?? undefined) : undefined
	);
	const groups = $derived.by(() => {
		const scenes = [...script.scenes].sort((a, b) => a.order - b.order);
		const shotsByScene: Record<string, Shot[]> = {};
		for (const shot of script.shots) {
			(shotsByScene[shot.sceneId] ??= []).push(shot);
		}
		for (const list of Object.values(shotsByScene)) {
			list.sort((a, b) => a.order - b.order);
		}
		return scenes.map((scene: Scene) => {
			const shots = shotsByScene[scene.id] ?? [];
			const mediaByShotId = {} as Record<string, ReturnType<typeof getShotMedia>>;
			for (const shot of shots) {
				mediaByShotId[shot.id] = getShotMedia(script, shot);
			}
			return { scene, shots, mediaByShotId };
		});
	});

	const warnings = $derived.by(() => {
		const list: string[] = [];
		for (const shot of script.shots) {
			if (getShotMedia(script, shot).state === 'missing') {
				list.push(m.animatic_missing_take_warning({ shotId: shot.id }));
			}
		}
		const extra = list.length - 8;
		if (extra > 0) {
			list.length = 8;
			list.push(m.animatic_more_warnings({ count: extra }));
		}
		return list;
	});

	onMount(() => {
		if (!initialShotId) return;
		requestAnimationFrame(() => {
			const card = document.getElementById(initialShotId);
			if (!card) return;
			card.scrollIntoView({ block: 'center' });
			card.focus({ preventScroll: true });
		});
	});
</script>

<main class="page">
	<PageHeader
		eyebrow={m.animatic_label()}
		title={script.script.title}
		lede={m.animatic_editor_lede()}
		meta={[
			`${script.shots.length} ${m.animatic_shots()}`,
			`${script.scenes.length} ${m.script_scenes()}`,
			scriptKindLabel(script.script.kind)
		]}
	/>
	<StoryLanguageNotice />
	{#key `${script.script.id}:${script.script.version}`}
		<AnimaticEditor
			{groups}
			{script}
			scriptId={script.script.id}
			scriptVersion={script.script.version}
			playerHref={withLocale(`/animatic/${encoded}/player`)}
			targetDurationMs={script.script.targetDurationMs}
			{warnings}
			{initialShotId}
		/>
	{/key}
</main>

<style>
	.page {
		max-width: min(1600px, 100%);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}
</style>
