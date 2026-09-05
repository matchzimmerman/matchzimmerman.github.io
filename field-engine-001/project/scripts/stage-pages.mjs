import { access, cp, readdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const destination = dirname(project);
if (basename(project) !== 'project' || basename(destination) !== 'field-engine-001') {
  throw new Error('Run this script from the FIELD ENGINE project inside its GitHub Pages directory.');
}
const dist = join(project, 'dist');
await access(join(dist, 'index.html'));
await access(join(dist, 'assets'));
await cp(join(dist, 'index.html'), join(destination, 'index.html'));
await cp(join(dist, 'assets'), join(destination, 'assets'), { recursive: true });
// Retain older hashed assets so open browser tabs can finish loading their version.
console.log(`Staged FIELD ENGINE: ${(await readdir(join(dist, 'assets'))).length} assets.`);
