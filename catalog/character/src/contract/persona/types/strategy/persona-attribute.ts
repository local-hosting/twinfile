/** Closed vocabulary for persona stance — defined per AXM under `f-strategy/attributes/`. */
export type PersonaAttribute = {
  id: string;
  label: string;
  values: string[];
};

export type ResolvedPersonaAttribute = {
  id: string;
  label: string;
  value: string;
};
