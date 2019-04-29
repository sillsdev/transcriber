import { Record, RecordRelationship } from '@orbit/data';

export interface UserTasks extends Record {
  attributes: {
    userId: number;
    projectId: number;
    activityName: string;
    taskState: string;
    comment: string;
    dateCreated: string | null;
    dateUpdated: string | null;
  };
  relationships?: {
    user: RecordRelationship;
    task: RecordRelationship;
    project: RecordRelationship;
    tasks: RecordRelationship;
  };
};

export default UserTasks;  