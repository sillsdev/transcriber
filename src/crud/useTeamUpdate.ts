import { useGlobal } from 'reactn';
import { Organization } from '../model';
import { TransformBuilder } from '@orbit/data';
import { ReplaceRelatedRecord, UpdateRecord } from '../model/baseModel';

export const useTeamUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return (team: Organization, titleMediafile: string, isoMediafile: string) => {
    const t = new TransformBuilder();
    const ops = [
      ...UpdateRecord(t, team, user),
      ...ReplaceRelatedRecord(
        t,
        team,
        'titleMediafile',
        'mediafile',
        titleMediafile
      ),
      ...ReplaceRelatedRecord(
        t,
        team,
        'isoMediafile',
        'mediafile',
        isoMediafile
      ),
    ];
    memory.update(ops);
  };
};
