import React from 'react';
import { useGlobal } from 'reactn';
import { Group } from '../model';
import { QueryBuilder, Record } from '@orbit/data';
import { related } from '.';

export const useGroups = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly');

  interface IUniqueGroups {
    [key: string]: Group;
  }

  const groups = React.useMemo(() => {
    const uniqueGroups = {} as IUniqueGroups;
    const allGroups = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('group')
    ) as Group[];
    allGroups.forEach((r) => {
      if (offlineOnly !== Boolean(r?.keys?.remoteId)) {
        if (r?.attributes?.name) uniqueGroups[r.attributes.name] = r;
      }
    });
    return Object.values(uniqueGroups);
  }, [offlineOnly, memory]);

  const getGroupId = function (group: string): string {
    let findit = groups.filter(
      (r) => r.attributes && r.attributes.name === group
    );
    if (findit.length > 0) return findit[0].id;
    return '';
  };

  const getMyGroups = (orgId: string) => {
    const gms = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('groupmembership')
    ) as Record[];
    var groupIds = gms
      .filter(
        (tbl) =>
          related(tbl, 'user') === user && related(tbl, 'owner') === orgId
      )
      .map((om) => related(om, 'group'));
    const groups = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('group')
    ) as Record[];
    return groups.filter((g) => groupIds.includes(g.id));
  };

  return {
    getMyGroups,
    getGroupId,
  };
};
