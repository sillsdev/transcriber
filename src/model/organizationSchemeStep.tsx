import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface OrganizationSchemeStep extends BaseModel {
  attributes: {
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organizationScheme: RecordRelationship;
    orgWorkflowStep: RecordRelationship;
    user: RecordRelationship;
    group: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type OrganizationSchemeStepD = OrganizationSchemeStep &
  InitializedRecord;

export default OrganizationSchemeStep;
