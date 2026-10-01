<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		ariaLabel,
		children,
		height,
		layout,
		left,
		onPointerDown,
		onResize,
		title,
		top,
		width,
		z
	}: {
		ariaLabel: string;
		children: Snippet;
		height: number;
		layout: string;
		left: number;
		onPointerDown: (e: PointerEvent) => void;
		onResize: (size: { width: number; height: number }) => void;
		title: string;
		top: number;
		width: number;
		z: number;
	} = $props();

	let root: HTMLDivElement | undefined = $state();
	let isApplyingState = false;

	$effect(() => {
		if (!root) return;
		isApplyingState = true;
		root.style.width = `${width}px`;
		root.style.height = `${height}px`;
		requestAnimationFrame(() => {
			isApplyingState = false;
		});
	});

	$effect(() => {
		if (!root) return;
		let frame = 0;
		const observer = new ResizeObserver(([entry]) => {
			const { width: observedWidth, height: observedHeight } = entry.contentRect;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				if (isApplyingState) return;
				const nextWidth = Math.round(observedWidth);
				const nextHeight = Math.round(observedHeight);
				if (nextWidth > 0 && nextHeight > 0) onResize({ width: nextWidth, height: nextHeight });
			});
		});
		observer.observe(root);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	});
</script>

<div
	bind:this={root}
	class="stage-window"
	role="group"
	aria-label={ariaLabel}
	style:left={`${left}px`}
	style:top={`${top}px`}
	style:width={`${width}px`}
	style:height={`${height}px`}
	style:z-index={z}
	onpointerdown={onPointerDown}
>
	<header class="stage-window__chrome">
		<span class="stage-window__title">{title}</span>
		<span class="stage-window__layout" data-layout={layout}>{layout}</span>
	</header>
	<div class="stage-window__body">
		{@render children()}
	</div>
</div>

<style>
	.stage-window {
		position: absolute;
		display: flex;
		flex-direction: column;
		min-width: 260px;
		min-height: 220px;
		max-width: 92vw;
		max-height: 75vh;
		resize: both;
		overflow: hidden;
		padding: 0;
		border-radius: 8px;
		background: #26344c;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
		cursor: move;
		/* Inherit the cloned sandbox root font-size; chrome below stays px-based. */
		font-size: inherit;
		scrollbar-width: none;
		touch-action: none;
		user-select: none;
	}

	.stage-window::-webkit-scrollbar {
		display: none;
	}

	.stage-window__chrome {
		/* px only: chrome must not track the demo root font-size slider (rem). */
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 9px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		background: #1c273a;
		font-family: ui-monospace, 'Cascadia Code', Menlo, monospace;
		font-size: 11px;
		line-height: 1.2;
		color: #e8eef8;
		cursor: move;
	}

	.stage-window__title {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		letter-spacing: 0.44px;
		text-transform: uppercase;
		opacity: 0.92;
	}

	.stage-window__layout {
		flex: 0 0 auto;
		padding: 2px 7px;
		border-radius: 3px;
		background: #2d6a4f;
		letter-spacing: 0.44px;
		text-transform: uppercase;
	}

	.stage-window__layout[data-layout='narrow'] {
		background: #9a3412;
	}

	.stage-window__layout[data-layout='compact'] {
		background: #1d4ed8;
	}

	.stage-window__body {
		flex: 1 1 auto;
		min-height: 0;
		padding: 4px;
		overflow: hidden;
	}

	@media (max-width: 980px) {
		.stage-window {
			width: min(84vw, 620px);
		}
	}
</style>
