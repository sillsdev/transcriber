import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, Section, IAssignSectionStrings, User } from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Radio,
  ListItemAvatar,
  Avatar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@material-ui/core';
// import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import SnackBar from './SnackBar';
import {
  sectionTranscriberName,
  sectionReviewerName,
  sectionNumber,
  updatableSection,
} from '../utils/section';
import { userAvatar, userInitials } from '../utils/user';
import { remoteId } from '../utils';
import { userInfo } from 'os';

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
}

interface IProps extends IStateProps, IRecordProps, WithDataProps {
  sections: Array<Section>;
  visible: boolean;
  closeMethod?: () => void;
}

function AssignSection(props: IProps) {
  const { users, sections, t, visible, closeMethod, updateStore } = props;
  const classes = useStyles();
  const [plan] = useGlobal('plan');
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

  const assign = async (section: Section, userId: string, role: string) => {
    /* OPTION 1 - WORKS but you can't tell in the patch what changed.  Is
         the extra code worth the debugging gain???
    role === 'transcriber'
      ? (section.attributes.transcriberId = remoteId('user', userId))
      : (section.attributes.reviewerId = remoteId('user', userId));

    await updateStore(t => t.replaceRecord(section));
    */
    /* OPTION 2 - create the changes in a new section */
    let changes =
      role === 'transcriber'
        ? { transcriberId: remoteId('user', userId) }
        : { reviewerId: remoteId('user', userId) };

    await updateStore(t => t.replaceRecord(updatableSection(section, changes)));

    await updateStore(t =>
      t.replaceRelatedRecord({ type: 'section', id: section.id }, role, {
        type: 'user',
        id: userId,
      })
    );
  };

  const handleSelectTranscriber = (id: string) => () => {
    setSelectedTranscriber(id);
    sections.forEach(function(s) {
      assign(s, id, 'transcriber');
    });
  };
  const handleSelectReviewer = (id: string) => () => {
    setSelectedReviewer(id);
    sections.forEach(function(s) {
      assign(s, id, 'reviewer');
    });
  };

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  const transcriberUserList = users
    .filter(u => u.attributes)
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
            <Avatar alt={userInitials(m)} src={userAvatar(m)} />
          </ListItemAvatar>
          <ListItemText id={labelId} primary={m.attributes.name} />
        </ListItem>
      );
    });
  const reviewerUserList = users
    .filter(u => u.attributes)
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
            <Avatar alt={userInitials(m)} src={userAvatar(m)} />
          </ListItemAvatar>
          <ListItemText id={labelId} primary={m.attributes.name} />
        </ListItem>
      );
    });
  const sectionList = sections.map((p, index) => {
    const labelId = 'section-' + p.attributes.name;
    return (
      <TableRow key={index}>
        <TableCell component="th" scope="row">
          {sectionNumber(p) + ' ' + p.attributes.name}
        </TableCell>
        <TableCell align="right">{sectionTranscriberName(p, users)}</TableCell>
        <TableCell align="right">{sectionReviewerName(p, users)} </TableCell>
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
            <Grid item>
              <Paper className={classes.paper}>
                <Table className={classes.grids} size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t.sections}</TableCell>
                      <TableCell align="right">{t.transcriber}</TableCell>
                      <TableCell align="right">{t.reviewer}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{sectionList}</TableBody>
                </Table>
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
            <Grid item>
              <Paper className={classes.paper}>
                <List dense component="div">
                  <ListItem key="head">{t.reviewer}</ListItem>
                  {reviewerUserList}
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
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  AssignSection
) as any) as any;
