import { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Section,
  IAssignSectionStrings,
  User,
  Project,
  GroupMembership,
  RoleNames,
  ISharedStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Radio,
  ListItemAvatar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from '@material-ui/core';
import UserAvatar from './UserAvatar';
import {
  related,
  useRole,
  sectionTranscriberName,
  sectionEditorName,
  sectionNumber,
  useOrganizedBy,
} from '../crud';
import { TranscriberIcon, EditorIcon } from './RoleIcons';
import { UpdateLastModifedBy, UpdateRelatedRecord } from '../model/baseModel';

const useStyles = makeStyles({
  gridRoot: {
    margin: 'auto',
  },
  paper: {},
  headerCell: {
    display: 'flex',
    alignItems: 'center',
  },
  grids: { minWidth: 650 },
  avatar: {
    margin: 10,
  },
});

interface IStateProps {
  t: IAssignSectionStrings;
  ts: ISharedStrings;
}

interface IRecordProps {
  users: Array<User>;
  projects: Array<Project>;
  groupMemberships: Array<GroupMembership>;
}

interface IProps extends IStateProps, IRecordProps {
  sections: Array<Section>;
  visible: boolean;
  closeMethod?: () => void;
}

function AssignSection(props: IProps) {
  const {
    users,
    projects,
    groupMemberships,
    sections,
    t,
    ts,
    visible,
    closeMethod,
  } = props;
  const classes = useStyles();
  const [project] = useGlobal('project');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { getTranscriberRoleIds, getEditorRoleIds } = useRole();
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

  const assign = async (section: Section, userId: string, role: RoleNames) => {
    await memory.update((t: TransformBuilder) => [
      ...UpdateRelatedRecord(
        t,
        section,
        role.toLowerCase(),
        'user',
        userId,
        user
      ),
      ...UpdateLastModifedBy(
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
      assign(s, newVal, RoleNames.Transcriber);
    });
  };
  const handleSelectReviewer = (id: string) => () => {
    const newVal = id !== selectedReviewer ? id : '';
    setSelectedReviewer(newVal);
    sections.forEach(function (s) {
      assign(s, newVal, RoleNames.Editor);
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

  const projectRec = projects.filter((p) => p.id === project);
  const groupId = projectRec.length > 0 ? related(projectRec[0], 'group') : '';
  const transcriberRoleIds = getTranscriberRoleIds();
  const editorRoleIds = getEditorRoleIds();

  const transcriberIds = groupMemberships
    .filter(
      (gm) =>
        related(gm, 'group') === groupId &&
        transcriberRoleIds.includes(related(gm, 'role'))
    )
    .map((gm) => related(gm, 'user'));

  const transcriberUserList = users
    .filter((u) => u.attributes && transcriberIds.indexOf(u.id) !== -1)
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

  const editorIds = groupMemberships
    .filter(
      (gm) =>
        related(gm, 'group') === groupId &&
        editorRoleIds.includes(related(gm, 'role'))
    )
    .map((gm) => related(gm, 'user'));
  const editorUserList = users
    .filter((u) => u.attributes && editorIds.indexOf(u.id) !== -1)
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
            className={classes.gridRoot}
          >
            <Paper className={classes.paper}>
              <Table className={classes.grids} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{organizedBy}</TableCell>
                    <TableCell align="right">
                      <div className={classes.headerCell}>
                        <EditorIcon />
                        {ts.editor}
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <div className={classes.headerCell}>
                        <TranscriberIcon />
                        {ts.transcriber}
                      </div>
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
            className={classes.gridRoot}
          >
            <Grid item>
              <Paper className={classes.paper}>
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
              <Paper className={classes.paper}>
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
          <Button
            id="assignClose"
            onClick={handleClose}
            variant="contained"
            color="primary"
          >
            {t.close}
          </Button>
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
  projects: (q: QueryBuilder) => q.findRecords('project'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(AssignSection) as any
) as any;
