import { useGlobal } from 'reactn';
import { Organization } from '../model';
import { TransformBuilder } from '@orbit/data';

export const useTeamDelete = () => {
  const [memory] = useGlobal('memory');

  return (team: Organization) => {
    memory.update((t: TransformBuilder) => t.removeRecord(team));
  };
};
