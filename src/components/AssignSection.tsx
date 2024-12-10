import { useState, useEffect, useContext } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { shallowEqual } from 'react-redux';
import {
  Section,
  SectionD,
  IAssignSectionStrings,
  ISharedStrings,
  OrganizationMembership,
  UserD,
} from '../model';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Radio,
  ListItemAvatar,
  IconButton,
} from '@mui/material';
import {
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  SxProps,
} from '@mui/material';
import UserAvatar from './UserAvatar';
import {
  related,
  sectionTranscriberName,
  sectionEditorName,
  sectionNumber,
  useOrganizedBy,
} from '../crud';
import { TranscriberIcon, EditorIcon } from './RoleIcons';
import { UpdateLastModifiedBy, UpdateRelatedRecord } from '../model/baseModel';
import { PriButton } from '../control';
import { useOrbitData } from '../hoc/useOrbitData';
import { useSelector } from 'react-redux';
import { assignSectionSelector, sharedSelector } from '../selector';
import { PlanContext } from '../context/PlanContext';

const headProps = { display: 'flex', alignItems: 'center' } as SxProps;
const gridProps = { m: 'auto', p: 1 } as SxProps;

interface SectionListProps {
  sections: Array<Section>;
  users: UserD[];
}

function SectionList({ sections, users }: SectionListProps) {
  const { sectionArr } = useContext(PlanContext).state;
  const sectionMap = new Map<number, string>(sectionArr);
  return (
    <>
      {sections.map((p) => {
        return (
          <TableRow key={p.id}>
            <TableCell component="th" scope="row">
              {sectionNumber(p, sectionMap) + ' ' + p.attributes.name}
            </TableCell>
            <TableCell align="right">
              {sectionTranscriberName(p, users)}
            </TableCell>
            <TableCell align="right">{sectionEditorName(p, users)} </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

interface UserListProps {
  id?: string;
  users: UserD[];
  memberIds: string[];
  selected: string;
  select: (id: string) => () => void;
}

function UserList({ id, users, memberIds, selected, select }: UserListProps) {
  return (
    <>
      {users
        .filter((u) => u.attributes && memberIds.indexOf(u.id) !== -1)
        .map((m) => {
          const labelId = 'user-' + m.attributes.name;
          return (
            <ListItem
              id={`${id}-${m.id}`}
              key={`${id}-${m.id}`}
              role="listitem"
              onClick={select(m.id as string)}
            >
              <ListItemIcon>
                <Radio
                  checked={selected === m.id}
                  tabIndex={-1}
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon>
              <ListItemAvatar>
                <UserAvatar userRec={m} />
              </ListItemAvatar>
              <ListItemText id={labelId} primary={m.attributes.name} />
            </ListItem>
          );
        })}
    </>
  );
}

interface IProps {
  sections: Array<Section>;
  visible: boolean;
  closeMethod?: () => void;
  refresh?: () => void;
}
export enum TranscriberActors {
  Transcriber = 'Transcriber',
  Editor = 'Editor',
}
function AssignSection(props: IProps) {
  const { sections, visible, closeMethod, refresh } = props;
  const t: IAssignSectionStrings = useSelector(
    assignSectionSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const users = useOrbitData<UserD[]>('user');
  const orgMemberships = useOrbitData<OrganizationMembership[]>(
    'organizationmembership'
  );
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [open, setOpen] = useState(visible);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [selectedTranscriber, setSelectedTranscriber] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy, setOrganizedBy] = useState('');

  const handleClose = () => {
    if (closeMethod) {
      closeMethod();
    }
    setOpen(false);
  };

  const assign = async (
    section: Section,
    userId: string,
    role: TranscriberActors
  ) => {
    await memory.update((t) => [
      ...UpdateRelatedRecord(
        t,
        section as SectionD,
        role.toLowerCase(),
        'user',
        userId,
        user
      ),
      ...UpdateLastModifiedBy(
        t,
        { type: 'plan', id: related(section, 'plan') },
        user
      ),
    ]);
  };

  const handleSelectTranscriber = (id: string) => async () => {
    const newVal = id !== selectedTranscriber ? id : '';
    setSelectedTranscriber(newVal);
    for (let s of sections) {
      await assign(s, newVal, TranscriberActors.Transcriber);
    }
    refresh && refresh();
  };
  const handleSelectReviewer = (id: string) => async () => {
    const newVal = id !== selectedReviewer ? id : '';
    setSelectedReviewer(newVal);
    for (let s of sections) {
      await assign(s, newVal, TranscriberActors.Editor);
    }
    refresh && refresh();
  };

  const doSetSelected = (section: Section) => {
    const newTranscriber = related(section, 'transcriber');
    if (selectedTranscriber !== newTranscriber) {
      setSelectedTranscriber(related(section, 'transcriber'));
    }
    const newReviewer = related(section, 'editor');
    if (selectedReviewer !== newReviewer) {
      setSelectedReviewer(related(section, 'editor'));
    }
  };

  useEffect(() => {
    const newIds: string[] = orgMemberships
      .filter((gm) => related(gm, 'organization') === organization)
      .map((gm) => related(gm, 'user'))
      .sort();
    setMemberIds(newIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgMemberships, organization]);

  useEffect(() => {
    const newOrganizedBy = getOrganizedBy(false);
    if (organizedBy !== newOrganizedBy) {
      setOrganizedBy(newOrganizedBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open !== visible) {
      setOpen(visible);
    }
    doSetSelected(sections[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sections]);

  return (
    <div>
      <Dialog
        open={open}
        fullWidth={true}
        maxWidth="md"
        onClose={handleClose}
        aria-labelledby="assignDlg"
        disableEnforceFocus
      >
        <DialogTitle id="assignDlg">
          {t.title.replace('{0}', organizedBy)}
        </DialogTitle>
        <DialogContent>
          <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="flex-start"
            sx={gridProps}
          >
            <Paper>
              <Table sx={{ minWidth: 650 }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{organizedBy}</TableCell>
                    <TableCell align="right">
                      <Box sx={headProps}>
                        <TranscriberIcon />
                        {ts.transcriber}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={headProps}>
                        <EditorIcon />
                        {ts.editor}
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <SectionList sections={sections} users={users} />
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="flex-start"
            sx={gridProps}
          >
            <Grid item>
              <Paper>
                <List dense component="div">
                  <ListItem key="head">
                    <TranscriberIcon />
                    {ts.transcriber}
                  </ListItem>
                  <UserList
                    id={'assignTranscriber'}
                    users={users}
                    memberIds={memberIds}
                    selected={selectedTranscriber}
                    select={handleSelectTranscriber}
                  />
                </List>
              </Paper>
            </Grid>
            <Grid item>
              <Paper>
                <List dense component="div">
                  <ListItem key="head">
                    <IconButton>
                      <EditorIcon />
                    </IconButton>
                    {ts.editor}
                  </ListItem>
                  <UserList
                    id={'assignEditor'}
                    users={users}
                    memberIds={memberIds}
                    selected={selectedReviewer}
                    select={handleSelectReviewer}
                  />
                </List>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <PriButton id="assignClose" onClick={handleClose}>
            {t.close}
          </PriButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AssignSection;
