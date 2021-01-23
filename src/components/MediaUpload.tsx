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
import path from 'path';
import { useSnackBar } from '../hoc/SnackBar';
const FileDrop =
  process.env.NODE_ENV !== 'test' ? require('../mods/FileDrop').default : <></>;

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

export enum UploadType {
  Media = 0,
  ITF = 1,
  PTF = 2,
  LOGO = 3 /* do we need separate ones for org and avatar? */,
}

interface IProps extends IStateProps {
  visible: boolean;
  uploadType: UploadType;
  uploadMethod?: (files: File[]) => void;
  multiple?: boolean;
  cancelMethod?: () => void;
  metaData?: JSX.Element;
  ready?: () => boolean;
}

function MediaUpload(props: IProps) {
  const {
    t,
    visible,
    uploadType,
    multiple,
    uploadMethod,
    cancelMethod,
    metaData,
    ready,
  } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(visible);
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const { showMessage } = useSnackBar();
  const acceptextension = [
    '.mp3, .m4a, .wav, .ogg',
    '.itf',
    '.ptf',
    '.jpg, .svg, .png',
  ];
  const acceptmime = [
    'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg',
    'application/itf',
    'application/ptf',
    'image/jpeg, image/svg+xml, image/png',
  ];
  const title = [t.title, t.ITFtitle, t.PTFtitle, 'FUTURE TODO'];
  const text = [t.task, t.ITFtask, t.PTFtask, 'FUTURE TODO'];

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
        acceptextension[uploadType].includes(
          (path.extname(s.name) || '.xxx').substring(1)
        )
      );
      if (goodFiles.length < files.length) {
        var rejectedFiles = Array.from(files).filter(
          (s) =>
            !acceptextension[uploadType].includes(
              (path.extname(s.name) || '.xxx').substring(1)
            )
        );
        showMessage(
          t.invalidFile + rejectedFiles.map((f) => f.name).join(', ')
        );
      }
      setName(fileName(goodFiles));
      setFiles(goodFiles);
    } else {
      setFiles([]);
      setName('');
    }
  };
  const handleNameChange = (
    e: React.FormEvent<HTMLInputElement | HTMLLabelElement>
  ) => {
    const inputEl = e.target as HTMLInputElement;
    if (inputEl && inputEl.files) {
      handleFiles(inputEl.files);
    }
  };

  const handleDrop = (files: FileList) => {
    handleFiles(files);
  };

  useEffect(() => {
    setOpen(visible);
  }, [visible]);
  const inputStyle = { display: 'none' };
  const dropTarget =
    process.env.NODE_ENV !== 'test' ? (
      <FileDrop onDrop={handleDrop}>
        <label
          id="file"
          className={classes.label}
          htmlFor="upload"
          onChange={handleNameChange}
        >
          {name === ''
            ? multiple
              ? t.dragDropMultiple
              : t.dragDropSingle
            : name}
        </label>
        <input
          id="upload"
          style={inputStyle}
          type="file"
          accept={acceptextension[uploadType]}
          multiple={multiple}
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
          {name === ''
            ? multiple
              ? t.dragDropMultiple
              : t.dragDropSingle
            : name}
        </label>
        <input
          id="upload"
          style={inputStyle}
          type="file"
          accept={acceptmime[uploadType]}
          multiple={multiple}
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
        <DialogTitle id="form-dialog-title">{title[uploadType]}</DialogTitle>
        <DialogContent>
          <DialogContentText>{text[uploadType]}</DialogContentText>
          <div className={classes.drop}>{dropTarget}</div>
          {metaData}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {t.cancel}
          </Button>
          <Button
            onClick={handleAddOrSave}
            variant="contained"
            color="primary"
            disabled={(ready && !ready()) || !files}
          >
            {t.upload}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaUpload' }),
});

export default connect(mapStateToProps)(MediaUpload) as any;
