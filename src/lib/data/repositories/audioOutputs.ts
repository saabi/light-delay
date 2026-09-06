import audioOutputsJson from '../../../../data/production/audio/audio-outputs.json';
import { assertJsonModule } from '../loaders/loadJson';

const ABSOLUTE_OR_TRAVERSAL = /(?:^[A-Za-z]:)|(?:^[\\/])|(?:\.\.)/;

export type AudioOutputRow = {
	id: string;
	kind: string;
	lang: 'es' | 'en';
	label: { es: string; en: string };
	description: { es: string; en: string };
	sourceOutlineId: string;
	sourceOutlineRevision: number;
	chunksKey: string;
	canonicalMp3Key: string;
	assembledKey: string;
	recordableSpeakers: string[];
	expectedSampleRate: number;
	expectedCueCount: number;
};

export type AudioOutputsFile = {
	schemaVersion: string;
	outputs: AudioOutputRow[];
};

export function getAudioOutputsFile(): AudioOutputsFile {
	return assertJsonModule(audioOutputsJson as AudioOutputsFile, 'production/audio/audio-outputs');
}

export function listAudioOutputs(): AudioOutputRow[] {
	return getAudioOutputsFile().outputs;
}

export function getAudioOutput(id: string): AudioOutputRow {
	const row = listAudioOutputs().find((item) => item.id === id);
	if (!row) throw new Error(`Unknown audio output ${id}`);
	return row;
}

export function looksAbsoluteOrTraversal(value: string): boolean {
	return ABSOLUTE_OR_TRAVERSAL.test(value);
}
