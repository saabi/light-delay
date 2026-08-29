<script lang="ts">
	import { formatClock } from '../../../../scripts/lib/dialogue-timing.mjs';
	import ReportSummary from './ReportSummary.svelte';
	import * as m from '$lib/paraglide/messages.js';

	type TimingReport = {
		summary: {
			montageMs: number;
			spokenMs: number;
			deltaMs: number;
			multiSpeakerShotCount: number;
			offCameraShotCount: number;
			spokenSurplusShotCount: number;
			montageSurplusSceneCount: number;
			silentLongShotCount: number;
			consoleLine?: string;
		};
		scenes: Array<{
			sceneNumber: number;
			sceneTitle: string;
			montageMs: number;
			spokenMs: number;
			shots: Array<{
				shotNumber: number;
				montageMs: number;
				spokenMs: number;
				deltaMs: number;
			}>;
		}>;
	};

	let { report }: { report: TimingReport } = $props();
</script>

<ReportSummary summary={report.summary} />

<section class="flags">
	<h2>Flags</h2>
	<ul>
		<li>{m.timing_flag_multi_speaker({ count: String(report.summary.multiSpeakerShotCount) })}</li>
		<li>{m.timing_flag_off_camera()}: {report.summary.offCameraShotCount}</li>
		<li>Surplus shots: {report.summary.spokenSurplusShotCount}</li>
		<li>Loose scenes: {report.summary.montageSurplusSceneCount}</li>
		<li>Silent long: {report.summary.silentLongShotCount}</li>
	</ul>
</section>

<section>
	<h2>{m.timing_compare_lede()}</h2>
	<table>
		<thead>
			<tr>
				<th>Scene</th>
				<th>{m.timing_montage()}</th>
				<th>{m.timing_spoken_short()}</th>
				<th>Delta</th>
			</tr>
		</thead>
		<tbody>
			{#each report.scenes as scene (scene.sceneNumber)}
				<tr class="scene-row">
					<td colspan="4">
						<strong>{scene.sceneNumber}. {scene.sceneTitle}</strong>
						({formatClock(scene.montageMs)} / {formatClock(scene.spokenMs)})
					</td>
				</tr>
				{#each scene.shots as shot (shot.shotNumber)}
					<tr>
						<td>T{shot.shotNumber}</td>
						<td>{formatClock(shot.montageMs)}</td>
						<td>{formatClock(shot.spokenMs)}</td>
						<td class:warn={shot.deltaMs > 0}
							>{shot.deltaMs >= 0 ? '+' : ''}{formatClock(Math.abs(shot.deltaMs))}</td
						>
					</tr>
				{/each}
			{/each}
		</tbody>
	</table>
</section>

<style>
	h2 {
		font: 700 1.1rem var(--font-serif);
		margin: 0 0 0.75rem;
	}

	.flags ul {
		margin: 0;
		padding-left: 1.2rem;
		color: var(--muted);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}

	th,
	td {
		padding: 0.45rem 0.6rem;
		border-bottom: 1px solid var(--line);
		text-align: left;
	}

	th {
		color: var(--muted);
		font-size: 0.72rem;
		text-transform: uppercase;
	}

	.scene-row td {
		background: var(--panel2);
		font-size: 0.82rem;
	}

	.warn {
		color: var(--gold);
	}
</style>
