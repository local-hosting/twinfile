import type { PatchConnection } from '../../types/patch-graph.js';
import { patchCordId } from '../processor-graph-edit.js';

export class PatchCord {
  readonly connection: PatchConnection;
  readonly id: string;
  cut = false;

  constructor(connection: PatchConnection) {
    this.connection = connection;
    this.id = patchCordId(connection.from, connection.to);
  }
}
