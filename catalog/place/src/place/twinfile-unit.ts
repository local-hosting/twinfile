import { join, resolve } from 'node:path';

import {
  findTwinfileYamlPath,
  loadTwinfile,
  type LoadedTwinfile,
  type Result,
} from '@doppler-group/twinfile-core';

import { buildTwinfile, type BuildTwinfileOptions } from '../build/build-twinfile.js';
import type { Place } from './built-place.js';

/**
 * Handle to a Twinfile unit on disk (`Twinfile.yaml` + layer tree).
 * Call {@link Twinfile.build} to produce a {@link Place}; wrap with `TFPlace` in `@doppler-group/twinfile-simulator` for playback.
 */
export class Twinfile {
  readonly root: string;

  private constructor(root: string) {
    this.root = resolve(root);
  }

  /** Unit directory (folder containing `Twinfile.yaml`). */
  static at(unitDir: string): Twinfile {
    return new Twinfile(unitDir);
  }

  get yamlPath(): string {
    return findTwinfileYamlPath(this.root) ?? join(this.root, 'Twinfile.yaml');
  }

  load(): Result<LoadedTwinfile> {
    return loadTwinfile(this.root);
  }

  build(options: BuildTwinfileOptions = {}): Promise<Result<Place>> {
    return buildTwinfile(this.root, options);
  }
}
