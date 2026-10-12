// The claude.ai artifact publisher rejects files containing a literal U+FFFD.
// gpt-tokenizer's vocabulary contains it inside plain string literals, where the
// escape sequence � means exactly the same thing.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'dist-preview/assets';
for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const p = join(dir, f);
  const s = readFileSync(p, 'utf8');
  if (s.includes('�')) writeFileSync(p, s.replaceAll('�', '\\uFFFD'));
}
