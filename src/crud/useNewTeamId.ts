import React from 'react';
import { useGlobal } from 'reactn';
import * as actions from '../store';
import { Organization, User, ISharedStrings } from '../model';
import { QueryBuilder } from '@orbit/data';
import { waitForIt } from '../utils';
import { useTeamCreate, useIsPersonalTeam } from '.';

interface IStateProps {
  ts: ISharedStrings;
}
interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}
interface IProps extends IStateProps, IDispatchProps {}

export const useNewTeamId = (props: IProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const orgRef = React.useRef<string>();
  const orbitTeamCreate = useTeamCreate(props);
  const isPersonal = useIsPersonalTeam();

  const newPersonal = async () => {
    orgRef.current = undefined;
    const users = (await memory.query((q: QueryBuilder) =>
      q.findRecords('user')
    )) as User[];
    const userRecs = users.filter((u) => u.id === user);
    const userName =
      userRecs.length > 0 ? userRecs[0]?.attributes?.name : 'user';
    orbitTeamCreate({
      attributes: { name: `>${userName} Personal<` },
    } as Organization);
  };

  const getPersonalId = () => {
    const teamRecs = (memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organization')
    ) as Organization[]).filter((o) => isPersonal(o.id));
    return teamRecs.length > 0 ? teamRecs[0].id : null;
  };

  React.useEffect(() => {
    orgRef.current = organization;
  }, [organization]);

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
          () => orgRef.current !== undefined,
          () => false,
          10
        );
        teamId = orgRef.current as string;
      }
    }
    return teamId;
  };
};
