/** Server / CLI report builders — do not import from client components. */
export {
	buildReport,
	formatReportMarkdown,
	summarizeReport,
	getReportEntry,
	REPORT_ENTRIES,
	REPORT_IDS
} from '../../../../scripts/lib/report-runner.mjs';
export { createProjectContext } from '../../../../scripts/lib/project-context.mjs';
