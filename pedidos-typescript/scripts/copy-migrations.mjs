import { cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDirectory = join(projectDirectory, 'src', 'migrations', 'sql');
const outputDirectory = join(projectDirectory, 'dist', 'migrations', 'sql');

await mkdir(outputDirectory, { recursive: true });
await cp(sourceDirectory, outputDirectory, { recursive: true, force: true });
