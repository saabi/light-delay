import { runSingleReport } from './lib/report-cli.mjs';
import { buildCuePlacementReport, formatCuePlacementMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('cue-placement', buildCuePlacementReport, formatCuePlacementMarkdown);
