/** Server / CLI report builders — do not import from client components. */
export {
	buildReport,
	formatReportMarkdown,
	summarizeReport,
	getReportEntry,
	REPORT_ENTRIES,
	REPORT_IDS
} from '$project-tools/lib/report-runner.mjs';
export { createProjectContext } from '$project-tools/lib/project-context.mjs';
