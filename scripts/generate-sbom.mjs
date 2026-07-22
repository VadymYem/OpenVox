import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
const project = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

const normalizeLicense = (value) => {
  if (!value) return [{ license: { name: 'NOASSERTION' } }];
  if (typeof value === 'string') return [{ license: { id: value } }];
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeLicense(item?.type ?? item));
  }
  if (typeof value === 'object' && value.type) return normalizeLicense(value.type);
  return [{ license: { name: 'NOASSERTION' } }];
};

const encodePackageName = (name) =>
  name.startsWith('@')
    ? name
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/')
    : encodeURIComponent(name);

const componentsByRef = new Map();

for (const [packagePath, metadata] of Object.entries(lock.packages ?? {})) {
  if (!packagePath || !metadata?.version) continue;
  const name = metadata.name ?? packagePath.split('node_modules/').at(-1);
  if (!name) continue;

  let installedMetadata = {};
  const packageJsonPath = join(root, packagePath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      installedMetadata = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    } catch {
      installedMetadata = {};
    }
  }

  const version = metadata.version;
  const purl = `pkg:npm/${encodePackageName(name)}@${encodeURIComponent(version)}`;
  const component = {
    type: 'library',
    'bom-ref': purl,
    name,
    version,
    purl,
    licenses: normalizeLicense(installedMetadata.license ?? metadata.license)
  };

  const homepage = installedMetadata.homepage;
  const repository =
    typeof installedMetadata.repository === 'string' ? installedMetadata.repository : installedMetadata.repository?.url;
  const externalReferences = [];
  if (homepage) externalReferences.push({ type: 'website', url: homepage });
  if (repository) {
    const cleaned = repository.replace(/^git\+/, '').replace(/\.git$/, '');
    if (/^https?:\/\//.test(cleaned)) {
      externalReferences.push({ type: 'vcs', url: cleaned });
    }
  }
  if (externalReferences.length) component.externalReferences = externalReferences;

  componentsByRef.set(purl, component);
}

const components = [...componentsByRef.values()].sort((a, b) =>
  `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)
);

const lockDigest = createHash('sha256')
  .update(await readFile(join(root, 'package-lock.json')))
  .digest('hex');

const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  version: 1,
  metadata: {
    component: {
      type: 'application',
      'bom-ref': `pkg:npm/${encodePackageName(project.name)}@${encodeURIComponent(project.version)}`,
      name: project.name,
      version: project.version,
      licenses: normalizeLicense(project.license),
      purl: `pkg:npm/${encodePackageName(project.name)}@${encodeURIComponent(project.version)}`
    },
    properties: [
      { name: 'openvox:package-lock-sha256', value: lockDigest },
      { name: 'openvox:component-count', value: String(components.length) }
    ]
  },
  components
};

await writeFile(join(root, 'sbom.cdx.json'), `${JSON.stringify(sbom, null, 2)}\n`);
console.log(`Generated CycloneDX SBOM with ${components.length} locked components.`);
