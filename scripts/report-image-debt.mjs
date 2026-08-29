import { runSingleReport } from './lib/report-cli.mjs';
import { buildImageDebtReport, formatImageDebtMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('image-debt', buildImageDebtReport, formatImageDebtMarkdown);
