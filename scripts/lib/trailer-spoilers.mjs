const RULES = [
	{
		id: 'culprit-identity',
		message: 'The trailer identifies the culprit.',
		pattern: /\b(?:harlan|character:harlan)\b/i
	},
	{
		id: 'send-confirmed',
		message: 'The trailer confirms completion of Zao’s transmission.',
		pattern:
			/(?:100\s*%[^\n]{0,40}(?:transmit|envi)|\btransmitid[oa]\b|\btransmitted\b|transmisi[oó]n completa|complete transmission)/i
	},
	{
		id: 'reception-confirmed',
		message: 'The trailer confirms reception or authenticates Zao’s message.',
		pattern:
			/(?:señal humana|human signal|origen:\s*láser exterior|origin:\s*external laser|la advertencia (?:alcanza|llega)|the warning (?:arrives|catches)|mensaje (?:autenticado|auténtico)|authenticated message)/i
	},
	{
		id: 'death-confirmed',
		message: 'The trailer positively confirms Zao’s death.',
		pattern:
			/(?:golpe corporal seco|dry bodily impact|cesa(?:n)? (?:el forcejeo y )?la respiración|breathing ceases|cuerpo de zao|zao[’']s body|pausa mortuoria|fatal pause)/i
	}
];

/** @typedef {{ path: string, text: string }} LocatedString */
/** @typedef {{ ruleId: string, message: string, documentIndex: number, path: string, text: string }} SpoilerHit */

/**
 * @param {unknown} value
 * @param {string} path
 * @param {LocatedString[]} output
 * @returns {LocatedString[]}
 */
function collectStrings(value, path = '$', output = []) {
	if (typeof value === 'string') output.push({ path, text: value });
	else if (Array.isArray(value))
		value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, output));
	else if (value && typeof value === 'object')
		Object.entries(value).forEach(([key, child]) =>
			collectStrings(child, `${path}.${key}`, output)
		);
	return output;
}

/**
 * @param {...unknown} documents
 * @returns {SpoilerHit[]}
 */
export function findTrailerSpoilers(...documents) {
	/** @type {SpoilerHit[]} */
	const hits = [];
	for (const [documentIndex, document] of documents.entries()) {
		for (const item of collectStrings(document)) {
			for (const rule of RULES) {
				if (rule.pattern.test(item.text)) {
					hits.push({
						ruleId: rule.id,
						message: rule.message,
						documentIndex,
						path: item.path,
						text: item.text
					});
				}
			}
		}
	}
	return hits;
}
