import { Record, RecordRelationship } from '@orbit/data';

export interface TaskSet extends Record {
    attributes: {
      taskId: number;
      setId: number;
    };
    relationships?: {
      sets: RecordRelationship;
      tasks: RecordRelationship;
    };
  };
export default TaskSet;
