import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Section,
  MediaFile,
  Passage,
  IPassageMediaStrings,
  ActivityStates,
  BookName,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder, Operation } from '@orbit/data';
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
} from '@material-ui/core';
// import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import SnackBar from './SnackBar';
import related from '../utils/related';
import { passageRefCompare, passageReference } from '../utils/passage';
import { remoteIdNum } from '../utils';
import { UpdatePassageStateOps } from '../utils/UpdatePassageState';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    gridRoot: {
      margin: 'auto',
    },
    paper: {},
    grids: {},
  })
);

interface ILatest {
  [planName: string]: number;
}

interface IStateProps {
  t: IPassageMediaStrings;
  allBookData: BookName[];
}

interface IRecordProps {
  mediaFiles: Array<MediaFile>;
  passages: Array<Passage>;
  sections: Array<Section>;
}

interface IProps extends IStateProps, IRecordProps {
  visible: boolean;
  closeMethod?: () => void;
}

function PassageMedia(props: IProps) {
  const {
    passages,
    mediaFiles,
    sections,
    t,
    visible,
    closeMethod,
    allBookData,
  } = props;
  const classes = useStyles();
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [open, setOpen] = useState(visible);
  const [selectedPassage, setSelectedPassage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState('');
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
  const attach = async (passage: string, mediaFile: string) => {
    var tb = new TransformBuilder();
    var ops: Operation[] = [];
    ops.push(
      tb.replaceRelatedRecord({ type: 'mediafile', id: mediaFile }, 'passage', {
        type: 'passage',
        id: passage,
      })
    );
    ops = UpdatePassageStateOps(
      passage,
      ActivityStates.TranscribeReady,
      t.mediaAttached,
      remoteIdNum('user', user, memory.keyMap),
      tb,
      ops
    );
    await memory.update(ops);
  };

  const detach = async (passage: string, mediaFile: string) => {
    var tb = new TransformBuilder();
    var ops: Operation[] = [];
    ops.push(
      tb.replaceRelatedRecord(
        { type: 'mediafile', id: mediaFile },
        'passage',
        null
      )
    );
    ops = UpdatePassageStateOps(
      passage,
      ActivityStates.NoMedia,
      t.mediaDetached,
      remoteIdNum('user', user, memory.keyMap),
      tb,
      ops
    );
    await memory.update(ops);
  };

  const handleSelectPassage = (id: string) => () => {
    if (selectedMedia !== '') {
      setSelectedPassage('');
      setSelectedMedia('');
      attach(id, selectedMedia);
    } else {
      setSelectedPassage(id);
    }
  };
  const handleSelectMedia = (id: string) => () => {
    if (selectedPassage !== '') {
      setSelectedPassage('');
      setSelectedMedia('');
      attach(selectedPassage, id);
    } else {
      setSelectedMedia(id);
    }
  };
  const handleDeselectMedia = (passage: string, mediaFile: string) => () => {
    detach(passage, mediaFile);
  };

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  const planMediaFiles = mediaFiles.filter(f => related(f, 'plan') === plan);

  const latest: ILatest = {};
  planMediaFiles.forEach(f => {
    const name = f.attributes.originalFile;
    const ver = f.attributes.versionNumber;
    if (!latest[name] || ver > latest[name]) {
      latest[name] = ver;
    }
  });

  const selectedMediaFiles = planMediaFiles
    .filter(
      f =>
        f.attributes.versionNumber === latest[f.attributes.originalFile] &&
        related(f, 'passage') === null
    )
    .sort((i, j) =>
      i.attributes.originalFile < j.attributes.originalFile ? -1 : 1
    );

  const mediaList = selectedMediaFiles.map((m, index) => {
    const labelId = 'media-' + m.attributes.originalFile;
    return (
      <ListItem
        key={index}
        role="listitem"
        button
        onClick={handleSelectMedia(m.id)}
      >
        <ListItemIcon>
          <Radio
            checked={selectedMedia === m.id}
            tabIndex={-1}
            disableRipple
            inputProps={{ 'aria-labelledby': labelId }}
          />
        </ListItemIcon>
        <ListItemText id={labelId} primary={m.attributes.originalFile} />
      </ListItem>
    );
  });

  const attachedPassageIds = planMediaFiles
    .filter(
      f =>
        f.attributes.versionNumber === latest[f.attributes.originalFile] &&
        related(f, 'passage') !== null
    )
    .map(f => related(f, 'passage'));

  const selectedSections = sections
    .filter(s => related(s, 'plan') === plan)
    .map(s => s.id);

  const selectedPassages = passages
    .filter(p => selectedSections.indexOf(related(p, 'section')) !== -1)
    .sort(passageRefCompare);

  const passageList = selectedPassages
    .filter(p => attachedPassageIds.indexOf(p.id) === -1)
    .map((p, index) => {
      const labelId =
        'passage-' +
        (p.attributes ? p.attributes.reference.replace(':', '-') : '');
      return (
        <ListItem
          key={index}
          role="listitem"
          button
          onClick={handleSelectPassage(p.id)}
        >
          <ListItemIcon>
            <Radio
              checked={selectedPassage === p.id}
              tabIndex={-1}
              disableRipple
              inputProps={{ 'aria-labelledby': labelId }}
            />
          </ListItemIcon>
          <ListItemText
            id={labelId}
            primary={passageReference(p, allBookData)}
          />
        </ListItem>
      );
    });

  const attachedMediaFiles = planMediaFiles
    .filter(
      f =>
        f.attributes.versionNumber === latest[f.attributes.originalFile] &&
        related(f, 'passage') !== null
    )
    .sort((i, j) =>
      i.attributes.originalFile < j.attributes.originalFile ? -1 : 1
    );

  const attachedList = attachedMediaFiles.map((m, index) => {
    const labelId = 'media-' + m.attributes.originalFile;
    const passageList = selectedPassages.filter(
      p => p.id === related(m, 'passage')
    );
    const passage =
      passageList.length >= 1
        ? passageList[0]
        : { id: '', attributes: { book: '', reference: '' } };
    return (
      <ListItem
        key={index}
        role="listitem"
        button
        onClick={handleDeselectMedia(passage.id, m.id)}
      >
        <ListItemIcon>
          <Radio
            checked={selectedMedia === m.id}
            tabIndex={-1}
            disableRipple
            inputProps={{ 'aria-labelledby': labelId }}
          />
        </ListItemIcon>
        <ListItemText
          id={labelId}
          primary={
            <span>
              {passageReference(passage as Passage, allBookData)}
              {/* <ArrowForwardIcon fontSize="small" /> */}
              {'\u00A0\u2192\u00A0' /* Foward arrow */}
              {m.attributes.originalFile}
            </span>
          }
        />
      </ListItem>
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
        <DialogTitle id="form-dialog-title">
          {t.attachMediaToPassages}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t.attachAvailableMedia}</DialogContentText>
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
                  <ListItem key="head">
                    {t.choosePassage.replace(
                      '{0}',
                      selectedPassages.length.toString()
                    )}
                  </ListItem>
                  {passageList}
                </List>
              </Paper>
            </Grid>
            <Grid item>
              <Paper className={classes.paper}>
                <List dense component="div">
                  <ListItem key="head">
                    {t.availableMedia.replace(
                      '{0}',
                      selectedMediaFiles.length.toString()
                    )}
                  </ListItem>
                  {mediaList}
                </List>
              </Paper>
            </Grid>
          </Grid>
          <Grid container justify="flex-start" className={classes.gridRoot}>
            <Grid item>
              <Paper className={classes.paper}>
                <List dense component="div">
                  <ListItem key="head">
                    {t.attachments.replace(
                      '{0}',
                      attachedMediaFiles.length.toString()
                    )}
                  </ListItem>
                  {attachedList}
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
  t: localStrings(state, { layout: 'passageMedia' }),
  allBookData: state.books.bookData,
});

const mapRecordsToProps = {
  mediaFiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(PassageMedia) as any
) as any;
