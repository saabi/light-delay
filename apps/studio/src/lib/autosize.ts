import type { Action } from 'svelte/action';

/**
 * Grows a textarea to fit its text, so wrapped lines are never hidden (review U1).
 * Refits on input, when the bound text changes, when the textarea's width changes (re-wrapping),
 * and when web fonts finish loading (metrics change).
 */
/** The parameter is the textarea's text: passing it makes Svelte call `update` when it changes. */
export const autosize: Action<HTMLTextAreaElement, string | undefined> = (node) => {
	const fit = () => {
		node.style.height = 'auto';
		node.style.height = `${node.scrollHeight}px`;
	};
	let width = node.clientWidth;
	const observer = new ResizeObserver(() => {
		if (node.clientWidth === width) return;
		width = node.clientWidth;
		fit();
	});
	observer.observe(node);
	node.addEventListener('input', fit);
	document.fonts?.addEventListener('loadingdone', fit);
	void document.fonts?.ready.then(fit);
	fit();
	return {
		update() {
			fit();
		},
		destroy() {
			observer.disconnect();
			node.removeEventListener('input', fit);
			document.fonts?.removeEventListener('loadingdone', fit);
		}
	};
};
