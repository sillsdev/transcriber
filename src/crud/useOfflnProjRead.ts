import { Plan, VProject, OfflineProjectD } from '../model';
import { related } from '.';
import { useOrbitData } from '../hoc/useOrbitData';
import { useGlobal } from 'reactn';
import IndexedDBSource from '@orbit/indexeddb';
import { useEffect, useState } from 'react';

export const useOfflnProjRead = () => {
  const [coordinator] = useGlobal('coordinator');
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const [recs, setRecs] = useState<OfflineProjectD[]>([]);
  let offlineProjectRecs = useOrbitData<OfflineProjectD[]>('offlineproject');

  useEffect(() => {
    if (backup === undefined) return;
    backup
      .query((q) => q.findRecords('offlineproject'))
      .then((val) => setRecs(val as OfflineProjectD[]));
  }, [backup]);

  return (plan: Plan | VProject | string) => {
    if (offlineProjectRecs.length === 0) {
      console.log('using backup ', recs);
      offlineProjectRecs = recs;
    }

    const projectId =
      typeof plan === 'string' ? plan : related(plan, 'project');
    const selected = offlineProjectRecs.filter(
      (o) => related(o, 'project') === projectId
    );
    console.log('useOfflnProjRead', plan, selected);
    return selected.length > 0 ? selected[0] : ({} as OfflineProjectD);
  };
};
