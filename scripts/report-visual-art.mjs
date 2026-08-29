import { runSingleReport } from './lib/report-cli.mjs';
import { buildVisualArtReport, formatVisualArtMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('visual-art', buildVisualArtReport, formatVisualArtMarkdown);
