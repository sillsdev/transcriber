import React, { useState, useEffect, useContext } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IPassageRecordStrings } from '../model';
import localStrings from '../selector/localize';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';
import { useFetchMediaUrl } from '../crud';
import MediaRecord from './MediaRecord';
import { UnsavedContext } from '../context/UnsavedContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      '& .MuiDialog-paper': {
        maxWidth: '90%',
        minWidth: '90%',
      },
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
    },
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    formControl: {
      margin: theme.spacing(1),
    },
    row: {
      display: 'flex',
    },
    status: {
      marginRight: theme.spacing(2),
      alignSelf: 'center',
      display: 'block',
      gutterBottom: 'true',
    },
  })
);
interface IStateProps {
  t: IPassageRecordStrings;
}
interface IProps extends IStateProps {
  visible: boolean;
  onVisible: (visible: boolean) => void;
  onCancel?: () => void;
  mediaId: string;
  metaData?: JSX.Element;
  defaultFilename?: string;
  ready: () => boolean;
  uploadMethod?: (files: File[]) => Promise<void>;
  allowWave?: boolean;
}

function PassageRecordDlg(props: IProps) {
  const {
    t,
    visible,
    onVisible,
    mediaId,
    defaultFilename,
    uploadMethod,
    onCancel,
    ready,
    metaData,
    allowWave,
  } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [statusText, setStatusText] = useState('');
  const [canSave, setCanSave] = useState(false);
  const [canCancel, setCanCancel] = useState(false);
  const classes = useStyles();
  const { startSave, saveCompleted } = useContext(UnsavedContext).state;

  const myToolId = 'PassageRecordDlg';

  const onReady = () => {
    saveCompleted(myToolId, '');
    close();
  };

  const close = () => {
    //reset();
    onVisible(false);
  };

  useEffect(() => {
    if (mediaId !== mediaState.id) fetchMediaUrl({ id: mediaId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  const handleSave = () => {
    startSave(myToolId);
  };
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    close();
  };

  return (
    <Dialog
      className={classes.root}
      open={visible}
      onClose={handleCancel}
      aria-labelledby="recDlg"
      disableEnforceFocus
    >
      <DialogTitle id="recDlg">{t.title}</DialogTitle>
      <DialogContent>
        <MediaRecord
          toolId={myToolId}
          mediaId={mediaId}
          uploadMethod={uploadMethod}
          onReady={onReady}
          defaultFilename={defaultFilename}
          allowWave={allowWave}
          showFilename={allowWave}
          setCanSave={setCanSave}
          setCanCancel={setCanCancel}
          setStatusText={setStatusText}
        />
        {metaData}
      </DialogContent>
      <DialogActions>
        <Typography variant="caption" className={classes.status}>
          {statusText}
        </Typography>
        <Button
          id="rec-cancel"
          className={classes.button}
          onClick={handleCancel}
          variant="outlined"
          color="primary"
          disabled={!canCancel}
        >
          {t.cancel}
        </Button>
        <Button
          id="rec-save"
          className={classes.button}
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={(ready && !ready()) || !canSave}
        >
          {t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageRecord' }),
});
export default connect(mapStateToProps)(PassageRecordDlg) as any;
