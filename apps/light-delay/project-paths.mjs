import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
// Transitional evidence adapter. R3/R4 and canonical media relocation remain deferred.
export const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
export const dataRoot = join(repositoryRoot, 'data');
export const mediaRoot = join(repositoryRoot, 'static');
export const toolsRoot = join(repositoryRoot, 'scripts');
export const legacyAliases = {
 '$project-data': dataRoot,
 '$project-tools': toolsRoot,
 '$project-static': mediaRoot,
 '$legacy-project': fileURLToPath(import.meta.url)
};
