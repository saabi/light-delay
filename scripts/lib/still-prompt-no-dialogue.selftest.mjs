import assert from 'node:assert/strict';
import {
	isPreservedDiegeticQuote,
	looksLikeSpokenDialogue,
	stripSpokenDialogueQuotes,
	stripSubtitleAvoidBoilerplate,
	scrubStillTakeGeneration
} from './still-prompt-no-dialogue.mjs';

assert.equal(isPreservedDiegeticQuote('LIGHT DELAY'), true);
assert.equal(looksLikeSpokenDialogue('I wish they were right.'), true);

assert.equal(
	stripSpokenDialogueQuotes(
		'Harlan speaks quietly to himself: "I wish they were right." The others half-listen.'
	),
	'Harlan speaks quietly to himself. The others half-listen.'
);

assert.equal(
	stripSpokenDialogueQuotes(
		'Zao begins plotting a moving intercept and says, "There you are." Only "23 H 15 MIN" is legible.'
	),
	'Zao begins plotting a moving intercept. Only "23 H 15 MIN" is legible.'
);

assert.doesNotMatch(
	stripSubtitleAvoidBoilerplate(
		'Action: Zao reads. Avoid subtitles, closed captions, burned-in dialogue, speech bubbles, lower-thirds, and any on-image spoken lines. Avoid off-screen characters.'
	),
	/Avoid subtitles/
);

const take = {
	generation: {
		prompt:
			'Action: Zao reads aloud: "Multi-megaton." Composition: CU. Avoid subtitles, closed captions, burned-in dialogue, speech bubbles, lower-thirds, and any on-image spoken lines.',
		negativePrompt: 'no watermark; no subtitles; no closed captions; no burned-in dialogue; no speech bubbles; no lower-thirds; no on-image spoken lines'
	}
};
assert.equal(scrubStillTakeGeneration(take), true);
assert.doesNotMatch(take.generation.prompt, /Multi-megaton/);
assert.doesNotMatch(take.generation.prompt, /Avoid subtitles/);
assert.match(take.generation.prompt, /Composition: CU/);
assert.equal(take.generation.negativePrompt, 'no watermark');

console.log('still-prompt-no-dialogue.selftest: ok');
