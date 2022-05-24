import React, { useState, useEffect, useMemo } from 'react';
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
} from '@material-ui/core';
import UncheckedIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckedIcon from '@material-ui/icons/CheckBoxOutlined';
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
import { related, useAllUserGroup, useUser, useRole } from '../../crud';
import { AddRecord } from '../../model/baseModel';
import { toCamel } from '../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { peerSelector } from '../../selector';

interface IRow {
  userId: string;
  name: string;
}

interface IRecordProps {
  users: User[];
  memberships: GroupMembership[];
  groups: Group[];
}

interface IProps extends IRecordProps {}

export function Peer({ users, memberships, groups }: IProps) {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const allUsersGroup = useAllUserGroup();
  const { getUserRec } = useUser();
  const { getRoleId, getMyOrgRole } = useRole();
  const [rows, setRows] = useState<IRow[]>([]);
  const [cols, setCols] = useState<Group[]>([]);
  const [check, setCheck] = useState<Set<string>>();
  const t = useSelector(peerSelector, shallowEqual) as IPeerStrings;

  const handleSave = async (name: string, id?: string) => {
    if (id) {
      // update peer group
      for (let c of cols) {
        if (c.id === id) {
          await memory.update((t) => t.replaceAttribute(c, 'name', name));
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
      },
    } as Group;
    const orgRecId = { type: 'organization', id: organization };
    await memory.update((t) => [
      ...AddRecord(t, groupRec, user, memory),
      t.replaceRelatedRecord(groupRec, 'owner', orgRecId),
    ]);
  };

  const handleRemove = async (id: string) => {
    await memory.update((t) => t.removeRecord({ type: 'group', id }));
  };

  const handleCheck = (row: IRow, col: Group) => async () => {
    check?.add(`${row.userId}_${col.id}`);
    const membership: GroupMembership = {
      type: 'groupmembership',
    } as GroupMembership;
    const userRecId = { type: 'user', id: row.userId };
    const groupRecId = { type: 'group', id: col.id };
    const memberRecId = { type: 'role', id: getRoleId(RoleNames.Member) };
    await memory.update((t) => [
      ...AddRecord(t, membership, user, memory),
      t.replaceRelatedRecord(membership, 'user', userRecId),
      t.replaceRelatedRecord(membership, 'group', groupRecId),
      t.replaceRelatedRecord(membership, 'role', memberRecId),
    ]);
    setCheck(new Set(check));
  };

  const handleUncheck = (row: IRow, col: Group) => async () => {
    check?.delete(`${row.userId}_${col.id}`);
    const recs = memberships.filter(
      (m) => related(m, 'user') === row.userId && related(m, 'group') === col.id
    );
    if (recs.length > 0)
      await memory.update((t) =>
        t.removeRecord({ type: 'groupmembership', id: recs[0].id })
      );
    setCheck(new Set(check));
  };

  const isAdmin = useMemo(
    () => getMyOrgRole(organization) === RoleNames.Admin,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organization]
  );

  const allUserId = useMemo(
    () => allUsersGroup(organization)?.id,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organization]
  );

  useEffect(() => {
    const memberIds = memberships
      .filter((m) => related(m, 'group') === allUserId)
      .map((m) => related(m, 'user'));
    setRows(
      memberIds.map((id) => {
        const userRec = getUserRec(id) as User;
        return { userId: id, name: userRec?.attributes?.name };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberships, organization, users, allUserId]);

  useEffect(() => {
    const newCols = groups.filter(
      (g) => g?.id !== allUserId && related(g, 'owner') === organization
    );
    setCols(newCols);
  }, [groups, organization, allUserId]);

  useEffect(() => {
    const users = rows.map((r) => r.userId);
    const grps = cols.map((c) => c.id);
    const checks = new Set<string>();
    memberships.forEach((m) => {
      const u = related(m, 'user');
      const g = related(m, 'group');
      if (users.includes(u) && grps.includes(g)) checks.add(`${u}_${g}`);
    });
    setCheck(checks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols]);

  return (
    <TableContainer component={Paper}>
      <Table aria-label="peer table">
        <TableHead>
          <TableRow>
            <TableCell>{t.member}</TableCell>
            {cols
              .sort((i, j) => (i.attributes.name <= j.attributes.name ? -1 : 1))
              .map((col) => (
                <TableCell align="center" key={col.id}>
                  <GroupDialog
                    cur={col}
                    save={handleSave}
                    remove={handleRemove}
                    isAdmin={isAdmin}
                  />
                </TableCell>
              ))}
            <TableCell align="center">
              <GroupDialog save={handleSave} isAdmin={isAdmin} />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              {cols
                .sort((i, j) =>
                  i.attributes.name <= j.attributes.name ? -1 : 1
                )
                .map((col) => (
                  <TableCell align="center" key={col.id}>
                    {check?.has(`${row.userId}_${col.id}`) ? (
                      <IconButton
                        id={`${col.attributes.abbreviation}Check`}
                        onClick={handleUncheck(row, col)}
                        disabled={!isAdmin}
                      >
                        <CheckedIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        id={`${col.attributes.abbreviation}Uncheck`}
                        onClick={handleCheck(row, col)}
                        disabled={!isAdmin}
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
