const STORY_KEYS = new Set([
	'title',
	'summary',
	'dramaticPurpose',
	'purpose',
	'description',
	'statement',
	'note',
	'notes',
	'explanation',
	'replacementBrief',
	'timeOfDay',
	'storyTime',
	'continuity',
	'angle',
	'framing',
	'focus',
	'foreground',
	'background',
	'movementDescription',
	'startFrame',
	'endFrame',
	'text'
]);

function previousChild(previous, key, child) {
	const candidate = previous?.[key];
	if (!Array.isArray(child) || !Array.isArray(candidate)) return candidate;
	return child.map((item, index) => {
		if (item?.id) return candidate.find((entry) => entry?.id === item.id);
		return candidate[index];
	});
}

export function mergeGeneratedInlineI18n(value, previous, path = '$') {
	if (Array.isArray(value)) {
		return value.map((item, index) =>
			mergeGeneratedInlineI18n(item, previous?.[index], `${path}[${index}]`)
		);
	}
	if (!value || typeof value !== 'object') return value;

	const output = {};
	for (const [key, child] of Object.entries(value)) {
		const oldChild = previousChild(previous, key, child);
		if (key === 'variants' && value.sourceLanguage !== undefined) {
			const english = previous?.variants?.en;
			if (!english) throw new Error(`Missing existing English content variant for ${path}`);
			output[key] = { ...child, en: english };
			continue;
		}
		if (key === 'variants' && value.sourceLanguage === undefined) {
			output[key] = mergeGeneratedInlineI18n(child, oldChild, `${path}.${key}`);
			continue;
		}
		if (STORY_KEYS.has(key) && typeof child === 'string') {
			const english = oldChild?.en;
			if (typeof english !== 'string' || !english.trim()) {
				throw new Error(`Missing existing English translation for ${path}.${key}`);
			}
			output[key] = { es: child, en: english };
			continue;
		}
		output[key] = mergeGeneratedInlineI18n(child, oldChild, `${path}.${key}`);
	}

	return output;
}

export function assertGeneratedCheck(actual, expected, label) {
	if (actual !== expected) {
		throw new Error(`${label} is stale; run its build command and review the diff.`);
	}
}
