import { runSingleReport } from './lib/report-cli.mjs';
import { buildRegenBriefsReport, formatRegenBriefsMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('regen-briefs', buildRegenBriefsReport, formatRegenBriefsMarkdown);
