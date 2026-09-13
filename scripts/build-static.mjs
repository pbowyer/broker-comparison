import { cp, mkdir, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
const project = new URL('../', import.meta.url);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const path of ['index.html', 'styles.css', 'src', 'data']) {
  await cp(new URL(path, project), new URL(path, output), { recursive: true });
}

