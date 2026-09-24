import { error } from '@sveltejs/kit';
import { buildReport, getReportEntry } from '$lib/data/reports/server';
import { createProjectContext } from '$project-tools/lib/project-context.mjs';
import { getLocalizedScript, listLocalizedScripts } from '$lib/data/repositories/index';
import { getLocale } from '$lib/paraglide/runtime.js';
import { decodeScriptId } from '$lib/utils/scriptId';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params }) => {
	const reportId = params.reportId ?? '';
	const scriptId = decodeScriptId(params.scriptId ?? '');
	try {
		getReportEntry(reportId);
	} catch {
		error(404, `Report not found: ${reportId}`);
	}

	const locale = getLocale();
	const scripts = listLocalizedScripts(locale);
	const scriptEntry = scripts.find((item) => item.id === scriptId);
	if (!scriptEntry) error(404, `Script not found: ${scriptId}`);

	const projectCtx = createProjectContext();
	const report = buildReport(
		reportId,
		getLocalizedScript(scriptId, locale),
		locale,
		projectCtx
	);

	return {
		reportId,
		scriptId,
		diskAuditEnabled: Boolean(projectCtx.diskAuditEnabled),
		report
	};
};
