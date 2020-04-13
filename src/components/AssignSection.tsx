import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Section,
  IAssignSectionStrings,
  User,
  Project,
  GroupMembership,
  Role,
  RoleNames,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
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
} from '@material-ui/core';
// import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import SnackBar from './SnackBar';
import UserAvatar from './UserAvatar';
import {
  sectionTranscriberName,
  sectionEditorName,
  sectionNumber,
} from '../utils/section';
import { related, getRoleId } from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    gridRoot: {
      margin: 'auto',
    },
    paper: {},
    grids: { minWidth: 650 },
    avatar: {
      margin: 10,
    },
  })
);

interface IStateProps {
  t: IAssignSectionStrings;
}

interface IRecordProps {
  users: Array<User>;
  projects: Array<Project>;
  groupMemberships: Array<GroupMembership>;
  roles: Array<Role>;
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
    roles,
    sections,
    t,
    visible,
    closeMethod,
  } = props;
  const classes = useStyles();
  const [project] = useGlobal('project');
  const [memory] = useGlobal('memory');
  const [open, setOpen] = useState(visible);
  const [selectedTranscriber, setSelectedTranscriber] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [message, setMessage] = useState(<></>);

  const handleClose = () => {
    if (closeMethod) {
      closeMethod();
    }
    setOpen(false);
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };

  const assign = async (section: Section, userId: string, role: RoleNames) => {
    await memory.update((t: TransformBuilder) =>
      t.replaceRelatedRecord(
        { type: 'section', id: section.id },
        role.toLowerCase(),
        {
          type: 'user',
          id: userId,
        }
      )
    );
  };

  const handleSelectTranscriber = (id: string) => () => {
    setSelectedTranscriber(id);
    sections.forEach(function(s) {
      assign(s, id, RoleNames.Transcriber);
    });
  };
  const handleSelectReviewer = (id: string) => () => {
    setSelectedReviewer(id);
    sections.forEach(function(s) {
      assign(s, id, RoleNames.Editor);
    });
  };

  useEffect(() => {
    setOpen(visible);
    setSelectedTranscriber('');
    setSelectedReviewer('');
  }, [visible]);

  const projectRec = projects.filter(p => p.id === project);
  const groupId = projectRec.length > 0 ? related(projectRec[0], 'group') : '';
  const transcriberRoleId = getRoleId(roles, RoleNames.Transcriber);

  const transcriberIds = groupMemberships
    .filter(gm => related(gm, 'group') === groupId)
    .map(gm => related(gm, 'user'));

  const transcriberUserList = users
    .filter(u => u.attributes && transcriberIds.indexOf(u.id) !== -1)
    .map((m, index) => {
      const labelId = 'user-' + m.attributes.name;
      return (
        <ListItem
          key={index}
          role="listitem"
          button
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
      gm =>
        related(gm, 'group') === groupId &&
        related(gm, 'role') !== transcriberRoleId
    )
    .map(gm => related(gm, 'user'));
  const editorUserList = users
    .filter(u => u.attributes && editorIds.indexOf(u.id) !== -1)
    .map((m, index) => {
      const labelId = 'user-' + m.attributes.name;
      return (
        <ListItem
          key={index}
          role="listitem"
          button
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
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{t.title}</DialogTitle>
        <DialogContent>
          <Grid
            container
            spacing={2}
            justify="center"
            alignItems="flex-start"
            className={classes.gridRoot}
          >
            <Paper className={classes.paper}>
              <Table className={classes.grids} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t.sections}</TableCell>
                    <TableCell align="right">{t.editor}</TableCell>
                    <TableCell align="right">{t.transcriber}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{sectionList}</TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid
            container
            spacing={2}
            justify="center"
            alignItems="flex-start"
            className={classes.gridRoot}
          >
            <Grid item>
              <Paper className={classes.paper}>
                <List dense component="div">
                  <ListItem key="head">{t.editor}</ListItem>
                  {editorUserList}
                </List>
              </Paper>
            </Grid>
            <Grid item>
              <Paper className={classes.paper}>
                <List dense component="div">
                  <ListItem key="head">{t.transcriber}</ListItem>
                  {transcriberUserList}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained" color="primary">
            {t.close}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'assignSection' }),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(AssignSection) as any
) as any;
