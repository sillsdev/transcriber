import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IPassageRecordStrings } from '../model';
import localStrings from '../selector/localize';
import Auth from '../auth/Auth';
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
interface IDispatchProps {}
interface IStateProps {
  t: IPassageRecordStrings;
}
interface IProps extends IStateProps {}
interface IProps extends IStateProps, IDispatchProps {
  visible: boolean;
  onVisible: (visible: boolean) => void;
  onCancel?: () => void;
  mediaId: string;
  auth: Auth;
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
    auth,
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
  const [doSave, setDoSave] = useGlobal('doSave');

  const [canSave, setCanSave] = useState(false);
  const [canCancel, setCanCancel] = useState(false);
  const classes = useStyles();

  const onReady = () => {
    setDoSave(false);
    close();
  };

  const close = () => {
    //reset();
    onVisible(false);
  };

  useEffect(() => {
    if (mediaId !== mediaState.urlMediaId) fetchMediaUrl({ id: mediaId, auth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  const handleSave = () => {
    setDoSave(true);
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
    >
      <DialogTitle id="recDlg">{t.title}</DialogTitle>
      <DialogContent>
        <MediaRecord
          mediaId={mediaId}
          auth={auth}
          uploadMethod={uploadMethod}
          onReady={onReady}
          defaultFilename={defaultFilename}
          allowWave={allowWave}
          showFilename={allowWave}
          setCanSave={setCanSave}
          setCanCancel={setCanCancel}
          setStatusText={setStatusText}
          startSave={doSave}
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
