import { useGlobal } from 'reactn';
import { Organization } from '../model';
import { TransformBuilder } from '@orbit/data';
import { UpdateRecord } from '../model/baseModel';

export const useTeamUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return (team: Organization) => {
    const t = new TransformBuilder();
    memory.update(UpdateRecord(t, team, user));
  };
};
