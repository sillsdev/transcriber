import { useGlobal } from 'reactn';
import { Discussion } from '../model';
import { QueryBuilder } from '@orbit/data';
import { related } from '.';

export const useDiscussionOrg = () => {
  const [memory] = useGlobal('memory');
  return (d: Discussion) => {
    const id = related(d, 'orgWorkflowStep');
    if (!id) return '';
    const stepRecId = { type: 'orgworkflowstep', id };
    const rec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord(stepRecId)
    );
    return related(rec, 'organization');
  };
};
