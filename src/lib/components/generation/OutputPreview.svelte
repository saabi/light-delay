<script lang="ts">
	import { withBase } from '$lib/utils/paths';
	import * as m from '$lib/paraglide/messages.js';

	let {
		kind,
		path,
		label,
		present
	}: {
		kind: string;
		path: string | null;
		label: string;
		present: boolean;
	} = $props();

	let failed = $state(false);

	function onError() {
		failed = true;
	}
</script>

{#if !present || !path || failed}
	<div class="missing" role="status">{m.generation_media_missing()}: {label}</div>
{:else if kind === 'audio'}
	<audio controls preload="metadata" src={withBase(path)}>
		<track kind="captions" />
	</audio>
{:else if kind === 'video'}
	<video controls preload="metadata" src={withBase(path)}>
		<track kind="captions" />
	</video>
{:else}
	<img src={withBase(path)} alt={label} loading="lazy" onerror={onError} />
{/if}

<style>
	img,
	video {
		display: block;
		width: 100%;
		max-height: 280px;
		object-fit: contain;
		border-radius: 8px;
		background: #0a121a;
	}

	audio {
		width: 100%;
	}

	.missing {
		padding: 0.75rem;
		border: 1px dashed var(--line);
		border-radius: 8px;
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
