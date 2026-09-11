<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type {
		ConvertSettings,
		QwenRegenSettings,
		StudioDefaults,
		StudioEngineMode
	} from '$lib/studio/types';

	let {
		mode = 'seedvc',
		settings,
		qwenSettings,
		defaults,
		lang = 'es',
		canConvert = false,
		canRegenerate = false,
		converting = false,
		assembling = false,
		purging = false,
		assembledHref = null,
		onmode,
		onchange,
		onqwenchange,
		onconvert,
		onregenerate,
		onassemble,
		onpurge
	}: {
		mode?: StudioEngineMode;
		settings: ConvertSettings;
		qwenSettings: QwenRegenSettings;
		defaults: StudioDefaults | null;
		lang?: 'es' | 'en';
		canConvert?: boolean;
		canRegenerate?: boolean;
		converting?: boolean;
		assembling?: boolean;
		purging?: boolean;
		assembledHref?: string | null;
		onmode: (mode: StudioEngineMode) => void;
		onchange: (next: ConvertSettings) => void;
		onqwenchange: (next: QwenRegenSettings) => void;
		onconvert: () => void;
		onregenerate: () => void;
		onassemble: () => void;
		onpurge: () => void;
	} = $props();

	const pitch = $derived(defaults?.bounds.semi_tone_shift);
	const steps = $derived(defaults?.bounds.diffusion_steps);
	const length = $derived(defaults?.bounds.length_adjust);
	const cfg = $derived(defaults?.bounds.inference_cfg_rate);
	const qwenBounds = $derived(defaults?.qwen?.[lang]?.bounds);
	const title = $derived(mode === 'qwen' ? m.studio_qwen_tweak() : m.studio_tweak());

	function numberValue(event: Event): number {
		return Number((event.currentTarget as HTMLInputElement).value);
	}

	function textValue(event: Event): string {
		return (event.currentTarget as HTMLTextAreaElement).value;
	}
</script>

