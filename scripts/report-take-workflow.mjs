import { runSingleReport } from './lib/report-cli.mjs';
import { buildTakeWorkflowReport, formatTakeWorkflowMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('take-workflow', buildTakeWorkflowReport, formatTakeWorkflowMarkdown);
