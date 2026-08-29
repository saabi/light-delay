import { runSingleReport } from './lib/report-cli.mjs';
import { buildCueCoverageReport, formatCueCoverageMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('cue-coverage', buildCueCoverageReport, formatCueCoverageMarkdown);
