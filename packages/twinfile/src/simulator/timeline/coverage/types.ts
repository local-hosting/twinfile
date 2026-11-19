export type CoverageProtocol = 'wifi' | 'ble' | 'lora';

export type CoverageMetric = 'served' | 'rssi_dbm';

export type CoverageEngineId = 'graph-v0';

export type CoverageProfileDef = {
  id: string;
  engine?: CoverageEngineId;
  protocol: CoverageProtocol;
  pl0?: number;
  path_loss_n?: number;
  exposure_db?: Partial<Record<'outdoor' | 'covered' | 'indoor' | '(unset)', number>>;
  route_kind_db?: Partial<Record<string, number>>;
  opening_db?: number;
  opening_path_m?: number;
  same_space_offset_db?: number;
  default_tx_power_dbm?: number;
  max_range_m?: number;
};

export type RadioAsset = {
  protocol: CoverageProtocol;
  tx_power_dbm?: number;
};

export type PlaceGraphEdge = {
  from: string;
  to: string;
  length_m: number;
  via: 'route' | 'opening';
  routeKind?: string;
};
