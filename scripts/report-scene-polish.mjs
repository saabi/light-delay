import { runSingleReport } from './lib/report-cli.mjs';
import { buildScenePolishReport, formatScenePolishMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('scene-polish', buildScenePolishReport, formatScenePolishMarkdown);
