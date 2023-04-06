import React from 'react';
import { useGlobal } from 'reactn';
import { Organization, User } from '../model';
import { QueryBuilder } from '@orbit/data';
import { waitForIt } from '../utils';
import { useTeamCreate, useIsPersonalTeam, remoteIdNum } from '.';
import related from './related';
import { checkPersOrgs } from '../utils/checkPersOrgs';

export const useNewTeamId = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const teamRef = React.useRef<string>();
  const orbitTeamCreate = useTeamCreate();
  const isPersonal = useIsPersonalTeam();

  const newPersonal = () => {
    if (!user) return;
    teamRef.current = getPersonalId();
    if (!teamRef.current) {
      const users = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('user')
      ) as User[];
      const userRecs = users.filter((u) => u.id === user);
      const userName =
        userRecs.length > 0 ? userRecs[0]?.attributes?.name : 'user';
      const personalOrg = `>${userName} Personal<`;
      orbitTeamCreate(
        {
          attributes: { name: personalOrg },
        } as Organization,
        (org: string) => {
          teamRef.current = org;
        }
      );
    }
  };

  const getPersonalId = () => {
    const orgs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organization')
    ) as Organization[];
    //Ugh, there's more than one per person.  Always get the last one created
    const orgRecs = orgs
      .filter((o) => related(o, 'owner') === user && isPersonal(o.id))
      .sort(
        (a, b) =>
          remoteIdNum('organization', b.id, memory.keyMap) -
          remoteIdNum('organization', a.id, memory.keyMap)
      );
    checkPersOrgs(orgRecs);
    return orgRecs.length > 0 ? orgRecs[0].id : undefined;
  };

  return async (teamIdType: string | undefined) => {
    let teamId: string;
    if (teamIdType) {
      teamId = teamIdType;
    } else {
      const testId = getPersonalId();
      if (testId) {
        teamId = testId;
      } else {
        newPersonal();
        await waitForIt(
          'create new team',
          () => teamRef.current !== undefined,
          () => false,
          100
        );
        teamId = teamRef.current as string;
      }
    }
    return teamId;
  };
};
