import type { GlyphCapacityValue } from '$lib';

export const WIDTH_CUTOFF = 48;
export const HEIGHT_CUTOFF = 32;
/** Landscape compact uses a wider inline budget than portrait narrow. */
export const COMPACT_CHARS = 75;
export const COMPACT_WIDTH_CUTOFF = 75;
export const PX_WIDTH_CUTOFF = 768;
export const PX_HEIGHT_CUTOFF = 512;
export const PX_COMPACT_WIDTH_CUTOFF = 1200; // 75 × 16
export const AVG_CHARS = 45;

export type StageUnit = 'px' | 'rem' | 'em' | 'emch' | 'sensor';
export type Typeface = 'narrow' | 'normal' | 'wide';
export type Profile = 'latin' | 'ui' | 'headings';
export type WindowId = StageUnit;
export type WindowArrangement = 'cascade' | 'grid' | 'row';
export type StageLayout = 'desktop' | 'narrow' | 'compact';
export type AdaptiveMode = 'full' | 'reduced' | 'minimal';
export type ScenarioId = 'site-shell' | 'adaptive-widgets' | 'master-detail' | 'collection';
export type AdaptivePolicyId =
	| 'stage'
	| 'choice'
	| 'numeric'
	| 'toolbar'
	| 'tabs'
	| 'search'
	| 'form-actions'
	| 'detail-tools'
	| 'collection-item';

export type CapacityBudget = { maxChars: number; maxLines: number };

export const ADAPTIVE_POLICIES: Record<
	Exclude<AdaptivePolicyId, 'stage'>,
	{ full: CapacityBudget; reduced: CapacityBudget }
> = {
	choice: { full: { maxChars: 44, maxLines: 9 }, reduced: { maxChars: 28, maxLines: 6 } },
	numeric: { full: { maxChars: 40, maxLines: 7 }, reduced: { maxChars: 26, maxLines: 5 } },
	toolbar: { full: { maxChars: 48, maxLines: 5 }, reduced: { maxChars: 32, maxLines: 4 } },
	tabs: { full: { maxChars: 54, maxLines: 4 }, reduced: { maxChars: 34, maxLines: 3 } },
	search: { full: { maxChars: 48, maxLines: 7 }, reduced: { maxChars: 30, maxLines: 5 } },
	'form-actions': {
		full: { maxChars: 38, maxLines: 6 },
		reduced: { maxChars: 26, maxLines: 4 }
	},
	'detail-tools': {
		full: { maxChars: 42, maxLines: 6 },
		reduced: { maxChars: 28, maxLines: 4 }
	},
	'collection-item': {
		full: { maxChars: 40, maxLines: 8 },
		reduced: { maxChars: 25, maxLines: 5 }
	}
};

export type WidgetsState = {
	theme: 'system' | 'light' | 'dark';
	digest: 'daily' | 'weekly' | 'monthly';
	zoom: number;
	activeView: 'overview' | 'activity' | 'files' | 'settings';
	search: string;
	filter: 'all' | 'open' | 'complete';
	starred: boolean;
	saved: boolean;
};

export type MasterDetailState = {
	selectedId: 'atlas' | 'compass' | 'harbor';
	activePane: 'master' | 'detail';
	starred: boolean;
};

export type CollectionState = {
	expanded: string[];
	following: string[];
};

export type ScenarioStateMap = {
	'site-shell': Record<string, never>;
	'adaptive-widgets': WidgetsState;
	'master-detail': MasterDetailState;
	collection: CollectionState;
};

export type ScenarioStates = { [K in ScenarioId]: ScenarioStateMap[K] };

export const SCENARIOS: { id: ScenarioId; label: string }[] = [
	{ id: 'site-shell', label: 'Site shell' },
	{ id: 'adaptive-widgets', label: 'Adaptive widgets' },
	{ id: 'master-detail', label: 'Master / detail' },
	{ id: 'collection', label: 'Component collection' }
];

export function createScenarioStates(): ScenarioStates {
	return {
		'site-shell': {},
		'adaptive-widgets': {
			theme: 'system',
			digest: 'weekly',
			zoom: 100,
			activeView: 'overview',
			search: '',
			filter: 'all',
			starred: false,
			saved: false
		},
		'master-detail': { selectedId: 'atlas', activePane: 'master', starred: false },
		collection: { expanded: ['signal'], following: [] }
	};
}

export const WINDOW_ORDER: WindowId[] = ['px', 'rem', 'em', 'emch', 'sensor'];

export const CASCADE_OFFSETS: Record<WindowId, { left: number; top: number }> = {
	px: { left: 0, top: 0 },
	rem: { left: 40, top: 28 },
	em: { left: 80, top: 56 },
	emch: { left: 120, top: 84 },
	sensor: { left: 160, top: 112 }
};

export const CASCADE_SIZE = { width: 820, height: 560 };

/** Visible section-panel prose when “Lorem copy” is on (not the sensor glyph sample). */
export const LOREM_COPY = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
	'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
	'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
	'Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.',
	'Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
	'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
	'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.'
].join(' ');

export type DemoWindow = {
	left: number;
	top: number;
	width: number;
	height: number;
	z: number;
};

export type UnitMetrics = {
	rem: number;
	em: number;
	ch: number;
	lh: number;
	emch: number;
};

export type CapacityMetrics = {
	maxChars: number;
	maxLines: number;
	aspectRatio: number;
};

export type StageSnapshot = {
	width: number;
	height: number;
	pixelAspectRatio: number;
	layout: string;
	capacity: CapacityMetrics;
	unitMetrics: UnitMetrics;
};

export type SensorSnapshot = {
	layout: string;
	sensor: GlyphCapacityValue;
	capacity: CapacityMetrics;
	unitMetrics: UnitMetrics;
};

export const emptyUnitMetrics: UnitMetrics = { rem: 0, em: 0, ch: 0, lh: 0, emch: 0 };

export const profiles: Record<Profile, { label: string; em: number; ch: number }> = {
	latin: { label: 'Latin prose', em: 0.28, ch: 0.55 },
	ui: { label: 'Dense UI labels', em: 0.22, ch: 0.5 },
	headings: { label: 'Wide headings', em: 0.36, ch: 0.62 }
};
