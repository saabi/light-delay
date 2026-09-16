import { readFileSync, writeFileSync } from 'node:fs';

const prev = JSON.parse(readFileSync('data/locations.json', 'utf8'));
const byId = new Map(prev.locations.map((l) => [l.id, l]));

function loc(id, patch) {
	const base = byId.get(id);
	if (!base && !patch._new) throw new Error('missing ' + id);
	const { _new, ...rest } = patch;
	const out = {
		...(base || {}),
		...rest,
		id,
		name: rest.name || base.name,
		description: rest.description || base.description,
		referenceAssetIds: rest.referenceAssetIds ?? base?.referenceAssetIds ?? []
	};
	for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
	return out;
}

const synthetic = [
	loc('location:universe-root', {
		_new: true,
		name: { en: 'Universe', es: 'needs_revision' },
		description: {
			en: 'Synthetic root of the location containment tree. Not a shootable set.',
			es: 'needs_revision'
		},
		spatialKind: 'universe',
		shootable: false,
		referenceAssetIds: [],
		atmosphere: { en: 'Cosmographic root', es: 'needs_revision' }
	}),
	loc('location:region-sol-jupiter', {
		_new: true,
		name: { en: 'Sol — Jupiter region', es: 'needs_revision' },
		description: {
			en: 'Story region around Jupiter: Proxima Station, periapsis flybys, and the near-side Velari tunnel mouth.',
			es: 'needs_revision'
		},
		spatialKind: 'region',
		shootable: false,
		parentLocationId: 'location:universe-root',
		parentRelation: 'region_of',
		referenceAssetIds: [],
		atmosphere: { en: 'Jupiter-space operations', es: 'needs_revision' }
	}),
	loc('location:region-velari-space', {
		_new: true,
		name: { en: 'Velari space', es: 'needs_revision' },
		description: {
			en: 'Far-side region beyond the Velari tunnel gate, hosting the Velari Station destination.',
			es: 'needs_revision'
		},
		spatialKind: 'region',
		shootable: false,
		parentLocationId: 'location:universe-root',
		parentRelation: 'region_of',
		referenceAssetIds: [],
		atmosphere: { en: 'Beyond the gate', es: 'needs_revision' }
	}),
	loc('location:celestial-ardor', {
		_new: true,
		name: { en: 'Celestial Ardor', es: 'needs_revision' },
		description: {
			en: 'Hull host for all Celestial Ardor interior volumes. Mirrors vehicle:celestial-ardor for containment; rooms and spines are aboard this location.',
			es: 'needs_revision'
		},
		spatialKind: 'vessel',
		shootable: false,
		parentLocationId: 'location:region-sol-jupiter',
		parentRelation: 'stationed_in',
		referenceAssetIds: [
			'asset:vehicle-celestial-ardor-model-sheet-v2',
			'asset:vehicle-celestial-ardor-jupiter'
		],
		atmosphere: { en: 'Ship hull host', es: 'needs_revision' },
		notes: [
			{
				id: 'note:celestial-ardor-location-host',
				type: 'technical',
				status: 'resolved',
				priority: 'medium',
				text: {
					en: 'Structural location for hierarchy; prefer deck/room locationIds on shots. Vehicle entity remains vehicle:celestial-ardor.',
					es: 'needs_revision'
				}
			}
		]
	})
];

