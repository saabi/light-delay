import { runSingleReport } from './lib/report-cli.mjs';
import { buildDialogueI18nReport, formatDialogueI18nMarkdown } from './lib/editorial-reports.mjs';

runSingleReport('dialogue-i18n', buildDialogueI18nReport, formatDialogueI18nMarkdown);
