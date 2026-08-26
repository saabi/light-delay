import type { ScriptRegistryEntry } from '$lib/types/project';
import * as m from '$lib/paraglide/messages.js';

export function scriptLabel(entry: ScriptRegistryEntry): string {
	switch (entry.id) {
		case 'script:light-delay-main-short':
			return m.script_main_name();
		case 'script:light-delay-festival':
			return m.script_festival_name();
		case 'script:light-delay-trailer':
			return m.script_trailer_name();
		case 'script:light-delay-long':
			return m.script_long_name();
		default:
			return entry.label;
	}
}

export function scriptKindLabel(kind: ScriptRegistryEntry['kind']): string {
	switch (kind) {
		case 'main_short':
			return m.script_kind_main_short();
		case 'festival_cut':
			return m.script_kind_festival_cut();
		case 'trailer':
			return m.script_kind_trailer();
		case 'long_version':
			return m.script_kind_long_version();
		default:
			return kind;
	}
}

export function scriptStatusLabel(status: ScriptRegistryEntry['status']): string {
	return status === 'draft' ? m.script_status_draft() : status;
}
