import { runSingleReport } from './lib/report-cli.mjs';
import { buildEntityBindingReport, formatEntityBindingMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('entity-binding', buildEntityBindingReport, formatEntityBindingMarkdown);
