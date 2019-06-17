import { Record, RecordRelationship } from '@orbit/data';

export interface Integration extends Record {
  attributes: {
    name: string;
    url: string;
  };
  relationships?: {
    projectIntegrations: RecordRelationship;
  };
}
export default Integration;
