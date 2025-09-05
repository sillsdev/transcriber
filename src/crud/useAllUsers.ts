import { GroupD } from '../model';
import { related } from '.';
import { useOrbitData } from '../hoc/useOrbitData';

export const useAllUsersRec = () => {
  const groups = useOrbitData<GroupD[]>('group');

  return (orgId: string) => {
    var recs = groups.filter(
      (g) => related(g, 'owner') === orgId && g?.attributes?.allUsers
    );
    return recs.length > 0 ? recs[0] : undefined;
  };
};

export default useAllUsersRec;
