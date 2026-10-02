<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { EditorView } from 'prosemirror-view';
	import type { Command } from 'prosemirror-state';
	import type { ScreenplayElement, ScreenplayElementKind } from '@light-delay/v2-core';
	import {
		createEditorState,
		currentElement,
		elementKinds,
		elementsFromDocument,
		kindLabels,
		moveElement,
		parsePlainText,
		removeElement,
		setElementKind,
		syncSelectionFromDOM
	} from './index';
	import 'prosemirror-view/style/prosemirror.css';
	import './screenplay.css';

	let {
		elements,
		contentKey,
		committedKinds,
		editable = true,
		onchange
	}: {
		/** Initial content; read again only when `contentKey` changes. */
		elements: readonly ScreenplayElement[];
		/** Change it to replace the document from outside (load, commit, restore). Resets undo. */
		contentKey: number;
		/** Kinds of committed element identities, so retyping gives a new identity. */
		committedKinds: ReadonlyMap<string, ScreenplayElementKind>;
		editable?: boolean;
		onchange: (elements: ScreenplayElement[]) => void;
	} = $props();

	let host: HTMLDivElement;
	let view: EditorView | undefined;
	let focused = $state(false);
	let handle = $state<{ top: number; kind: ScreenplayElementKind }>();
	let menuOpen = $state(false);
	let menu = $state<HTMLDivElement>();
	let handleButton = $state<HTMLButtonElement>();
	const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
	const shortcut = (index: number) => (mac ? `⌘⌥${index}` : `Ctrl+Alt+${index}`);

	function updateHandle() {
		if (!view) return;
		const current = currentElement(view.state);
		const dom = current && (view.nodeDOM(current.pos) as HTMLElement | null);
		handle = dom ? { top: dom.offsetTop, kind: current.node.attrs.kind } : undefined;
	}

	onMount(() => {
		let lastKey = contentKey;
		view = new EditorView(host, {
			state: createEditorState(elements),
			editable: () => editable,
			clipboardTextParser: (text) => parsePlainText(text),
			attributes: {
				class: 'screenplay-editor',
				role: 'textbox',
				'aria-multiline': 'true',
				'aria-label': 'Screenplay text',
				spellcheck: 'true'
			},
			handleKeyDown: (editor, event) => {
				if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
					syncSelectionFromDOM(editor);
					void openMenu();
					return true;
				}
				return false;
			},
			dispatchTransaction(tr) {
				if (!view) return;
				const next = view.state.apply(tr);
				view.updateState(next);
				updateHandle();
				if (tr.docChanged) onchange(elementsFromDocument(next.doc, committedKinds));
			}
		});
		updateHandle();
		const reset = $effect.root(() => {
			$effect(() => {
				const key = contentKey;
				if (key === lastKey) return;
				lastKey = key;
				untrack(() => {
					view?.updateState(createEditorState(elements));
					menuOpen = false;
					updateHandle();
				});
			});
			$effect(() => {
				const canEdit = editable;
				untrack(() => view?.setProps({ editable: () => canEdit }));
			});
		});
		const resize = new ResizeObserver(updateHandle);
		resize.observe(host);
		return () => {
			reset();
			resize.disconnect();
			view?.destroy();
		};
	});

	/* Close the element menu on any press outside it. */
	$effect(() => {
		if (!menuOpen) return;
		const close = (event: PointerEvent) => {
			const target = event.target as Node;
			if (!menu?.contains(target) && !handleButton?.contains(target)) menuOpen = false;
		};
		window.addEventListener('pointerdown', close);
		return () => window.removeEventListener('pointerdown', close);
	});

	async function openMenu() {
		updateHandle();
		menuOpen = true;
		await tick();
		menu?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
	}

	function closeMenu() {
		menuOpen = false;
		view?.focus();
	}

	function run(command: Command) {
		if (!view) return;
		command(view.state, view.dispatch);
		closeMenu();
	}

	function menuKeydown(event: KeyboardEvent) {
		const items = [...(menu?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
		const index = items.indexOf(document.activeElement as HTMLElement);
		if (event.key === 'Escape' || event.key === 'Tab') {
			event.preventDefault();
			closeMenu();
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const step = event.key === 'ArrowDown' ? 1 : -1;
			items[(index + step + items.length) % items.length]?.focus();
		} else if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
		}
	}

	export function focus() {
		view?.focus();
	}
</script>

<div
	class="editor-host"
	bind:this={host}
	onfocusin={() => (focused = true)}
	onfocusout={(event) => {
		if (!host.contains(event.relatedTarget as Node)) focused = false;
	}}
>
	{#if handle && (focused || menuOpen) && editable}
		<!-- Element actions: a gutter handle beside the current element, with keyboard equivalents. -->
		<button
			bind:this={handleButton}
			class="gutter-handle"
			style:top="{handle.top}px"
			aria-label="{kindLabels[handle.kind]} actions"
			aria-haspopup="menu"
			aria-expanded={menuOpen}
			onmousedown={(event) => event.preventDefault()}
			onclick={() => (menuOpen ? closeMenu() : openMenu())}
			><span aria-hidden="true">⋮⋮</span></button
		>
		{#if menuOpen}
			<div
				bind:this={menu}
				class="element-menu"
				role="menu"
				aria-label="Element actions"
				tabindex="-1"
				style:top="calc({handle.top}px + 1.75rem)"
				onkeydown={menuKeydown}
			>
				<button
					role="menuitem"
					tabindex="-1"
					aria-keyshortcuts="Alt+ArrowUp"
					onclick={() => run(moveElement(-1))}
					>Move up<kbd aria-hidden="true">{mac ? '⌥↑' : 'Alt+↑'}</kbd></button
				>
				<button
					role="menuitem"
					tabindex="-1"
					aria-keyshortcuts="Alt+ArrowDown"
					onclick={() => run(moveElement(1))}
					>Move down<kbd aria-hidden="true">{mac ? '⌥↓' : 'Alt+↓'}</kbd></button
				>
				<div class="menu-label" role="presentation">Type</div>
				{#each elementKinds as kind, index (kind)}
					<button
						role="menuitemradio"
						aria-checked={handle.kind === kind}
						tabindex="-1"
						aria-keyshortcuts="{mac ? 'Meta' : 'Control'}+Alt+{index + 1}"
						onclick={() => run(setElementKind(kind))}
						>{kindLabels[kind]}<kbd aria-hidden="true">{shortcut(index + 1)}</kbd></button
					>
				{/each}
				<button role="menuitem" tabindex="-1" class="danger" onclick={() => run(removeElement)}
					>Remove</button
				>
			</div>
		{/if}
	{/if}
</div>

<style>
	.editor-host {
		position: relative;
	}
	.gutter-handle {
		position: absolute;
		z-index: 2;
		left: -4ch;
		width: 1.5rem;
		height: 1.5rem;
		margin-top: -0.25rem;
		padding: 0;
		border: 0;
		border-radius: var(--studio-radius-sm);
		background: transparent;
		color: var(--studio-text-muted);
		font-family: var(--studio-font-ui);
		font-size: var(--studio-text-sm);
		letter-spacing: -0.2em;
		cursor: pointer;
	}
	.gutter-handle:hover,
	.gutter-handle[aria-expanded='true'] {
		background: var(--studio-surface-subtle);
		color: var(--studio-text);
	}
	:global(.marginless) .gutter-handle {
		left: -1.75rem;
	}
	.element-menu {
		position: absolute;
		z-index: 20;
		left: -4ch;
		min-width: 15rem;
		display: flex;
		flex-direction: column;
		padding: 0.25rem;
		border: 1px solid var(--studio-hairline);
		border-radius: var(--studio-radius-md);
		background: var(--studio-surface);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
		font-family: var(--studio-font-ui);
		font-size: var(--studio-text-ui);
		line-height: var(--studio-line-height);
	}
	:global(.marginless) .element-menu {
		left: -1.75rem;
	}
	.element-menu button {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		text-align: left;
		border: 0;
		border-radius: var(--studio-radius-sm);
		background: transparent;
		color: var(--studio-text);
		padding: 0.375rem 0.625rem 0.375rem 1.5rem;
		cursor: pointer;
		position: relative;
	}
	.element-menu button:hover,
	.element-menu button:focus-visible {
		background: var(--studio-surface-subtle);
	}
	.element-menu button[aria-checked='true']::before {
		/* Decorative: the checked state is announced from aria-checked, not read as a character. */
		content: '✓' / '';
		position: absolute;
		left: 0.5rem;
	}
	.element-menu kbd {
		font-family: inherit;
		color: var(--studio-text-muted);
	}
	.element-menu .danger {
		color: var(--studio-danger);
		margin-top: 0.25rem;
		border-top: 1px solid var(--studio-hairline);
		border-radius: 0;
	}
	.menu-label {
		padding: 0.5rem 0.625rem 0.125rem;
		font-size: var(--studio-text-xs);
		color: var(--studio-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
</style>
