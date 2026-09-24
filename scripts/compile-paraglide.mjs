// Compatibility command; the compiler and configuration are owned by the legacy app.
import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['compile-paraglide.mjs'], { cwd: new URL('../apps/light-delay/', import.meta.url), stdio: 'inherit' });
process.exit(result.status ?? 1);
