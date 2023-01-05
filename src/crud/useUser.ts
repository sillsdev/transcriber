import { useGlobal } from '../mods/reactn';
import { User } from '../model';
import { QueryBuilder } from '@orbit/data';

export const useUser = () => {
  const [memory] = useGlobal('memory');
  const getUserRec = (id: string) => {
    let user = {
      id: '',
      attributes: { avatarUrl: null, name: 'Unknown', familyName: '' },
    } as any;
    if (!id) {
      return user;
    }
    try {
      user = memory.cache.query((q: QueryBuilder) =>
        q.findRecord({ type: 'user', id })
      ) as User;
    } catch (error) {
      // leave default user data
    }
    return user;
  };
  return {
    getUserRec,
  };
};
