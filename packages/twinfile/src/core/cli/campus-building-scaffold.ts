import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Starter RFC 0009 hint for campus archetypes (authoring prose; not merged). */
export function writeCampusBuildingScaffold(
  targetDir: string,
  unitName: string,
  suggestBuildingImport: boolean,
): boolean {
  if (!suggestBuildingImport) return false;
  const building = `${unitName}-interior`;
  const anchor = `${unitName}-building`;
  const body = `# Campus parts (RFC 0009)

\`twin init\` created a site shell only. A campus is a stack of building cards: each building is its own Twinfile under \`parts/\`, copied in by path. Full checklist: \`catalog/place/examples/PARTS.md\`. Spec: \`spec/doc/place/campus-building-floor.md\`.

1. Add a site space with id \`${anchor}\`.
2. Scaffold the building: \`twin init place parts/${building} --geotype office_building\`.
3. Run \`twin fmt --upgrade=2\` on the site and the building, then append to the site's \`steps:\`:

\`\`\`yaml
  - copy: ./parts/${building}
    into: ${anchor}
\`\`\`

Golden: \`catalog/place/examples/mobility-hub/campus\` (one building); \`catalog/place/examples/airport\` (building that copies \`./floors/airside\`).
`;
  mkdirSync(join(targetDir, 'parts'), { recursive: true });
  writeFileSync(join(targetDir, 'parts', 'README.md'), body);
  return true;
}