import type {
	AuthoringProjectRevision,
	ProjectProjection,
	ScreenplayElement
} from './authoring-contracts.js';

export const authoringFixtureIds = {
	project: 'project:harbor-light',
	primaryDocument: 'document:harbor-light-scene',
	secondaryDocument: 'document:harbor-light-coda',
	featureVersion: 'version:feature',
	trailerVersion: 'version:trailer',
	heading: 'element:harbor-light-heading',
	action: 'element:harbor-light-action',
	character: 'element:harbor-light-character',
	dialogue: 'element:harbor-light-dialogue',
	codaHeading: 'element:harbor-light-coda-heading',
	codaAction: 'element:harbor-light-coda-action'
} as const;

const sharedElements: ScreenplayElement[] = [
	{
		id: authoringFixtureIds.heading,
		kind: 'scene-heading',
		text: 'EXT. HARBOR LIGHT — NIGHT'
	},
	{
		id: authoringFixtureIds.action,
		kind: 'action',
		text: 'Mara steadies the lamp as the last ferry clears the breakwater.'
	},
	{ id: authoringFixtureIds.character, kind: 'character', text: 'MARA' },
	{
		id: authoringFixtureIds.dialogue,
		kind: 'dialogue',
		text: 'Leave the channel open.'
	}
];

const codaElements: ScreenplayElement[] = [
	{ id: authoringFixtureIds.codaHeading, kind: 'scene-heading', text: 'INT. LAMP ROOM — DAWN' },
	{
		id: authoringFixtureIds.codaAction,
		kind: 'action',
		text: 'The lamp clicks off. Morning fills the glass.'
	}
];

function present(elements: readonly ScreenplayElement[]) {
	return elements
		.map((element) => ({ ...element, status: 'present' as const }))
		.sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
}

export const harborLightProjection: ProjectProjection = {
	schemaVersion: 1,
	projectId: authoringFixtureIds.project,
	name: 'Harbor Light',
	documents: [
		{ id: authoringFixtureIds.primaryDocument, title: 'Harbor Light — Scene' },
		{ id: authoringFixtureIds.secondaryDocument, title: 'Harbor Light — Coda' }
	],
	versions: [
		{ id: authoringFixtureIds.featureVersion, label: 'Feature' },
		{ id: authoringFixtureIds.trailerVersion, label: 'Trailer' }
	],
	screenplays: [
		{
			documentId: authoringFixtureIds.primaryDocument,
			versionId: authoringFixtureIds.featureVersion,
			documentVersion: 0,
			order: sharedElements.map((element) => element.id),
			elements: present(sharedElements)
		},
		{
			documentId: authoringFixtureIds.primaryDocument,
			versionId: authoringFixtureIds.trailerVersion,
			documentVersion: 0,
			order: sharedElements.map((element) => element.id),
			elements: [
				...present(sharedElements.slice(0, 3)),
				{
					id: authoringFixtureIds.dialogue,
					kind: 'dialogue' as const,
					status: 'removed' as const
				}
			].sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
		},
		{
			documentId: authoringFixtureIds.secondaryDocument,
			versionId: authoringFixtureIds.featureVersion,
			documentVersion: 0,
			order: codaElements.map((element) => element.id),
			elements: present(codaElements)
		},
		{
			documentId: authoringFixtureIds.secondaryDocument,
			versionId: authoringFixtureIds.trailerVersion,
			documentVersion: 0,
			order: codaElements.map((element) => element.id),
			elements: present(codaElements)
		}
	]
};

export const harborLightInitialRevision: AuthoringProjectRevision = {
	schemaVersion: 1,
	projectId: authoringFixtureIds.project,
	number: 0,
	changeSetId: null,
	timestamp: '2026-09-24T12:00:00.000Z',
	projection: harborLightProjection
};
