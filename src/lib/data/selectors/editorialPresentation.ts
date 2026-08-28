const LABELS: Record<string, { es: string; en: string }> = {
	draft: { es: 'borrador', en: 'draft' },
	main_short: { es: 'corto principal', en: 'main short' },
	festival_cut: { es: 'cut de festival', en: 'festival cut' },
	long_version: { es: 'versión larga', en: 'feature version' },
	trailer: { es: 'tráiler', en: 'trailer' },
	extracted: { es: 'extraído', en: 'extracted' },
	stub: { es: 'esbozo', en: 'stub' },
	review: { es: 'en revisión', en: 'under review' },
	established: { es: 'establecido', en: 'established' },
	reworked: { es: 'reelaborado', en: 'reworked' },
	present: { es: 'presente', en: 'present' },
	omitted: { es: 'omitido', en: 'omitted' },
	image: { es: 'imagen', en: 'image' },
	reference: { es: 'referencia', en: 'reference' },
	animatic: { es: 'animatic', en: 'animatic' },
	animatic_placeholder: { es: 'placeholder de animatic', en: 'animatic placeholder' },
	selected: { es: 'seleccionado', en: 'selected' },
	needs_replacement: { es: 'requiere reemplazo', en: 'needs replacement' },
	placeholder: { es: 'referencia provisional', en: 'temporary reference' },
	missing: { es: 'ausente', en: 'missing' },
	current: { es: 'vigente', en: 'current' },
	action: { es: 'acción', en: 'action' },
	dialogue: { es: 'diálogo', en: 'dialogue' },
	text: { es: 'texto', en: 'text' },
	sound: { es: 'sonido', en: 'sound' },
	todo: { es: 'pendiente', en: 'to do' },
	editorial: { es: 'editorial', en: 'editorial' },
	radio: { es: 'radio', en: 'radio' },
	recording: { es: 'grabación', en: 'recording' },
	on_screen: { es: 'en pantalla', en: 'on screen' },
	voice_over: { es: 'voz en off', en: 'voice-over' },
	off_screen: { es: 'fuera de campo', en: 'offscreen' },
	title: { es: 'título', en: 'title' },
	interface: { es: 'interfaz', en: 'interface' },
	time_card: { es: 'cartela temporal', en: 'time card' },
	caption: { es: 'rótulo', en: 'caption' },
	INT_EXT: { es: 'INT./EXT.', en: 'INT./EXT.' },
	dolly: { es: 'dolly', en: 'dolly' },
	locked: { es: 'fija', en: 'locked off' },
	handheld: { es: 'cámara en mano', en: 'handheld' },
	tracking: { es: 'seguimiento', en: 'tracking' },
	pan: { es: 'paneo', en: 'pan' },
	emotion: { es: 'emoción', en: 'emotion' },
	intention: { es: 'intención', en: 'intention' }
};

export function editorialValueLabel(value: unknown, language: string): string {
	if (value === undefined || value === null || value === '') return '—';
	const text = String(value);
	const labels = LABELS[text];
	return labels?.[language === 'es' ? 'es' : 'en'] ?? text;
}
