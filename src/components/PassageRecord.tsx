import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, IMediaUploadStrings } from '../model';
import localStrings from '../selector/localize';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
  Theme,
} from '@material-ui/core';
import path from 'path';
import { useSnackBar } from '../hoc/SnackBar';
import WSAudioPlayer from './WSAudioPlayer';
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
    },
    description: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    progress: {
      flexGrow: 1,
      margin: theme.spacing(2),
      cursor: 'pointer',
    },
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    player: {
      display: 'none',
    },
  })
);
interface IStateProps {
  t: IMediaUploadStrings;
}

interface IProps extends IStateProps {
  visible: boolean;
  uploadMethod?: (files: File[]) => void;
  multiple?: boolean;
  cancelMethod?: () => void;
  metaData?: JSX.Element;
  ready?: () => boolean;
}

function PassageRecord(props: IProps) {
  const { t, visible, uploadMethod, cancelMethod, metaData, ready } = props;
  const [, setName] = useState('');
  const [audioBlob] = useState<Blob>();
  const [open, setOpen] = useState(visible);
  const [files, setFiles] = useState<File[]>([]);
  const { showMessage } = useSnackBar();
  const acceptextension = '.mp3, .m4a, .wav, .ogg';
  //const acceptmime = 'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg';
  const classes = useStyles();

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  const handleAddOrSave = () => {
    if (uploadMethod && files) {
      uploadMethod(files);
    }
    handleFiles(undefined);
    setOpen(false);
  };
  const handleCancel = () => {
    if (cancelMethod) {
      handleFiles(undefined);
      cancelMethod();
    }
    setOpen(false);
  };

  const fileName = (files: File[]) => {
    return files.length === 1
      ? files[0].name
      : files.length.toString() + ' files selected';
  };
  const handleFiles = (files: FileList | undefined) => {
    if (files) {
      var goodFiles = Array.from(files).filter((s) =>
        acceptextension.includes(
          (path.extname(s.name) || '.xxx').substring(1).toLowerCase()
        )
      );
      if (goodFiles.length < files.length) {
        var rejectedFiles = Array.from(files).filter(
          (s) =>
            !acceptextension.includes(
              (path.extname(s.name) || '.xxx').substring(1).toLowerCase()
            )
        );
        showMessage(
          t.invalidFile.replace(
            '{0}',
            rejectedFiles.map((f) => f.name).join(', ')
          )
        );
      }
      setName(fileName(goodFiles));
      setFiles(goodFiles);
    } else {
      setFiles([]);
      setName('');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">{'Record!'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{'Do things here!'}</DialogContentText>
        {metaData}
        <WSAudioPlayer allowRecord={true} blob={audioBlob} />
      </DialogContent>
      <DialogActions>
        <Button
          className={classes.button}
          onClick={handleCancel}
          variant="outlined"
          color="primary"
        >
          {t.cancel}
        </Button>
        <Button
          className={classes.button}
          onClick={handleAddOrSave}
          variant="contained"
          color="primary"
          disabled={(ready && !ready()) || !files || files.length === 0}
        >
          {'todo.save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaUpload' }),
});

export default connect(mapStateToProps)(PassageRecord) as any;
