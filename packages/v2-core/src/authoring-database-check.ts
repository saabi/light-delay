import { createHash } from 'node:crypto';
import type { Pool } from 'pg';
import { AuthoringApplication } from './authoring.js';
import { InMemoryAuthoringProjectStore } from './authoring-store.js';
import { PostgresProjectStoreResolver } from './postgres-authoring-store.js';
import { authoringSchemaStatus, type AuthoringSchemaStatus } from './postgres-migrations.js';

/**
 * A comparable description of an authoring database, read through the same application code
 * Studio uses. A restored backup is proven good when its summary equals the source's: schema,
 * accepted history, current projections, reconstruction from history, every screenplay view,
 * Drafts and Proposals. Digests are SHA-256 over canonical JSON (sorted keys).
 */
export interface AuthoringDatabaseSummary {
	schema: AuthoringSchemaStatus;
	projects: ProjectSummary[];
}

export interface ProjectSummary {
	projectId: string;
	headRevision: number;
	changeSets: number;
	historyDigest: string;
	projectionDigest: string;
	/** The head rebuilt from accepted history alone equals the stored head projection. */
	reconstructionMatches: boolean;
	views: {
		documentId: string;
		versionId: string;
		documentVersion: number;
		elements: number;
		digest: string;
	}[];
	drafts: { count: number; digest: string };
	proposals: { count: number; byStatus: Record<string, number>; digest: string };
}

const canonical = (value: unknown): string =>
	JSON.stringify(value, (_key, item) =>
		item && typeof item === 'object' && !Array.isArray(item)
			? Object.fromEntries(
					Object.entries(item as Record<string, unknown>).sort(([a], [b]) =>
						a < b ? -1 : a > b ? 1 : 0
					)
				)
			: item
	);

export const canonicalDigest = (value: unknown) =>
	createHash('sha256').update(canonical(value)).digest('hex');

export async function summarizeAuthoringDatabase(pool: Pool): Promise<AuthoringDatabaseSummary> {
	const schema = await authoringSchemaStatus(pool);
	if (schema.status === 'uninitialized') return { schema, projects: [] };
	const resolver = new PostgresProjectStoreResolver(pool);
	const application = new AuthoringApplication(resolver);
	const ids = (
		await pool.query<{ project_id: string }>(
			'SELECT project_id FROM authoring_projects ORDER BY project_id'
		)
	).rows.map((row) => row.project_id);
	const projects: ProjectSummary[] = [];
	for (const projectId of ids) {
		const store = await resolver.forProject(projectId);
		if (!store) throw new Error(`Project cannot be opened: ${projectId}`);
		const head = await store.getHead();
		const bundle = await store.exportAcceptedHistory();
		const rebuilt = await InMemoryAuthoringProjectStore.fromAcceptedHistory(
			JSON.parse(JSON.stringify(bundle))
		);
		const rebuiltHead = await rebuilt.getHead();
		const history = await application.listHistory(projectId);
		const drafts = [...(await application.listDrafts(projectId))].sort((a, b) =>
			a.id.localeCompare(b.id)
		);
		const proposals = [...(await application.listProposals(projectId))].sort((a, b) =>
			a.id.localeCompare(b.id)
		);
		const views: ProjectSummary['views'] = [];
		for (const screenplay of head.projection.screenplays) {
			const scope = { documentId: screenplay.documentId, versionId: screenplay.versionId };
			const view = await application.getScreenplayView(projectId, scope);
			if (!view)
				throw new Error(
					`Screenplay cannot be opened: ${projectId} ${scope.documentId} ${scope.versionId}`
				);
			views.push({
				...scope,
				documentVersion: view.documentVersion,
				elements: view.elements.length,
				digest: canonicalDigest(view.elements)
			});
		}
		const byStatus: Record<string, number> = {};
		for (const proposal of proposals)
			byStatus[proposal.status] = (byStatus[proposal.status] ?? 0) + 1;
		projects.push({
			projectId,
			headRevision: head.number,
			changeSets: history.length,
			historyDigest: canonicalDigest(bundle),
			projectionDigest: canonicalDigest(head.projection),
			reconstructionMatches:
				rebuiltHead.number === head.number &&
				canonicalDigest(rebuiltHead.projection) === canonicalDigest(head.projection),
			views,
			drafts: { count: drafts.length, digest: canonicalDigest(drafts) },
			proposals: { count: proposals.length, byStatus, digest: canonicalDigest(proposals) }
		});
	}
	return { schema, projects };
}

/** Problems that make a database unfit to serve, independent of any comparison. */
export function summaryProblems(
	summary: AuthoringDatabaseSummary,
	options: { acceptPendingMigrations?: boolean } = {}
): string[] {
	const problems: string[] = [];
	const acceptable = ['current', 'ahead'];
	if (options.acceptPendingMigrations) acceptable.push('behind', 'uninitialized');
	if (!acceptable.includes(summary.schema.status))
		problems.push(`schema is ${summary.schema.status}`);
	for (const project of summary.projects)
		if (!project.reconstructionMatches)
			problems.push(`${project.projectId}: head does not match reconstruction from history`);
	return problems;
}

/** Differences between two summaries (for example a backup's source and its restore). */
export function compareSummaries(
	expected: AuthoringDatabaseSummary,
	actual: AuthoringDatabaseSummary
): string[] {
	const differences: string[] = [];
	const walk = (path: string, a: unknown, b: unknown) => {
		if (canonical(a) === canonical(b)) return;
		if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
			a.forEach((item, index) => walk(`${path}[${index}]`, item, b[index]));
			return;
		}
		if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
			for (const key of new Set([...Object.keys(a), ...Object.keys(b as object)]))
				walk(
					`${path}.${key}`,
					(a as Record<string, unknown>)[key],
					(b as Record<string, unknown>)[key]
				);
			return;
		}
		differences.push(`${path}: expected ${canonical(a)}, found ${canonical(b)}`);
	};
	walk('summary', expected, actual);
	return differences;
}
