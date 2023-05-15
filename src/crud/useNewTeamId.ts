import React from 'react';
import { useGlobal } from 'reactn';
import { Organization, User } from '../model';
import { QueryBuilder } from '@orbit/data';
import { waitForIt } from '../utils';
import { useTeamCreate, isPersonalTeam, remoteIdNum } from '.';
import related from './related';

export const useNewTeamId = () => {
  const [memory] = useGlobal('memory');
  const [globals] = useGlobal();
  const teamRef = React.useRef<string>();
  const orbitTeamCreate = useTeamCreate();

  const getPersonalId = async () => {
    await waitForIt(
      'have user for personal team',
      () => Boolean(globals.user),
      () => false,
      100
    );
    const orgs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organization')
    ) as Organization[];
    //Ugh, there's more than one per person.  Always get the last one created
    const orgRecs = orgs
      .filter(
        (o) =>
          related(o, 'owner') === globals.user && isPersonalTeam(o.id, orgs)
      )
      .sort(
        (a, b) =>
          remoteIdNum('organization', b.id, memory.keyMap) -
          remoteIdNum('organization', a.id, memory.keyMap)
      );
    return orgRecs.length > 0 ? orgRecs[0].id : undefined;
  };

  const newPersonal = async () => {
    if (!globals.user) return;
    teamRef.current = await getPersonalId();
    if (!teamRef.current) {
      const userRec = memory.cache.query((q: QueryBuilder) =>
        q.findRecord({ type: 'user', id: globals.user })
      ) as User;
      const userName = userRec?.attributes?.name ?? 'user';
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

  return async (teamIdType: string | undefined) => {
    let teamId: string;
    if (teamIdType) {
      teamId = teamIdType;
    } else {
      const testId = await getPersonalId();
      if (testId) {
        teamId = testId;
      } else {
        await newPersonal();
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
