import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const declared = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
  ...Object.keys(packageJson.optionalDependencies ?? {})
]);

const sourceRoots = ['src', 'tests', 'scripts'];
const explicitFiles = ['vite.config.ts', 'vitest.config.ts', 'eslint.config.js'];
const supportedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const imports = new Set();

function packageName(specifier) {
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0];
}

function collectImports(source) {
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) continue;
      imports.add(packageName(specifier));
    }
  }
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (supportedExtensions.has(extname(entry.name))) collectImports(await readFile(path, 'utf8'));
  }
}

for (const directory of sourceRoots) await walk(directory);
for (const file of explicitFiles) collectImports(await readFile(file, 'utf8'));

const undeclared = [...imports].filter((name) => !declared.has(name)).sort();
if (undeclared.length) {
  console.error(`Undeclared direct package imports: ${undeclared.join(', ')}`);
  process.exit(1);
}

console.log(`Dependency declaration check passed for ${imports.size} directly imported packages.`);
