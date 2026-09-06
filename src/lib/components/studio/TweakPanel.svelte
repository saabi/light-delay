<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { ConvertSettings, StudioDefaults } from '$lib/studio/types';

	let {
		settings,
		defaults,
		canConvert = false,
		converting = false,
		assembling = false,
		assembledHref = null,
		onchange,
		onconvert,
		onassemble
	}: {
		settings: ConvertSettings;
		defaults: StudioDefaults | null;
		canConvert?: boolean;
		converting?: boolean;
		assembling?: boolean;
		assembledHref?: string | null;
		onchange: (next: ConvertSettings) => void;
		onconvert: () => void;
		onassemble: () => void;
	} = $props();

	const pitch = $derived(defaults?.bounds.semi_tone_shift);
	const steps = $derived(defaults?.bounds.diffusion_steps);
	const length = $derived(defaults?.bounds.length_adjust);
	const cfg = $derived(defaults?.bounds.inference_cfg_rate);

	function numberValue(event: Event): number {
		return Number((event.currentTarget as HTMLInputElement).value);
	}
</script>

<section class="tweaks" aria-label={m.studio_tweak()}>
	<h2>{m.studio_tweak()}</h2>
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
	<div class="actions">
		<button type="button" disabled={!canConvert || converting || assembling} onclick={onconvert}
			>{converting ? m.studio_converting() : m.studio_convert()}</button
		>
		<button type="button" disabled={assembling || converting} onclick={onassemble}
			>{assembling ? m.studio_assembling() : m.studio_assemble()}</button
		>
		{#if assembledHref}
			<a href={assembledHref} download>{m.studio_download()}</a>
		{/if}
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
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
	}

	label {
		display: grid;
		gap: 0.3rem;
		color: var(--muted);
		font-size: 0.85rem;
	}

	.locked {
		color: var(--muted);
	}

	input[type='number'] {
		width: 100%;
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: transparent;
		color: var(--ink);
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