const rebuilt = [
	...synthetic,
	loc('location:jupiter-periapsis', {
		spatialKind: 'exterior',
		shootable: true,
		parentLocationId: 'location:region-sol-jupiter',
		parentRelation: 'in_space_of'
	}),
	loc('location:proxima-station', {
		spatialKind: 'facility',
		shootable: true,
		parentLocationId: 'location:region-sol-jupiter',
		parentRelation: 'stationed_in'
	}),
	loc('location:proxima-dock', {
		spatialKind: 'room',
		shootable: true,
		parentLocationId: 'location:proxima-station',
		parentRelation: 'contained_in'
	}),
	loc('location:velari-wormhole-mouth', {
		spatialKind: 'exterior',
		shootable: true,
		parentLocationId: 'location:region-sol-jupiter',
		parentRelation: 'in_space_of'
	}),
	loc('location:velari-station', {
		spatialKind: 'facility',
		shootable: true,
		parentLocationId: 'location:region-velari-space',
		parentRelation: 'stationed_in'
	}),
	loc('location:celestial-ardor-bridge', {
		spatialKind: 'room',
		shootable: true,
		parentLocationId: 'location:celestial-ardor',
		parentRelation: 'aboard',
		portals: [
			{
				id: 'portal:bridge-service-hatch',
				kind: 'door',
				towardLocationId: 'location:celestial-ardor-service-cylinder',
				bidirectional: true,
				notes:
					'Dark rounded-corner service hatch beside stations (hidden from normal console sightline).'
			},
			{
				id: 'portal:bridge-central-access-opening',
				kind: 'door',
				towardLocationId: 'location:celestial-ardor-central-access',
				bidirectional: true,
				notes: 'Helical stair / central opening between bridge deck and axial trunk.'
			}
		]
	}),
	loc('location:celestial-ardor-bridge-meal-table', {
		spatialKind: 'sublocation',
		shootable: true,
		parentLocationId: 'location:celestial-ardor-bridge',
		parentRelation: 'sublocation_of'
	}),
	loc('location:celestial-ardor-command-vestibule', {
		spatialKind: 'sublocation',
		shootable: true,
		parentLocationId: 'location:celestial-ardor-bridge',
		parentRelation: 'sublocation_of',
		portals: [
			{
				id: 'portal:vestibule-service-cylinder',
				kind: 'door',
				towardLocationId: 'location:celestial-ardor-service-cylinder',
				bidirectional: true,
				notes: 'Landing beside service cylinder railing opening.'
			},
			{
				id: 'portal:vestibule-central-access',
				kind: 'door',
				towardLocationId: 'location:celestial-ardor-central-access',
				bidirectional: true,
				notes: 'Landing toward central-access / lift heads.'
			}
		]
	}),
	loc('location:celestial-ardor-central-access', {
		spatialKind: 'axial_spine',
		shootable: true,
		parentLocationId: 'location:celestial-ardor',
		parentRelation: 'aboard',
		connects: [
			{
				deckLocationId: 'location:celestial-ardor-bridge',
				relation: 'opens_onto',
				levelId: 'bridge',
				notes: 'Helical opening / command vestibule'
			},
			{
				deckLocationId: 'location:celestial-ardor-engineering',
				relation: 'opens_onto',
				levelId: 'engineering',
				notes: 'Mid/aft landings as authored'
			},
			{
				deckLocationId: 'location:celestial-ardor-reactor-service-bay',
				relation: 'terminus_at',
				levelId: 'aft-reactor',
				notes: 'Bottom of the shaft — scene 19 geography'
			}
		]
	}),
	loc('location:celestial-ardor-service-cylinder', {
		spatialKind: 'axial_spine',
		shootable: true,
		parentLocationId: 'location:celestial-ardor',
		parentRelation: 'aboard',
		connects: [
			{
				deckLocationId: 'location:celestial-ardor-bridge',
				relation: 'hatch_into',
				levelId: 'bridge',
				notes: 'Bridge service hatch'
			},
			{
				deckLocationId: 'location:celestial-ardor-command-vestibule',
				relation: 'hatch_into',
				levelId: 'bridge',
				notes: 'Vestibule landing beside service cylinder'
			},
			{
				deckLocationId: 'location:diplomatic-core-room',
				relation: 'opens_onto',
				levelId: 'diplomatic-core',
				notes: 'Technical branch per location description'
			}
		]
	}),
	loc('location:celestial-ardor-engineering', {
		spatialKind: 'room',
		shootable: true,
		parentLocationId: 'location:celestial-ardor',
		parentRelation: 'aboard'
	}),
	loc('location:celestial-ardor-reactor-service-bay', {
		spatialKind: 'room',
		shootable: true,
		parentLocationId: 'location:celestial-ardor-engineering',
		parentRelation: 'contained_in',
		portals: [
			{
				id: 'portal:bay-vault-door',
				kind: 'door',
				towardLocationId: 'location:celestial-ardor-inner-shielding-vault',
				bidirectional: true,
				notes: 'Sealed local-lock vault door; walkable only when open/unlocked in world state.'
			}
		]
	}),
	loc('location:celestial-ardor-inner-shielding-vault', {
		spatialKind: 'room',
		shootable: true,
		parentLocationId: 'location:celestial-ardor-reactor-service-bay',
		parentRelation: 'recessed_in'
	}),
	loc('location:diplomatic-core-room', {
		spatialKind: 'room',
		shootable: true,
		parentLocationId: 'location:celestial-ardor',
		parentRelation: 'aboard'
	})
];

