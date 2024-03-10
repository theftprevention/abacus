import { rm } from 'node:fs/promises';

(async () => {
  await rm('bin/layers', { force: true, recursive: true });
})();
