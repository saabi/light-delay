<script lang="ts">
	let inspector = $state(false);
	const lenses = ['Write','Story','World','Navigate','Direct','Produce','Review'];
</script>
<svelte:head><title>Studio — Light Delay</title></svelte:head>
<div class="shell">
	<header>
		<div class="project"><strong>Light Delay</strong><span>Festival master</span></div>
		<nav aria-label="Workspace">{#each lenses as lens}<button class:active={lens==='Write'}>{lens}</button>{/each}</nav>
		<div class="actions"><span class="quiet">Saved</span><button onclick={() => inspector=!inspector}>Context</button><button>Ask</button></div>
	</header>
	<main class:withInspector={inspector}>
		<section class="workspace">
			<div class="document-meta"><span>Screenplay</span><span>Scene 12</span></div>
			<article class="page" contenteditable="true" spellcheck="true" aria-label="Screenplay editor">
				<p class="slug">INT. CELESTIAL ARDOR — BRIDGE</p>
				<p>Sorell releases the restraint and pushes away from the console. The central opening turns slowly beneath her as she catches the rail.</p>
				<div class="dialogue"><p class="character">SORELL</p><p>Keep watching the signal.</p></div>
				<p>Harlan looks toward the service cylinder. For a moment, nobody follows his gaze.</p>
			</article>
			<button class="margin-note" aria-label="One inferred model change">1</button>
			<footer><span>Scene 12 · Bridge</span><span>Context available</span></footer>
		</section>
		{#if inspector}<aside><div class="aside-head"><strong>Context</strong><button onclick={() => inspector=false}>Close</button></div><section><h2>World state</h2><dl><dt>Gravity</dt><dd>1g</dd><dt>Sorell</dt><dd>Bridge</dd><dt>Service hatch</dt><dd>Open</dd></dl></section><section><h2>Inference</h2><p>Sorell intends to cross the Bridge. Direct crossing is unsafe in 1g; the around-rail route remains available.</p><div class="inline-actions"><button>Confirm</button><button>Adjust</button><button>Ignore</button></div></section></aside>{/if}
	</main>
</div>
<style>
.shell{min-height:100vh} header{height:46px;display:grid;grid-template-columns:minmax(190px,1fr) auto minmax(190px,1fr);align-items:center;padding:0 16px;border-bottom:1px solid var(--studio-hairline);background:rgba(247,247,245,.96);font-size:12px}.project{display:flex;gap:9px;align-items:baseline}.project span,.quiet{color:var(--studio-text-muted)}nav{display:flex;height:100%}nav button,.actions button,.aside-head button,.inline-actions button{border:0;background:transparent;color:var(--studio-text-muted);padding:0 9px;cursor:pointer}nav button.active{color:var(--studio-text);box-shadow:inset 0 -1px var(--studio-text)}.actions{justify-self:end;display:flex;align-items:center;gap:4px}main{min-height:calc(100vh - 46px);display:grid;grid-template-columns:1fr;transition:grid-template-columns .15s ease}.withInspector{grid-template-columns:minmax(0,1fr) var(--studio-panel-width)}.workspace{position:relative;padding:48px 56px 28px}.document-meta{max-width:var(--studio-reading-width);margin:0 auto 18px;display:flex;justify-content:space-between;font-size:11px;color:var(--studio-text-muted)}.page{max-width:var(--studio-reading-width);min-height:70vh;margin:auto;background:var(--studio-surface);padding:68px 84px 96px;box-shadow:0 1px 3px rgba(0,0,0,.045);font-family:"Courier Prime","Courier New",monospace;font-size:15px;line-height:1.55}.page:focus{outline:none}.page p{margin:0 0 1.25em}.slug{font-weight:700}.dialogue{width:62%;margin:1.7em auto}.dialogue p{margin-bottom:.25em}.character{text-align:center}.margin-note{position:absolute;top:155px;left:calc(50% + min(430px,42vw));width:20px;height:20px;border:0;border-radius:50%;background:var(--studio-surface-subtle);color:var(--studio-text-muted);font-size:10px;cursor:pointer}.workspace footer{max-width:var(--studio-reading-width);margin:13px auto 0;display:flex;justify-content:space-between;font-size:10px;color:var(--studio-text-muted)}aside{border-left:1px solid var(--studio-hairline);background:var(--studio-surface);padding:16px 18px;font-size:12px}.aside-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:26px}aside section{padding:14px 0;border-top:1px solid var(--studio-hairline)}aside h2{font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px;color:var(--studio-text-muted)}aside p{line-height:1.55;margin:0 0 12px}dl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0}dt{color:var(--studio-text-muted)}dd{margin:0;text-align:right}.inline-actions{display:flex;gap:8px}.inline-actions button{padding:0;color:var(--studio-accent)}@media(max-width:850px){header{grid-template-columns:1fr auto}nav{display:none}.workspace{padding:30px 16px}.page{padding:48px 32px}.withInspector{grid-template-columns:1fr}aside{position:fixed;right:0;top:46px;bottom:0;width:min(88vw,var(--studio-panel-width));box-shadow:-8px 0 24px rgba(0,0,0,.08)}.margin-note{display:none}}
</style>
