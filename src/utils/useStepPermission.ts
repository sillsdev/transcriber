import { useState } from 'react';
import { usePeerGroups } from '../components/Peers/usePeerGroups';
import { useGlobal } from '../context/GlobalContext';
import { useRole } from '../crud';
import { useOrbitData } from '../hoc/useOrbitData';
import { ProjectD } from '../model';

export const useStepPermissions = (team?: string, proj?: string) => {
  /*const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  */
  const { userIsAdmin, userIsOrgAdmin } = useRole();
  /*
  const [isAdmin, setIsAdmin] = useState(false);
  const { myGroups } = usePeerGroups(team);
  const [project] = useGlobal('project'); //will be constant here
  const [projectRec, setProjectRec] = useState<ProjectD>();
  const projects = useOrbitData<ProjectD[]>('project');
  */
  const canDoVernacular = (section: string) => userIsAdmin;

  return { canDoVernacular };
};
