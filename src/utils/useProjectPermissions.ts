import { useEffect, useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useRole } from '../crud/useRole';
import { usePeerGroups } from '../components/Peers/usePeerGroups';
import { findRecord, related } from '../crud';
import { ProjectD } from '../model';
import { useOrbitData } from '../hoc/useOrbitData';

export const useProjectPermissions = (team?: string, proj?: string) => {
  const [canEditSheet, setCanEditSheet] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { userIsAdmin, userIsOrgAdmin } = useRole();
  const [isAdmin, setIsAdmin] = useState(false);
  const { myGroups } = usePeerGroups(team);
  const [project] = useGlobal('project'); //will be constant here
  const [projectRec, setProjectRec] = useState<ProjectD>();
  const projects = useOrbitData<ProjectD[]>('project');

  useEffect(() => {
    if (team) setIsAdmin(userIsOrgAdmin(team));
    else setIsAdmin(userIsAdmin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, userIsAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setProjectRec(findRecord(memory, 'project', proj ?? project) as ProjectD);
    }
  }, [memory, proj, project, isAdmin, projects]);

  useEffect(() => {
    var editgroup = related(projectRec, 'editsheetgroup');
    var edituser = related(projectRec, 'editsheetuser');

    setCanEditSheet(
      (!(isOffline && !offlineOnly) &&
        (isAdmin ||
          (editgroup && myGroups.findIndex((g) => g.id === editgroup) > -1) ||
          (edituser && edituser === user))) ??
        false
    );

    var publishgroup = related(projectRec, 'publishgroup');
    var publishuser = related(projectRec, 'publishuser');

    setCanPublish(
      (isAdmin ||
        (publishgroup &&
          myGroups.findIndex((g) => g.id === publishgroup) > -1) ||
        (publishuser && publishuser === user)) ??
        false
    );
  }, [projectRec, myGroups, isAdmin, user, isOffline, offlineOnly]);

  return { canEditSheet, canPublish };
};
