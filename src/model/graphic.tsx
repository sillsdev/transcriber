import { Record, RecordRelationship } from '@orbit/data';

export interface Graphic extends Record {
  attributes: {
    resourceType: string;
    resourceId: number;
    info: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    mediafile: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default Graphic;