<section class="tweaks" aria-label={title}>
	<h2>{title}</h2>

	<fieldset class="mode">
		<legend>{m.studio_mode()}</legend>
		<label class="mode-option">
			<input
				type="radio"
				name="studio-engine-mode"
				value="seedvc"
				checked={mode === 'seedvc'}
				onchange={() => onmode('seedvc')}
			/>
			{m.studio_mode_seedvc()}
		</label>
		<label class="mode-option">
			<input
				type="radio"
				name="studio-engine-mode"
				value="qwen"
				checked={mode === 'qwen'}
				onchange={() => onmode('qwen')}
			/>
			{m.studio_mode_qwen()}
		</label>
	</fieldset>

	{#if mode === 'seedvc'}
		<label>
			<input
				type="checkbox"
				checked={settings.autoF0Adjust}
				onchange={(event) =>
					onchange({
						...settings,
						autoF0Adjust: (event.currentTarget as HTMLInputElement).checked
					})}
			/>
			{m.studio_auto_f0()}
			<span>{settings.autoF0Adjust ? m.studio_on() : m.studio_off()}</span>
		</label>
		<label class="locked">
			<input type="checkbox" checked disabled />
			{m.studio_f0_locked()}
			<span>{m.studio_on()}</span>
		</label>
		<label>
			{m.studio_pitch()}
			<input
				type="number"
				value={settings.semiToneShift}
				min={pitch?.min}
				max={pitch?.max}
				oninput={(event) => onchange({ ...settings, semiToneShift: numberValue(event) })}
			/>
		</label>
		<label>
			{m.studio_steps()}
			<input
				type="number"
				value={settings.diffusionSteps}
				min={steps?.min}
				max={steps?.max}
				oninput={(event) => onchange({ ...settings, diffusionSteps: numberValue(event) })}
			/>
		</label>
		<label>
			{m.studio_length()}
			<input
				type="number"
				step="0.01"
				value={settings.lengthAdjust}
				min={length?.min}
				max={length?.max}
				oninput={(event) => onchange({ ...settings, lengthAdjust: numberValue(event) })}
			/>
		</label>
		<label>
			{m.studio_cfg()}
			<input
				type="number"
				step="0.01"
				value={settings.inferenceCfgRate}
				min={cfg?.min}
				max={cfg?.max}
				oninput={(event) => onchange({ ...settings, inferenceCfgRate: numberValue(event) })}
			/>
		</label>
	{:else}
		<details class="param-help-intro">
			<summary>{m.studio_param_help()}</summary>
			<p class="help-body">{m.studio_qwen_help_intro()}</p>
		</details>
		<label>
			<span class="field-head">
				<span class="field-title">{m.studio_temperature()}</span>
				<details class="param-help">
					<summary aria-label={m.studio_param_help()}>?</summary>
					<div class="help-body">{m.studio_help_temperature()}</div>
				</details>
			</span>
			<input
				type="number"
				step="0.01"
				value={qwenSettings.temperature}
				min={qwenBounds?.temperature?.min}
				max={qwenBounds?.temperature?.max}
				oninput={(event) =>
					onqwenchange({ ...qwenSettings, temperature: numberValue(event) })}
			/>
		</label>
		<label>
			<span class="field-head">
				<span class="field-title">{m.studio_top_p()}</span>
				<details class="param-help">
					<summary aria-label={m.studio_param_help()}>?</summary>
					<div class="help-body">{m.studio_help_top_p()}</div>
				</details>
			</span>
			<input
				type="number"
				step="0.01"
				value={qwenSettings.topP}
				min={qwenBounds?.top_p?.min}
				max={qwenBounds?.top_p?.max}
				oninput={(event) => onqwenchange({ ...qwenSettings, topP: numberValue(event) })}
			/>
		</label>
		<label>
			<span class="field-head">
				<span class="field-title">{m.studio_top_k()}</span>
				<details class="param-help">
					<summary aria-label={m.studio_param_help()}>?</summary>
					<div class="help-body">{m.studio_help_top_k()}</div>
				</details>
			</span>
			<input
				type="number"
				value={qwenSettings.topK}
				min={qwenBounds?.top_k?.min}
				max={qwenBounds?.top_k?.max}
				oninput={(event) => onqwenchange({ ...qwenSettings, topK: numberValue(event) })}
			/>
		</label>
		<label>
			<span class="field-head">
				<span class="field-title">{m.studio_max_tokens()}</span>
				<details class="param-help">
					<summary aria-label={m.studio_param_help()}>?</summary>
					<div class="help-body">{m.studio_help_max_tokens()}</div>
				</details>
			</span>
			<input
				type="number"
				value={qwenSettings.maxNewTokens}
				min={qwenBounds?.max_new_tokens?.min}
				max={qwenBounds?.max_new_tokens?.max}
				oninput={(event) =>
					onqwenchange({ ...qwenSettings, maxNewTokens: numberValue(event) })}
			/>
		</label>
		<label>
			<span class="field-head">
				<span class="field-title">{m.studio_repetition()}</span>
				<details class="param-help">
					<summary aria-label={m.studio_param_help()}>?</summary>
					<div class="help-body">{m.studio_help_repetition()}</div>
				</details>
			</span>
			<input
				type="number"
				step="0.01"
				value={qwenSettings.repetitionPenalty}
				min={qwenBounds?.repetition_penalty?.min}
				max={qwenBounds?.repetition_penalty?.max}
				oninput={(event) =>
					onqwenchange({ ...qwenSettings, repetitionPenalty: numberValue(event) })}
			/>
		</label>
		<label>
			<span class="field-head">
				<span class="field-title">{m.studio_line_instruct()}</span>
				<details class="param-help">
					<summary aria-label={m.studio_param_help()}>?</summary>
					<div class="help-body">{m.studio_help_line_instruct()}</div>
				</details>
			</span>
			<textarea
				rows="3"
				value={qwenSettings.instruct}
				oninput={(event) => onqwenchange({ ...qwenSettings, instruct: textValue(event) })}
			></textarea>
		</label>
		<label>
			<span class="field-head">
				<span class="field-title">{m.studio_expressiveness()}</span>
				<details class="param-help">
					<summary aria-label={m.studio_param_help()}>?</summary>
					<div class="help-body">{m.studio_help_expressiveness()}</div>
				</details>
			</span>
			<textarea
				rows="2"
				value={qwenSettings.expressivenessPrefix}
				oninput={(event) =>
					onqwenchange({ ...qwenSettings, expressivenessPrefix: textValue(event) })}
			></textarea>
		</label>
		<label class="advanced">
			<span class="field-head">
				<span class="field-title">{m.studio_default_instruct()}</span>
				<details class="param-help">
					<summary aria-label={m.studio_param_help()}>?</summary>
					<div class="help-body">{m.studio_help_default_instruct()}</div>
				</details>
			</span>
			<textarea
				rows="2"
				value={qwenSettings.defaultInstruct}
				oninput={(event) =>
					onqwenchange({ ...qwenSettings, defaultInstruct: textValue(event) })}
			></textarea>
		</label>
	{/if}

	<div class="actions">
		{#if mode === 'seedvc'}
			<button
				type="button"
				disabled={!canConvert || converting || assembling || purging}
				onclick={onconvert}
				>{converting ? m.studio_converting() : m.studio_convert()}</button
			>
		{:else}
			<button
				type="button"
				disabled={!canRegenerate || converting || assembling || purging}
				onclick={onregenerate}
				>{converting ? m.studio_regenerating() : m.studio_regenerate()}</button
			>
		{/if}
		<button type="button" disabled={assembling || converting || purging} onclick={onassemble}
			>{assembling ? m.studio_assembling() : m.studio_assemble()}</button
		>
		{#if assembledHref}
			<a href={assembledHref} download>{m.studio_download()}</a>
		{/if}
		<button type="button" disabled={assembling || converting || purging} onclick={onpurge}
			>{purging ? m.studio_purging() : m.studio_purge_takes()}</button
		>
	</div>
</section>

<style>
	.tweaks {
		display: grid;
		gap: 0.65rem;
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--panel);
		color: var(--ink);
		min-width: 0;
		max-width: 100%;
		box-sizing: border-box;
		overflow-x: hidden;
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
	}

	.mode {
		display: grid;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		border: 0;
	}

	.mode legend {
		padding: 0;
		color: var(--muted);
		font-size: 0.85rem;
	}

	.mode-option {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--ink);
	}

	label {
		display: grid;
		gap: 0.3rem;
		color: var(--muted);
		font-size: 0.85rem;
		min-width: 0;
	}

	.field-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
	}

	.field-title {
		flex: 1 1 auto;
		min-width: 0;
	}

	.param-help-intro {
		margin: 0;
		color: var(--muted);
		font-size: 0.85rem;
		min-width: 0;
	}

	.param-help-intro summary {
		cursor: pointer;
		list-style: none;
		color: var(--ink);
	}

	.param-help-intro summary::-webkit-details-marker {
		display: none;
	}

	.param-help {
		flex: 0 0 auto;
		margin: 0;
		min-width: 0;
		max-width: 100%;
	}

	.param-help[open] {
		flex: 1 1 100%;
	}

	.param-help summary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.15rem;
		height: 1.15rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		color: var(--muted);
		font-size: 0.7rem;
		line-height: 1;
		cursor: pointer;
		list-style: none;
		user-select: none;
	}

	.param-help summary::-webkit-details-marker {
		display: none;
	}

	.help-body {
		margin: 0.35rem 0 0;
		padding: 0.35rem 0.45rem;
		max-width: 100%;
		box-sizing: border-box;
		color: var(--muted);
		font-size: 0.8rem;
		line-height: 1.35;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.locked,
	.advanced {
		color: var(--muted);
	}

	input[type='number'],
	textarea {
		width: 100%;
		min-width: 0;
		max-width: 100%;
		box-sizing: border-box;
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: transparent;
		color: var(--ink);
		font: inherit;
	}

	textarea {
		resize: vertical;
		min-height: 2.5rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	button,
	a {
		padding: 0.4rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: transparent;
		color: var(--ink);
		text-decoration: none;
		cursor: pointer;
	}

	button:disabled {
		color: var(--muted);
		cursor: not-allowed;
	}

	a {
		color: var(--green);
	}
</style>