const file = {
	schemaVersion: '2.0.0',
	distanceUnit: 'abstract',
	locations: rebuilt,
	navNodes: [
		{
			id: 'nav:bridge-crew-stations',
			hostLocationId: 'location:celestial-ardor-bridge',
			navOnly: true,
			name: { en: 'Bridge crew stations arc', es: 'needs_revision' },
			notes: 'Waypoint for pathfinding meal-table ↔ stations without a separate catalog room.'
		}
	],
	proximityEdges: [
		{
			a: 'location:proxima-station',
			b: 'location:proxima-dock',
			distance: 0,
			notes: 'Dock is on-station; colocated for transporter/site tests.'
		},
		{
			a: 'location:jupiter-periapsis',
			b: 'location:velari-wormhole-mouth',
			distance: 40,
			notes: 'Same Jupiter-region operations neighborhood (illustrative abstract units).'
		},
		{
			a: 'location:velari-wormhole-mouth',
			b: 'location:region-velari-space',
			distance: 1000,
			notes: 'Gate crossing scale — far side is a different region.'
		},
		{
			a: 'location:celestial-ardor',
			b: 'location:proxima-dock',
			distance: 0,
			notes: 'When berthed; continuity presence may override while underway.'
		}
	],
	navEdges: [
		{
			id: 'nav-edge:meal-table-around-to-stations',
			from: 'location:celestial-ardor-bridge-meal-table',
			to: 'nav:bridge-crew-stations',
			via: 'around-central-opening-rail',
			cost: 1,
			tags: ['around-central-opening'],
			bidirectional: true,
			notes: '1g-safe walk around the helical opening.'
		},
		{
			id: 'nav-edge:meal-table-across-shaft-to-stations',
			from: 'location:celestial-ardor-bridge-meal-table',
			to: 'nav:bridge-crew-stations',
			via: 'across-open-shaft',
			requires: [{ key: 'gravity', eq: 'microgravity' }],
			cost: 1,
			tags: ['crosses-open-shaft'],
			bidirectional: true,
			notes: 'Only valid in microgravity; falling risk under 1g.'
		},
		{
			id: 'nav-edge:stations-to-service-hatch',
			from: 'nav:bridge-crew-stations',
			to: 'location:celestial-ardor-service-cylinder',
			via: 'portal:bridge-service-hatch',
			requires: [{ key: 'door:service-hatch-bridge', eq: 'open' }],
			cost: 1,
			tags: ['service-cylinder'],
			bidirectional: true
		},
		{
			id: 'nav-edge:stations-to-central-access',
			from: 'nav:bridge-crew-stations',
			to: 'location:celestial-ardor-central-access',
			via: 'portal:bridge-central-access-opening',
			requires: [{ key: 'gravity', in: ['microgravity', '1g'] }],
			cost: 1,
			tags: ['central-access'],
			bidirectional: true,
			notes: 'Deck interface; open-shaft crossing elsewhere may still be MG-gated.'
		}
	]
};

writeFileSync('data/locations.json', `${JSON.stringify(file, null, 2)}\n`);
console.log(
	JSON.stringify(
		{
			locations: file.locations.length,
			navNodes: file.navNodes.length,
			proximityEdges: file.proximityEdges.length,
			navEdges: file.navEdges.length
		},
		null,
		2
	)
);
