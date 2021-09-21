import React from 'react';
import { useGlobal } from 'reactn';
import * as actions from '../store';
import {
  Organization,
  OrganizationMembership,
  User,
  ISharedStrings,
} from '../model';
import { QueryBuilder } from '@orbit/data';
import { waitForIt } from '../utils';
import { useTeamCreate, useIsPersonalTeam } from '.';
import Auth from '../auth/Auth';
import related from './related';

interface IStateProps {
  ts: ISharedStrings;
}
interface IDispatchProps {
  resetOrbitError: typeof actions.resetOrbitError;
}
interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
}

export const useNewTeamId = (props: IProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const teamRef = React.useRef<string>();
  const orbitTeamCreate = useTeamCreate(props);
  const isPersonal = useIsPersonalTeam();

  const newPersonal = () => {
    teamRef.current = undefined;
    const users = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('user')
    ) as User[];
    const userRecs = users.filter((u) => u.id === user);
    const userName =
      userRecs.length > 0 ? userRecs[0]?.attributes?.name : 'user';
    const personalOrg = `>${userName} Personal<`;
    const orgs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organization')
    ) as Organization[];
    const orgRecs = orgs.filter(
      (o) => related(o, 'owner') === user && o.attributes?.name === personalOrg
    );
    if (orgRecs.length > 0) {
      teamRef.current = orgRecs[0].id;
    } else
      orbitTeamCreate(
        {
          attributes: { name: personalOrg },
        } as Organization,
        (org: string) => {
          teamRef.current = org;
        }
      );
  };

  const getPersonalId = () => {
    const memberIds = (
      memory.cache.query((q: QueryBuilder) =>
        q.findRecords('organizationmembership')
      ) as OrganizationMembership[]
    )
      .filter((m) => related(m, 'user') === user)
      .map((m) => related(m, 'organization'));
    const teamRecs = (
      memory.cache.query((q: QueryBuilder) =>
        q.findRecords('organization')
      ) as Organization[]
    ).filter((o) => isPersonal(o.id) && memberIds.includes(o.id));
    return teamRecs.length > 0 ? teamRecs[0].id : null;
  };

  return async (teamIdType: string | undefined) => {
    let teamId: string;
    if (teamIdType && teamIdType) {
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
