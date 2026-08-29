import { getDocuments, listScripts } from '$lib/data/repositories/index';
import { VALID_ENTITY_KINDS, listEntities, type EntityKind } from '$lib/data/repositories/lookups';
import { encodeRouteId } from '$lib/utils/routeId';
import { encodeScriptId } from '$lib/utils/scriptId';

export const prerender = true;
const origin = 'https://saabi.github.io/light-delay';
const escapeXml = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export const GET = () => {
	const paths = new Set<string>(['/', '/project/', '/art/', '/reports/']);
	for (const script of listScripts()) {
		const id = encodeScriptId(script.id);
		paths.add(`/script/${id}/`);
		paths.add(`/animatic/${id}/`);
		paths.add(`/compare/${id}/`);
	}
	for (const document of getDocuments().documents) paths.add(`/documents/${document.slug}/`);
	for (const kind of VALID_ENTITY_KINDS as readonly EntityKind[]) {
		paths.add(`/entities/${kind}/`);
		for (const entity of listEntities(kind))
			paths.add(`/entities/${kind}/${encodeRouteId(entity.id)}/`);
	}
	const urls = [...paths]
		.map((path) => {
			const en = `${origin}${path}`;
			const es = `${origin}/es${path}`;
			return `<url><loc>${escapeXml(en)}</loc><xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/><xhtml:link rel="alternate" hreflang="es" href="${escapeXml(es)}"/></url>`;
		})
		.join('');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,
		{ headers: { 'content-type': 'application/xml; charset=utf-8' } }
	);
};
