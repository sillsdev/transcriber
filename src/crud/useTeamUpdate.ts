import { useGlobal } from 'reactn';
import { Organization } from '../model';
import { TransformBuilder } from '@orbit/data';

export const useTeamUpdate = () => {
  const [memory] = useGlobal('memory');

  return (team: Organization) => {
    memory.update((t: TransformBuilder) => t.updateRecord(team));
  };
};
