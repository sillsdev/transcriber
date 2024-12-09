import { useGlobal } from '../context/GlobalContext';
import { UserD } from '../model';

export const useUser = () => {
  const [memory] = useGlobal('memory');
  const getUserRec = (id: string) => {
    let user = {
      id: '',
      attributes: { avatarUrl: null, name: 'Unknown', familyName: '' },
    } as UserD;
    if (!id) {
      return user;
    }
    try {
      user = memory?.cache.query((q) =>
        q.findRecord({ type: 'user', id })
      ) as UserD;
    } catch (error) {
      // leave default user data
    }
    return user;
  };
  return {
    getUserRec,
  };
};
