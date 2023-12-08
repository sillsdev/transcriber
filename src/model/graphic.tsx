import {
  UninitializedRecord,
  RecordRelationship,
  InitializedRecord,
} from '@orbit/records';

export interface Graphic extends UninitializedRecord {
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

export type GraphicD = Graphic & InitializedRecord;

export default Graphic;
