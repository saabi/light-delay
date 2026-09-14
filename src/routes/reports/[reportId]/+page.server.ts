import { error } from '@sveltejs/kit';
import { buildReport, getReportEntry } from '$lib/data/reports/server';
import { createProjectContext } from '../../../../scripts/lib/project-context.mjs';
import { getLocalizedScript, listLocalizedScripts } from '$lib/data/repositories/index';
import { getLocale } from '$lib/paraglide/runtime.js';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params }) => {
	const reportId = params.reportId ?? '';
	try {
		getReportEntry(reportId);
	} catch {
		error(404, `Report not found: ${reportId}`);
	}

	const locale = getLocale();
	const projectCtx = createProjectContext();
	const scripts = listLocalizedScripts(locale);
	const summaries = Object.fromEntries(
		scripts.map((script) => [
			script.id,
			buildReport(reportId, getLocalizedScript(script.id, locale), locale, projectCtx).summary
				?.consoleLine ?? ''
		])
	);

	return { reportId, summaries };
};
