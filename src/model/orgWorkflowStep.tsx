import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { WorkflowStep } from '.';

export interface OrgWorkflowStep extends WorkflowStep {
  attributes: {
    process: string;
    name: string;
    sequencenum: number;
    tool: string;
    permissions: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type OrgWorkflowStepD = OrgWorkflowStep & InitializedRecord;

export default OrgWorkflowStep;
