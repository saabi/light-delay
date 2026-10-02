import { describe, expect, it } from 'vitest';
import { diffWords } from './text-diff';

const rebuild = (parts: ReturnType<typeof diffWords>, side: 'before' | 'after') =>
	parts
		.filter((part) => part.op === 'equal' || part.op === (side === 'before' ? 'delete' : 'insert'))
		.map((part) => part.text)
		.join('');

describe('diffWords', () => {
	it('marks replaced words and keeps the rest equal', () => {
		expect(diffWords('Leave the channel open.', 'Keep the channel alive.')).toEqual([
			{ op: 'delete', text: 'Leave' },
			{ op: 'insert', text: 'Keep' },
			{ op: 'equal', text: ' the channel ' },
			{ op: 'delete', text: 'open.' },
			{ op: 'insert', text: 'alive.' }
		]);
	});

	it('handles pure insertions, deletions and identical text', () => {
		expect(diffWords('Leave it open.', 'Leave it open. Now.')).toEqual([
			{ op: 'equal', text: 'Leave it open.' },
			{ op: 'insert', text: ' Now.' }
		]);
		expect(diffWords('A b c', 'A c')).toEqual([
			{ op: 'equal', text: 'A ' },
			{ op: 'delete', text: 'b ' },
			{ op: 'equal', text: 'c' }
		]);
		expect(diffWords('Same.', 'Same.')).toEqual([{ op: 'equal', text: 'Same.' }]);
		expect(diffWords('', 'New.')).toEqual([{ op: 'insert', text: 'New.' }]);
	});

	it('always reconstructs both sides exactly', () => {
		const pairs = [
			[
				'Mara steadies the lamp as the last ferry clears the breakwater.',
				'Mara lifts the lamp; the ferry clears the breakwater at last.'
			],
			['  spaced\ttext\n', 'spaced text'],
			['one two three', 'three two one']
		];
		for (const [before, after] of pairs) {
			const parts = diffWords(before, after);
			expect(rebuild(parts, 'before')).toBe(before);
			expect(rebuild(parts, 'after')).toBe(after);
		}
	});
});
