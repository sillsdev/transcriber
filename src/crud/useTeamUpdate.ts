import { useGlobal } from '../context/GlobalContext';
import { OrganizationD } from '../model';
import { RecordTransformBuilder } from '@orbit/records';
import { UpdateRecord } from '../model/baseModel';

export const useTeamUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return (team: OrganizationD) => {
    const t = new RecordTransformBuilder();
    memory.update(UpdateRecord(t, team, user));
  };
};
