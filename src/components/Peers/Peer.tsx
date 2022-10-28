import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import UncheckedIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckedIcon from '@mui/icons-material/CheckBoxOutlined';
import GroupDialog from './GroupDialog';
import {
  User,
  GroupMembership,
  Group,
  RoleNames,
  IPeerStrings,
} from '../../model';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { related, usePermissions, useRole } from '../../crud';
import { AddRecord, ReplaceRelatedRecord } from '../../model/baseModel';
import { toCamel } from '../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { peerSelector } from '../../selector';
import { usePeerGroups, IUserName } from './usePeerGroups';

interface IRecordProps {
  users: User[];
  memberships: GroupMembership[];
  groups: Group[];
}

interface IProps extends IRecordProps {}

export function Peer(props: IProps) {
  const { memberships } = props;
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const { userNames, peerGroups, check, setCheck, cKey } = usePeerGroups(props);
  const { getRoleId, getMyOrgRole } = useRole();
  const t = useSelector(peerSelector, shallowEqual) as IPeerStrings;
  const { localizePermission } = usePermissions(props);

  const handleSave = async (name: string, permissions: string, id?: string) => {
    if (id) {
      // update peer group
      for (let g of peerGroups) {
        if (g.id === id) {
          await memory.update((t) => t.replaceAttribute(g, 'name', name));
          await memory.update((t) =>
            t.replaceAttribute(
              g,
              'permissions',
              JSON.stringify({ permissions: permissions })
            )
          );
          return;
        }
      }
      return;
    }
    // create peer group
    const groupRec: Group = {
      type: 'group',
      attributes: {
        name,
        abbreviation: toCamel(name),
        allUsers: false,
        permissions: JSON.stringify({ permissions: permissions }),
      },
    } as Group;
    await memory.update((t) => [
      ...AddRecord(t, groupRec, user, memory),
      ...ReplaceRelatedRecord(
        t,
        groupRec,
        'owner',
        'organization',
        organization
      ),
    ]);
  };

  const handleRemove = async (id: string) => {
    await memory.update((t) => t.removeRecord({ type: 'group', id }));
  };

  const handleCheck = (row: IUserName, col: Group) => async () => {
    check?.add(cKey(row.userId, col.id));
    const membership: GroupMembership = {
      type: 'groupmembership',
    } as GroupMembership;
    await memory.update((t) => [
      ...AddRecord(t, membership, user, memory),
      ...ReplaceRelatedRecord(t, membership, 'user', 'user', row.userId),
      ...ReplaceRelatedRecord(t, membership, 'group', 'group', col.id),
      ...ReplaceRelatedRecord(
        t,
        membership,
        'role',
        'role',
        getRoleId(RoleNames.Member)
      ),
    ]);
    setCheck(new Set(check));
  };

  const handleUncheck = (row: IUserName, col: Group) => async () => {
    check?.delete(cKey(row.userId, col.id));
    const recs = memberships.filter(
      (m) => related(m, 'user') === row.userId && related(m, 'group') === col.id
    );
    if (recs.length > 0)
      await memory.update((t) =>
        t.removeRecord({ type: 'groupmembership', id: recs[0].id })
      );
    setCheck(new Set(check));
  };

  const canEditPeer = useMemo(
    () => getMyOrgRole(organization) === RoleNames.Admin && !offline,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organization, offline]
  );

  const inUse = useMemo(
    () => peerGroups.map((c) => c.attributes.name.toLocaleLowerCase()),
    [peerGroups]
  );

  return (
    <TableContainer component={Paper}>
      <Table aria-label="peer table">
        <TableHead>
          <TableRow>
            <TableCell>{t.member}</TableCell>
            {peerGroups
              .sort((i, j) => (i.attributes.name <= j.attributes.name ? -1 : 1))
              .map((col) => (
                <TableCell align="center" key={col.id}>
                  <div>
                    <span
                      title={localizePermission(col.attributes?.permissions)}
                    >
                      <GroupDialog
                        key={col.id}
                        cur={col}
                        save={handleSave}
                        remove={handleRemove}
                        isAdmin={canEditPeer}
                        inUse={inUse}
                      />
                    </span>
                  </div>
                </TableCell>
              ))}
            <TableCell align="center">
              <GroupDialog
                key={'new'}
                save={handleSave}
                isAdmin={canEditPeer}
                inUse={inUse}
              />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {userNames
            .sort((i, j) => (i.name <= j.name ? -1 : 1))
            .map((row) => (
              <TableRow key={row.userId}>
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                {peerGroups
                  .sort((i, j) =>
                    i.attributes.name <= j.attributes.name ? -1 : 1
                  )
                  .map((col) => (
                    <TableCell align="center" key={col.id}>
                      {check?.has(cKey(row.userId, col.id)) ? (
                        <IconButton
                          id={`${col.attributes.abbreviation}Check`}
                          onClick={handleUncheck(row, col)}
                          disabled={!canEditPeer}
                        >
                          <CheckedIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          id={`${col.attributes.abbreviation}Uncheck`}
                          onClick={handleCheck(row, col)}
                          disabled={!canEditPeer}
                        >
                          <UncheckedIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  memberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(Peer) as any;
