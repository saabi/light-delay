import { faceFamilies, type InterfaceFace } from './readability';

/* Inter is bundled with the layout; reading-support faces load only when chosen. */
const faceLoaders: Record<InterfaceFace, () => Promise<unknown>> = {
	inter: async () => {},
	atkinson: () =>
		Promise.all([
			import('@fontsource/atkinson-hyperlegible-next/400.css'),
			import('@fontsource/atkinson-hyperlegible-next/700.css')
		]),
	opendyslexic: () =>
		Promise.all([
			import('@fontsource/opendyslexic/400.css'),
			import('@fontsource/opendyslexic/700.css')
		])
};

/** Loads the face's stylesheet and waits for the face itself, so measurements use it. */
export async function loadInterfaceFace(face: InterfaceFace) {
	await faceLoaders[face]();
	await Promise.all([
		document.fonts.load(`400 1rem "${faceFamilies[face]}"`),
		document.fonts.load(`700 1rem "${faceFamilies[face]}"`)
	]);
}
