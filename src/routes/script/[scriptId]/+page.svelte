<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import LanguageControls from '$lib/components/controls/LanguageControls.svelte';
	import ScriptViewer from '$lib/components/script/ScriptViewer.svelte';
	import DurationPair from '$lib/components/timing/DurationPair.svelte';
	import { getLocalizedScript } from '$lib/data/repositories/index';
	import { estimateScriptSpokenMs, montageScriptMs } from '$lib/data/selectors/dialogueTiming';
	import { getLanguageState } from '$lib/state/language.svelte';
	import { decodeScriptId } from '$lib/utils/scriptId';
	import type { Beat, Cue, Scene } from '$lib/types/script';
	import { page } from '$app/state';
	import StoryLanguageNotice from '$lib/components/controls/StoryLanguageNotice.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { scriptKindLabel, scriptStatusLabel } from '$lib/data/selectors/scriptPresentation';

	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const language = $derived(getLanguageState());
	const script = $derived(getLocalizedScript(scriptId, language.dialogueLanguage));
	const scriptMontageMs = $derived(montageScriptMs(script));
	const scriptSpokenMs = $derived(estimateScriptSpokenMs(script, language.dialogueLanguage));

	const scenesById = $derived(
		Object.fromEntries(script.scenes.map((s) => [s.id, s])) as Record<string, Scene>
	);

	const beatsBySceneId = $derived.by(() => {
		const map: Record<string, Beat[]> = {};
		for (const beat of script.beats) {
			(map[beat.sceneId] ??= []).push(beat);
		}
		for (const list of Object.values(map)) {
			list.sort((a, b) => a.order - b.order);
		}
		return map;
	});

	const cuesByBeatId = $derived.by(() => {
		const map: Record<string, Cue[]> = {};
		for (const cue of script.cues) {
			(map[cue.beatId] ??= []).push(cue);
		}
		for (const list of Object.values(map)) {
			list.sort((a, b) => a.order - b.order);
		}
		return map;
	});
</script>

<main class="page">
	<div class="head-row">
		<PageHeader
			eyebrow={script.script.kind === 'festival_cut' ? 'Festival Cut' : m.script_label()}
			title={script.script.title}
			lede={m.script_structured_lede()}
			meta={[
				`v${script.script.version}`,
				`${script.scenes.length} ${m.script_scenes()}`,
				scriptStatusLabel(script.script.status),
				scriptKindLabel(script.script.kind)
			]}
		/>
		<LanguageControls />
	</div>
	<p class="timing-lede">{m.timing_compare_lede()}</p>
	<p class="timing-total">
		<DurationPair montageMs={scriptMontageMs} spokenMs={scriptSpokenMs} />
	</p>
	<StoryLanguageNotice />
	<ScriptViewer
		acts={script.acts}
		{scenesById}
		{beatsBySceneId}
		{cuesByBeatId}
		characterFunctionAssignments={script.script.characterFunctionAssignments}
		{script}
		dialogueLanguage={language.dialogueLanguage}
	/>
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.head-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1.25rem;
		align-items: start;
		margin-bottom: 0.5rem;
	}

	.timing-lede {
		margin: 0 0 0.35rem;
		color: var(--muted);
		font-size: 0.88rem;
	}

	.timing-total {
		margin: 0 0 1rem;
	}

	@media (max-width: 560px) {
		.head-row > :global(*) {
			width: 100%;
		}
	}
</style>
