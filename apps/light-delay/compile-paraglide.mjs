import { compile } from '@inlang/paraglide-js';
import { paraglideOptions } from './paraglide.config.mjs';

await compile(paraglideOptions());

// A failed plugin load must not produce a deceptively successful empty compiler run.
const { readFile } = await import('node:fs/promises');
const messages = JSON.parse(await readFile('./messages/en.json', 'utf8'));
const generated = await readFile('./src/lib/paraglide/messages/_index.js', 'utf8');
for (const key of Object.keys(messages).filter(key => key !== '$schema')) {
 if (!generated.includes(key)) throw new Error('Localization compiler omitted message: ' + key);
}
