import { createTwinTypeRegistry, type TwinError, type TwinKind } from '@doppler-group/twinfile-core';
import { formatTwinErrors } from '@doppler-group/twinfile-core/cli';
import { module as characterModule } from '@doppler-group/twinfile-character/module';
import { module as contextModule } from '@doppler-group/twinfile-context/module';
import { module as eventModule } from '@doppler-group/twinfile-event/module';
import { module as placeModule } from '@doppler-group/twinfile-place/module';
import { module as resourceModule } from '@doppler-group/twinfile-resource/module';
import { module as storyModule } from '@doppler-group/twinfile-story/module';

const twinTypes = createTwinTypeRegistry([
  placeModule,
  resourceModule,
  characterModule,
  contextModule,
  storyModule,
  eventModule,
]);

function printBuildErrors(unitDir: string, errors: TwinError[], json: boolean): number {
  const lines = json ? [JSON.stringify({ ok: false, errors }, null, 2)] : formatTwinErrors(unitDir, errors);
  for (const line of lines) console.error(line);
  return 1;
}

export type RunTwinTypeBuildOptions = {
  examplesRoot?: string;
};

/** `twin build` for twin types other than place, dispatched through the type module. */
export async function runTwinTypeBuild(
  unitDir: string,
  kind: TwinKind,
  json: boolean,
  opts: RunTwinTypeBuildOptions = {},
): Promise<number> {
  const module = twinTypes.getOne(kind);
  if (!module.ok) return printBuildErrors(unitDir, module.errors, json);

  const built = await module.value.build(unitDir, { examplesRoot: opts.examplesRoot });
  if (!built.ok) return printBuildErrors(unitDir, built.errors, json);

  const twin = module.value.toJSON(built.value);
  const lines = json ? [JSON.stringify({ ok: true, kind, twin }, null, 2)] : [`ok ${unitDir} (${kind})`];
  for (const line of lines) console.log(line);
  return 0;
}
