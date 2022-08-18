import React, { useEffect, useState } from 'react';
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
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 400,
    },
    menu: {
      width: 300,
    },
    formTextInput: {
      fontSize: 'small',
    },
    formTextLabel: {
      fontSize: 'small',
    },
  })
);

interface IStateProps {
  t: IMediaUploadStrings;
}

export enum UploadType {
  Media = 0,
  Resource = 1,
  ITF = 2,
  PTF = 3,
  LOGO = 4 /* do we need separate ones for org and avatar? */,
  ProjectResource = 5,
}

interface ITargetProps extends IStateProps {
  name: string;
  acceptextension: string;
  acceptmime: string;
  multiple?: boolean;
  handleFiles: (files: FileList | undefined) => void;
}

const DropTarget = (targetProps: ITargetProps) => {
  const { name, multiple, acceptextension, acceptmime, handleFiles, t } =
    targetProps;
  const classes = useStyles();
  const inputStyle = { display: 'none' };

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

  return process.env.NODE_ENV !== 'test' ? (
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
        accept={acceptextension}
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
        accept={acceptmime}
        multiple={multiple}
        onChange={handleNameChange}
      />
    </div>
  );
};

interface IProps extends IStateProps {
  visible: boolean;
  onVisible: (v: boolean) => void;
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
    onVisible,
    uploadType,
    multiple,
    uploadMethod,
    cancelMethod,
    metaData,
    ready,
  } = props;
  const classes = useStyles();
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const { showMessage } = useSnackBar();
  const [acceptextension, setAcceptExtension] = useState('');
  const [acceptmime, setAcceptMime] = useState('');
  const title = [
    t.title,
    t.resourceTitle,
    t.ITFtitle,
    t.PTFtitle,
    'FUTURE TODO',
    t.resourceTitle,
  ];
  const text = [
    t.task,
    t.resourceTask,
    t.ITFtask,
    t.PTFtask,
    'FUTURE TODO',
    t.projectResourceTask,
  ];

  const handleAddOrSave = () => {
    if (uploadMethod && files) {
      uploadMethod(files);
    }
    handleFiles(undefined);
    onVisible(false);
  };
  const handleCancel = () => {
    handleFiles(undefined);
    if (cancelMethod) {
      cancelMethod();
    }
    onVisible(false);
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

  useEffect(() => {
    setAcceptExtension(
      [
        '.mp3, .m4a, .wav, .ogg',
        '.mp3, .m4a, .wav, .ogg, .pdf',
        '.itf',
        '.ptf',
        '.jpg, .svg, .png',
        '.mp3, .m4a, .wav, .ogg, .pdf',
      ].map((s) => s)[uploadType]
    );
  }, [uploadType]);

  useEffect(() => {
    setAcceptMime(
      [
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg',
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg, application/pdf',
        'application/itf',
        'application/ptf',
        'image/jpeg, image/svg+xml, image/png',
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg, application/pdf',
      ].map((s) => s)[uploadType]
    );
  }, [uploadType]);

  return (
    <div>
      <Dialog
        open={visible}
        onClose={handleCancel}
        aria-labelledby="audUploadDlg"
        disableEnforceFocus
      >
        <DialogTitle id="audUploadDlg">{title[uploadType]}</DialogTitle>
        <DialogContent>
          <DialogContentText>{text[uploadType]}</DialogContentText>
          <div className={classes.drop}>
            <DropTarget
              name={name}
              handleFiles={handleFiles}
              acceptextension={acceptextension}
              acceptmime={acceptmime}
              multiple={multiple}
              t={t}
            />
          </div>
          {metaData}
        </DialogContent>
        <DialogActions>
          <Button
            id="uploadCancel"
            onClick={handleCancel}
            variant="outlined"
            color="primary"
          >
            {t.cancel}
          </Button>
          <Button
            id="uploadSave"
            onClick={handleAddOrSave}
            variant="contained"
            color="primary"
            disabled={(ready && !ready()) || !files || files.length === 0}
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
