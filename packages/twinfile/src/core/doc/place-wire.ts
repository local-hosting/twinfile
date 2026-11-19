/** Wire JSON for MCP `twin://place` (root) and {@link Place.toWire}. */
export type PlaceWireJson = {
  meta: Record<string, unknown>;
  place: Record<string, unknown>;
  digest: string;
};
