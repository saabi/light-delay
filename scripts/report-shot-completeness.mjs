import { runSingleReport } from './lib/report-cli.mjs';
import { buildShotCompletenessReport, formatShotCompletenessMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('shot-completeness', buildShotCompletenessReport, formatShotCompletenessMarkdown);
