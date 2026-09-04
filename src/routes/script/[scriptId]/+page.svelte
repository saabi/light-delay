<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import ScriptViewer from '$lib/components/script/ScriptViewer.svelte';
	import DurationPair from '$lib/components/timing/DurationPair.svelte';
	import { getLocalizedScript } from '$lib/data/repositories/index';
	import { estimateScriptSpokenMs, montageScriptMs } from '$lib/data/selectors/dialogueTiming';
	import { getLanguageState } from '$lib/state/language.svelte';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';
	import { withLocale } from '$lib/utils/paths';
	import type { Beat, Cue, Scene } from '$lib/types/script';
	import { page } from '$app/state';
	import StoryLanguageNotice from '$lib/components/controls/StoryLanguageNotice.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { scriptKindLabel, scriptStatusLabel } from '$lib/data/selectors/scriptPresentation';
	import { storyText } from '$lib/data/selectors/localized';

	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const language = $derived(getLanguageState());
	const script = $derived(getLocalizedScript(scriptId, language.dialogueLanguage));
	const scriptMontageMs = $derived(montageScriptMs(script));
	const scriptSpokenMs = $derived(estimateScriptSpokenMs(script, language.dialogueLanguage));
	const outlineHref = $derived(withLocale(`/outline/${encodeScriptId(scriptId)}`));

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
	<PageHeader
		eyebrow={script.script.kind === 'festival_cut' ? 'Festival Cut' : m.script_label()}
		title={storyText(script.script.title, language.dialogueLanguage)}
		lede={m.script_structured_lede()}
		meta={[
			`v${script.script.version}`,
			`${script.scenes.length} ${m.script_scenes()}`,
			scriptStatusLabel(script.script.status),
			scriptKindLabel(script.script.kind)
		]}
	/>
	<StoryLanguageNotice />
	{#if script.scenes.length === 0}
		<div class="empty" role="status">
			<h2>{m.script_empty_title()}</h2>
			<p>{m.script_empty_body()}</p>
			<a href={outlineHref}>{m.script_open_outline()}</a>
		</div>
	{:else}
		<p class="timing-lede">{m.timing_compare_lede()}</p>
		<p class="timing-total">
			<DurationPair montageMs={scriptMontageMs} spokenMs={scriptSpokenMs} />
		</p>
		<ScriptViewer
			acts={script.acts}
			{scenesById}
			{beatsBySceneId}
			{cuesByBeatId}
			characterFunctionAssignments={script.script.characterFunctionAssignments}
			{script}
			dialogueLanguage={language.dialogueLanguage}
		/>
	{/if}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.timing-lede {
		margin: 0.5rem 0 0.35rem;
		color: var(--muted);
		font-size: 0.88rem;
	}

	.timing-total {
		margin: 0 0 1rem;
	}
	.empty {
		padding: 1.2rem;
		border: 1px dashed var(--line);
		border-radius: 12px;
		background: var(--panel2);
	}
	.empty h2 {
		margin-top: 0;
		font-family: var(--font-serif);
	}
	.empty a {
		color: var(--cyan);
	}
</style>
