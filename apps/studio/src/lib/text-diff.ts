export type DiffOp = 'equal' | 'insert' | 'delete';
export interface DiffPart {
	op: DiffOp;
	text: string;
}

/* Words and the whitespace between them, so a diff never splits a word. */
const tokenize = (text: string) => text.match(/\s+|[^\s]+/g) ?? [];

/**
 * Word-level diff of `before` → `after` (longest common subsequence over word and whitespace
 * tokens). Adjacent tokens with the same operation are merged. Screenplay elements are short, so
 * the quadratic table is fine.
 */
export function diffWords(before: string, after: string): DiffPart[] {
	const a = tokenize(before);
	const b = tokenize(after);
	const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
	for (let i = a.length - 1; i >= 0; i--)
		for (let j = b.length - 1; j >= 0; j--)
			lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
	const parts: DiffPart[] = [];
	const push = (op: DiffOp, text: string) => {
		const last = parts[parts.length - 1];
		if (last?.op === op) last.text += text;
		else parts.push({ op, text });
	};
	let i = 0;
	let j = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			push('equal', a[i]);
			i++;
			j++;
		} else if (lcs[i + 1][j] >= lcs[i][j + 1]) push('delete', a[i++]);
		else push('insert', b[j++]);
	}
	while (i < a.length) push('delete', a[i++]);
	while (j < b.length) push('insert', b[j++]);
	return parts;
}
