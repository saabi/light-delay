<script lang="ts">
	let inspectorOpen = $state(false);
	let modelNoticeOpen = $state(false);
	let assistantOpen = $state(false);
	let selectionTools = $state(false);

	function showSelectionTools() {
		const selection = window.getSelection();
		selectionTools = Boolean(selection && !selection.isCollapsed && selection.toString().trim());
	}
</script>

<svelte:head>
	<title>Write · Light Delay v2</title>
	<meta name="description" content="Low-intrusion writing workspace prototype for Light Delay v2" />
</svelte:head>

<div class="write-shell" class:inspector-open={inspectorOpen}>
	<header class="topbar">
		<div class="project">
			<button class="mark" aria-label="Open project">LD</button>
			<div>
				<strong>Light Delay</strong>
				<span>Master narrative</span>
			</div>
		</div>

		<nav aria-label="Workspace lenses">
			<a class="active" href="/v2/write">Write</a>
			<a href="/v2/story">Story</a>
			<a href="/v2/world">World</a>
			<a href="/v2/navigate">Navigate</a>
			<a href="/v2/direct">Direct</a>
			<a href="/v2/produce">Produce</a>
			<a href="/v2/review">Review</a>
		</nav>

		<div class="tools">
			<button class="quiet" onclick={() => (modelNoticeOpen = !modelNoticeOpen)} aria-label="Model activity">
				<span class="status-dot"></span><span class="wide">Model</span>
			</button>
			<button class="quiet" onclick={() => (assistantOpen = !assistantOpen)} aria-label="Open assistant">✦</button>
			<button class="quiet" onclick={() => (inspectorOpen = !inspectorOpen)} aria-label="Toggle inspector">···</button>
		</div>
	</header>

	<main class="workspace">
		<section class="document-wrap">
			<div class="document-meta">
				<span>Scene 12</span>
				<span class="saved">Saved</span>
			</div>

			<article
				class="page"
				contenteditable="true"
				role="textbox"
				aria-multiline="true"
				aria-label="Screenplay editor"
				onmouseup={showSelectionTools}
				onkeyup={showSelectionTools}
				onblur={() => (selectionTools = false)}
			>
				<p class="slug">INT. CELESTIAL ARDOR — BRIDGE — CONTINUOUS</p>
				<p>The bridge settles into the low mechanical hum of acceleration. Sorell releases the table restraint and looks across the central opening.</p>
				<p>Harlan is no longer at his station.</p>
				<p class="character">SORELL</p>
				<p class="dialogue">Where is he?</p>
				<p>Rao checks the service display. A warning blooms beside the hatch indicator.</p>
				<p class="character">RAO</p>
				<p class="dialogue">Service cylinder. He cut the local link.</p>
				<p>Sorell pushes away from the table, then catches herself. Under thrust, the open shaft is a drop.</p>
			</article>

			<button class="margin-marker" onclick={() => (modelNoticeOpen = !modelNoticeOpen)} aria-label="Show inferred model change">
				<span></span>
			</button>

			{#if selectionTools}
				<div class="selection-tools" role="toolbar" aria-label="Writing assistance">
					<button>Continue</button><button>Rewrite</button><button>Shorter</button><button>Longer</button><button>Ask…</button>
				</div>
			{/if}

			{#if modelNoticeOpen}
				<aside class="model-card">
					<div class="model-label">Inferred</div>
					<strong>Sorell intends to leave the Bridge</strong>
					<p>Current gravity makes the direct crossing unsafe. The around-rail route remains available.</p>
					<div class="card-actions"><button>Confirm</button><button>Adjust</button><button>Ignore</button></div>
				</aside>
			{/if}
		</section>

		{#if inspectorOpen}
			<aside class="inspector">
				<div class="inspector-head"><span>Context</span><button onclick={() => (inspectorOpen = false)}>×</button></div>
				<section><label>Scene</label><strong>Bridge departure</strong></section>
				<section><label>Story state</label><p>1g acceleration · service hatch available</p></section>
				<section><label>Present</label><p>Sorell · Rao</p></section>
				<section><label>Nearby concern</label><p>Harlan occupies the service route.</p></section>
			</aside>
		{/if}
	</main>

	{#if assistantOpen}
		<aside class="assistant">
			<div class="assistant-head"><strong>Assistant</strong><button onclick={() => (assistantOpen = false)}>×</button></div>
			<p>I have the current passage and scene context. Describe what you want to change.</p>
			<textarea aria-label="Ask assistant" placeholder="Ask about this scene…"></textarea>
	</aside>
	{/if}

	<footer class="statusbar">
		<span>Draft</span><span>Scene 12 · 1,184 words</span><span class="status-right">No blocking issues</span>
	</footer>
</div>

<style>
	:global(html) { background: #f5f4f0; }
	:global(body) { background: #f5f4f0; color: #242424; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
	button, a { font: inherit; }
	.write-shell { min-height: 100vh; background: #f5f4f0; color: #242424; }
	.topbar { position: fixed; z-index: 20; inset: 0 0 auto; height: 3.1rem; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0 .8rem; border-bottom: 1px solid #deddd8; background: rgba(250,249,246,.94); backdrop-filter: blur(14px); }
	.project, .tools, nav { display: flex; align-items: center; }
	.project { gap: .6rem; min-width: 0; }
	.project div { display: grid; line-height: 1.05; }
	.project strong { font-size: .78rem; font-weight: 650; }
	.project span { margin-top: .2rem; color: #898781; font-size: .65rem; }
	.mark { width: 1.8rem; height: 1.8rem; border: 1px solid #d4d2cc; border-radius: .38rem; background: transparent; color: #55534f; font-size: .62rem; font-weight: 750; }
	nav { gap: .12rem; }
	nav a { padding: .42rem .58rem; border-radius: .38rem; color: #85827d; font-size: .7rem; font-weight: 560; text-decoration: none; }
	nav a:hover, nav a.active { background: #ebe9e4; color: #262522; }
	.tools { justify-self: end; gap: .2rem; }
	.quiet { min-width: 2rem; height: 2rem; padding: 0 .5rem; border: 0; border-radius: .4rem; background: transparent; color: #716f6a; }
	.quiet:hover { background: #ebe9e4; color: #222; }
	.status-dot { display: inline-block; width: .38rem; height: .38rem; margin-right: .35rem; border-radius: 50%; background: #8da895; vertical-align: .08rem; }
	.wide { font-size: .68rem; }
	.workspace { min-height: 100vh; padding: 6.2rem 2rem 5rem; }
	.document-wrap { position: relative; width: min(100%, 51rem); margin: 0 auto; }
	.document-meta { height: 1.7rem; display: flex; justify-content: space-between; color: #aaa7a0; font-size: .66rem; letter-spacing: .02em; }
	.saved { opacity: .75; }
	.page { min-height: 62rem; padding: 5.2rem 6.2rem 8rem; outline: none; background: #fff; box-shadow: 0 1px 2px #0000000c, 0 10px 35px #302b2110; font: 1rem/1.55 'Courier New', Courier, monospace; caret-color: #222; }
	.page p { margin: 0 0 1.15rem; }
	.page .slug { margin-top: .25rem; font-weight: 700; text-transform: uppercase; }
	.page .character { width: 55%; margin: 1.6rem auto .1rem; text-align: center; }
	.page .dialogue { width: 58%; margin: 0 auto 1.2rem; }
	.margin-marker { position: absolute; top: 22rem; right: -1.9rem; width: 1.2rem; height: 1.6rem; border: 0; background: transparent; }
	.margin-marker span { display: block; width: .32rem; height: .32rem; margin: auto; border-radius: 50%; background: #8da895; box-shadow: 0 0 0 3px #8da89518; }
	.selection-tools { position: fixed; z-index: 30; left: 50%; bottom: 3.2rem; transform: translateX(-50%); display: flex; padding: .25rem; border: 1px solid #d9d6cf; border-radius: .55rem; background: #fff; box-shadow: 0 8px 28px #0002; }
	.selection-tools button, .card-actions button { border: 0; border-radius: .35rem; background: transparent; color: #5d5b56; padding: .38rem .52rem; font-size: .68rem; }
	.selection-tools button:hover, .card-actions button:hover { background: #f0efeb; color: #222; }
	.model-card { position: absolute; z-index: 10; top: 19rem; left: calc(100% + 2.2rem); width: 17rem; padding: .9rem; border: 1px solid #ddd9d0; border-radius: .55rem; background: #fff; box-shadow: 0 10px 30px #00000012; }
	.model-label { margin-bottom: .35rem; color: #758d7c; font-size: .61rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
	.model-card strong { font-size: .76rem; }
	.model-card p { margin: .45rem 0 .65rem; color: #706d67; font-size: .7rem; line-height: 1.45; }
	.card-actions { display: flex; gap: .1rem; margin-left: -.35rem; }
	.inspector { position: fixed; z-index: 15; top: 3.1rem; right: 0; bottom: 1.8rem; width: 18rem; padding: .8rem 1rem; border-left: 1px solid #deddd8; background: #faf9f6; }
	.inspector-head, .assistant-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; font-size: .72rem; }
	.inspector-head button, .assistant-head button { border: 0; background: transparent; color: #888; font-size: 1rem; }
	.inspector section { padding: .8rem 0; border-top: 1px solid #e7e5df; }
	.inspector label { display: block; margin-bottom: .3rem; color: #99958e; font-size: .61rem; text-transform: uppercase; letter-spacing: .06em; }
	.inspector strong, .inspector p { margin: 0; font-size: .72rem; font-weight: 500; line-height: 1.45; }
	.assistant { position: fixed; z-index: 40; right: 1rem; bottom: 2.8rem; width: min(24rem, calc(100vw - 2rem)); padding: .9rem; border: 1px solid #d8d5ce; border-radius: .65rem; background: #fff; box-shadow: 0 14px 50px #0002; }
	.assistant p { color: #74716b; font-size: .72rem; line-height: 1.45; }
	.assistant textarea { width: 100%; min-height: 5rem; resize: vertical; padding: .6rem; border: 1px solid #dedbd4; border-radius: .45rem; outline: none; background: #faf9f6; color: #333; font-size: .75rem; }
	.statusbar { position: fixed; z-index: 25; inset: auto 0 0; height: 1.8rem; display: flex; align-items: center; gap: 1rem; padding: 0 .8rem; border-top: 1px solid #e0ded8; background: rgba(250,249,246,.96); color: #99958f; font-size: .61rem; }
	.status-right { margin-left: auto; }
	@media (max-width: 900px) {
		nav a:not(.active) { display: none; }
		.project span, .wide { display: none; }
		.workspace { padding-inline: 1rem; }
		.page { padding: 4rem clamp(1.5rem, 8vw, 4rem) 6rem; }
		.model-card { position: fixed; top: auto; right: 1rem; bottom: 3rem; left: 1rem; width: auto; }
		.margin-marker { right: -.6rem; }
		.inspector { width: min(20rem, 88vw); box-shadow: -12px 0 30px #0001; }
	}
</style>
