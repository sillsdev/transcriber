import { useState, useEffect } from 'react';
import { useGlobal } from '../mods/reactn';
import { connect } from 'react-redux';
import {
  IState,
  Section,
  IAssignSectionStrings,
  User,
  ISharedStrings,
  OrganizationMembership,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
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

const headProps = { display: 'flex', alignItems: 'center' } as SxProps;
const gridProps = { m: 'auto', p: 1 } as SxProps;

interface IStateProps {
  t: IAssignSectionStrings;
  ts: ISharedStrings;
}

interface IRecordProps {
  users: Array<User>;
  orgMemberships: Array<OrganizationMembership>;
}

interface IProps extends IStateProps, IRecordProps {
  sections: Array<Section>;
  visible: boolean;
  closeMethod?: () => void;
}
export enum TranscriberActors {
  Transcriber = 'Transcriber',
  Editor = 'Editor',
}
function AssignSection(props: IProps) {
  const { users, orgMemberships, sections, t, ts, visible, closeMethod } =
    props;
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [open, setOpen] = useState(visible);
  const [selectedTranscriber, setSelectedTranscriber] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(false));

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
    await memory.update((t: TransformBuilder) => [
      ...UpdateRelatedRecord(
        t,
        section,
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

  const handleSelectTranscriber = (id: string) => () => {
    const newVal = id !== selectedTranscriber ? id : '';
    setSelectedTranscriber(newVal);
    sections.forEach(function (s) {
      assign(s, newVal, TranscriberActors.Transcriber);
    });
  };
  const handleSelectReviewer = (id: string) => () => {
    const newVal = id !== selectedReviewer ? id : '';
    setSelectedReviewer(newVal);
    sections.forEach(function (s) {
      assign(s, newVal, TranscriberActors.Editor);
    });
  };

  const doSetSelected = (section: Section) => {
    setSelectedTranscriber(related(section, 'transcriber'));
    setSelectedReviewer(related(section, 'editor'));
  };

  useEffect(() => {
    setOpen(visible);
    doSetSelected(sections[0]);
  }, [visible, sections]);

  const memberIds = orgMemberships
    .filter((gm) => related(gm, 'organization') === organization)
    .map((gm) => related(gm, 'user'));

  const transcriberUserList = users
    .filter((u) => u.attributes && memberIds.indexOf(u.id) !== -1)
    .map((m, index) => {
      const labelId = 'user-' + m.attributes.name;
      return (
        <ListItem
          id={`assignTranscriber-${index}`}
          key={index}
          role="listitem"
          onClick={handleSelectTranscriber(m.id)}
        >
          <ListItemIcon>
            <Radio
              checked={selectedTranscriber === m.id}
              tabIndex={-1}
              inputProps={{ 'aria-labelledby': labelId }}
            />
          </ListItemIcon>
          <ListItemAvatar>
            <UserAvatar {...props} userRec={m} />
          </ListItemAvatar>
          <ListItemText id={labelId} primary={m.attributes.name} />
        </ListItem>
      );
    });

  const editorUserList = users
    .filter((u) => u.attributes && memberIds.indexOf(u.id) !== -1)
    .map((m, index) => {
      const labelId = 'user-' + m.attributes.name;
      return (
        <ListItem
          id={`assignReview-${index}`}
          key={index}
          role="listitem"
          onClick={handleSelectReviewer(m.id)}
        >
          <ListItemIcon>
            <Radio
              checked={selectedReviewer === m.id}
              tabIndex={-1}
              inputProps={{ 'aria-labelledby': labelId }}
            />
          </ListItemIcon>
          <ListItemAvatar>
            <UserAvatar {...props} userRec={m} />
          </ListItemAvatar>
          <ListItemText id={labelId} primary={m.attributes.name} />
        </ListItem>
      );
    });
  const sectionList = sections.map((p, index) => {
    return (
      <TableRow key={index}>
        <TableCell component="th" scope="row">
          {sectionNumber(p) + ' ' + p.attributes.name}
        </TableCell>
        <TableCell align="right">{sectionEditorName(p, users)} </TableCell>
        <TableCell align="right">{sectionTranscriberName(p, users)}</TableCell>
      </TableRow>
    );
  });
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
                        <EditorIcon />
                        {ts.editor}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={headProps}>
                        <TranscriberIcon />
                        {ts.transcriber}
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{sectionList}</TableBody>
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
                    <IconButton>
                      <EditorIcon />
                    </IconButton>
                    {ts.editor}
                  </ListItem>
                  {editorUserList}
                </List>
              </Paper>
            </Grid>
            <Grid item>
              <Paper>
                <List dense component="div">
                  <ListItem key="head">
                    <TranscriberIcon />
                    {ts.transcriber}
                  </ListItem>
                  {transcriberUserList}
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'assignSection' }),
  ts: localStrings(state, { layout: 'shared' }),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  orgMemberships: (q: QueryBuilder) => q.findRecords('organizationmembership'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(AssignSection) as any
) as any;
