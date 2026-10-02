<script lang="ts">
	/* Bundled faces (WOFF2, unicode-range subsets); nothing is loaded from remote services. */
	import '@fontsource-variable/inter/wght.css';
	import '@fontsource/courier-prime/400.css';
	import '@fontsource/courier-prime/400-italic.css';
	import '@fontsource/courier-prime/700.css';
	import '../studio.css';
	let { children } = $props();
</script>

{@render children()}
