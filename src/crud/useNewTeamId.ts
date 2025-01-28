import React from 'react';
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { Organization, OrganizationD, User } from '../model';
import { waitForIt } from '../utils';
import { useTeamCreate, isPersonalTeam, remoteIdNum, defaultWorkflow } from '.';
import related from './related';
import { RecordKeyMap } from '@orbit/records';

export const useNewTeamId = () => {
  const [memory] = useGlobal('memory');
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const getGlobal = useGetGlobal();
  const teamRef = React.useRef<string>();
  const orbitTeamCreate = useTeamCreate();

  const getPersonalId = async () => {
    await waitForIt(
      'have user for personal team',
      () => Boolean(getGlobal('user')),
      () => false,
      100
    );
    const orgs = (await memory.query((q) =>
      q.findRecords('organization')
    )) as OrganizationD[];
    //Ugh, there's more than one per person.  Always get the last one created
    const orgRecs = orgs
      .filter(
        (o) =>
          related(o, 'owner') === getGlobal('user') &&
          isPersonalTeam(o.id, orgs)
      )
      .sort((a, b) =>
        Boolean(a.keys?.remoteId) && Boolean(b.keys?.remoteId)
          ? remoteIdNum('organization', b.id, memory?.keyMap as RecordKeyMap) -
            remoteIdNum('organization', a.id, memory?.keyMap as RecordKeyMap)
          : b >= a
          ? 1
          : -1
      );
    if (orgRecs.length > 1) {
      console.error(`${orgRecs.length} personal teams!`);
      console.log(orgRecs);
    }
    return orgRecs.length > 0 ? orgRecs[0].id : undefined;
  };

  const newPersonal = async () => {
    if (!getGlobal('user')) return;
    teamRef.current = await getPersonalId();
    if (!teamRef.current) {
      const userRec = memory.cache.query((q) =>
        q.findRecord({ type: 'user', id: getGlobal('user') })
      ) as User;
      const userName = userRec?.attributes?.name ?? 'user';
      const personalOrg = `>${userName} Personal<`;
      orbitTeamCreate(
        {
          attributes: { name: personalOrg },
        } as Organization,
        defaultWorkflow,
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
      } else if (!isOffline || offlineOnly) {
        await newPersonal();
        await waitForIt(
          'create new team',
          () => teamRef.current !== undefined,
          () => false,
          100
        );
        teamId = teamRef.current as string;
      } else teamId = '';
    }
    return teamId;
  };
};
