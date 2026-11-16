/** Outlet patch cord on a processor (Max/MSP-style). */
export type ProcessorOutletWire = {
  port: string;
  to: { processor: string; port: string };
};

/** Processor instance on a place manifest (`processors:`). */
export type ManifestProcessor = {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  bind?: Record<string, string>;
  outlets?: ProcessorOutletWire[];
};
