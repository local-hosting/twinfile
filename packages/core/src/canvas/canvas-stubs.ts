import type { ProjectTwinBundle } from '../project/export-project-twin.js';

type TwinPanel = keyof ProjectTwinBundle['units'];

/** Minimal rows for host canvas import (id + labels). */
export function canvasStubEntity(type: TwinPanel, id: string): Record<string, unknown> {
  const cardTitle = id.replace(/-/g, ' ');
  switch (type) {
    case 'place':
      return { id, cardTitle, geo: '', label: cardTitle, orgVenueId: id, slug: id };
    case 'resource':
      return { id, cardTitle, geo: '', label: cardTitle, orgInventoryId: id, orgVehicleId: '' };
    case 'character':
    case 'event':
      return { id, cardTitle, label: cardTitle };
    case 'story':
      return {
        id,
        cardTitle,
        mapSlug: id,
        orgStoryboardId: id,
        personaId: '',
        storyPitch: '',
        title: cardTitle,
      };
    default: {
      const _never: never = type;
      return { id: _never, cardTitle };
    }
  }
}