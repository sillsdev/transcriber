import { useGlobal } from '../context/GlobalContext';
import { User } from '../model';
import { useOrbitData } from '../hoc/useOrbitData';

export const useUiLang = () => {
  const users = useOrbitData<User[]>('user');
  const [user] = useGlobal('user');

  return () => {
    const userRec = users.filter((u) => u.id === user) as User[];
    return userRec[0]?.attributes?.locale || 'en';
  };
};
