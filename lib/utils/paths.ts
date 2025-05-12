import * as path from 'path';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');

export const SRC = (...segments: string[]) =>
  path.join(PROJECT_ROOT, 'src', ...segments);