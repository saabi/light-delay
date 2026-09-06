/** Studio is a local-only editor. Production and Pages builds never advertise it. */
export function shouldShowStudioNav(dev: boolean = import.meta.env.DEV): boolean {
	return dev === true;
}

export function studioUnavailable(): boolean {
	return !shouldShowStudioNav();
}
