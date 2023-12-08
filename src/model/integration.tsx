import {
  UninitializedRecord,
  RecordRelationship,
  InitializedRecord,
} from '@orbit/records';

export interface Integration extends UninitializedRecord {
  attributes: {
    name: string;
    url: string;
  };
  relationships?: {
    projectIntegrations: RecordRelationship;
  };
}

export type IntegrationD = Integration & InitializedRecord;

export default Integration;
