import { runSingleReport } from './lib/report-cli.mjs';
import {
	buildDialoguePerformanceReport,
	formatDialoguePerformanceMarkdown
} from './lib/editorial-reports.mjs';

runSingleReport('dialogue-performance', buildDialoguePerformanceReport, formatDialoguePerformanceMarkdown);
