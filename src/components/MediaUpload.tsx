import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, IMediaUploadStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';
import SnackBar from './SnackBar';
const FileDrop =
  process.env.NODE_ENV !== 'test' ? require('react-file-drop').default : <></>;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    label: {
      display: 'flex',
      flexDirection: 'row',
      flexGrow: 1,
      backgroundColor: theme.palette.grey[500],
      border: 'none',
      padding: theme.spacing(2),
    },
    drop: {
      borderWidth: '1px',
      borderStyle: 'dashed',
      borderColor: theme.palette.secondary.light,
      padding: theme.spacing(1),
      margin: theme.spacing(1),
    },
  })
);

interface IStateProps {
  t: IMediaUploadStrings;
}

interface IProps extends IStateProps {
  visible: boolean;
  uploadMethod?: (files: FileList) => void;
  cancelMethod?: () => void;
}

function MediaUpload(props: IProps) {
  const { t, visible, uploadMethod, cancelMethod } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(visible);
  const [name, setName] = useState('');
  const [files, setFiles] = useState();
  const [message, setMessage] = useState(<></>);

  const handleAddOrSave = () => {
    if (uploadMethod) {
      uploadMethod(files);
    }
    setName('');
    setOpen(false);
  };
  const handleCancel = () => {
    if (cancelMethod) {
      setFiles(null);
      setName('');
      cancelMethod();
    }
    setOpen(false);
  };
  const fileName = (files: FileList) => {
    return files.length === 1
      ? files[0].name
      : files.length.toString() + ' files selected';
  };

  const handleNameChange = (
    e: React.FormEvent<HTMLInputElement | HTMLLabelElement>
  ) => {
    const inputEl = e.target as HTMLInputElement;
    if (inputEl && inputEl.files) {
      setName(fileName(inputEl.files));
      setFiles(inputEl.files);
    }
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };

  const handleDrop = (files: FileList) => {
    setName(fileName(files));
    setFiles(files);
  };

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  const dropTarget =
    process.env.NODE_ENV !== 'test' ? (
      <FileDrop onDrop={handleDrop}>
        <label
          id="file"
          className={classes.label}
          htmlFor="upload"
          onChange={handleNameChange}
        >
          {name === '' ? t.dragDrop : name}
        </label>
        <input
          id="upload"
          style={{ display: 'none' }}
          type="file"
          accept="audio/mpeg, audio/wav"
          multiple={true}
          onChange={handleNameChange}
        />
      </FileDrop>
    ) : (
      <div>
        <label
          id="file"
          className={classes.label}
          htmlFor="upload"
          onChange={handleNameChange}
        >
          {name === '' ? t.dragDrop : name}
        </label>
        <input
          id="upload"
          style={{ display: 'none' }}
          type="file"
          accept="audio/mpeg, audio/wav"
          multiple={true}
          onChange={handleNameChange}
        />
      </div>
    );

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{t.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t.task}</DialogContentText>
          <div className={classes.drop}>{dropTarget}</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {t.cancel}
          </Button>
          <Button onClick={handleAddOrSave} variant="contained" color="primary">
            {t.upload}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaUpload' }),
});

export default connect(mapStateToProps)(MediaUpload) as any;
