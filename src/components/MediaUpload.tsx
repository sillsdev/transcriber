import React, { useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { IMediaUploadStrings } from '../model';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  styled,
} from '@mui/material';
import path from 'path-browserify';
import { useSnackBar } from '../hoc/SnackBar';
import SpeakerName from './SpeakerName';
import { mediaUploadSelector } from '../selector';

const FileDrop =
  process.env.NODE_ENV !== 'test' ? require('../mods/FileDrop').default : <></>;

const MyLabel = styled('label')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  flexGrow: 1,
  backgroundColor: theme.palette.grey[500],
  border: 'none',
  padding: theme.spacing(2),
}));

const Drop = styled('div')(({ theme }) => ({
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: theme.palette.secondary.light,
  padding: theme.spacing(1),
  margin: theme.spacing(1),
}));

const HiddenInput = styled('input')(({ theme }) => ({
  display: 'none',
}));

export enum UploadType {
  Media = 0,
  Resource = 1,
  ITF = 2,
  PTF = 3,
  LOGO = 4 /* do we need separate ones for org and avatar? */,
  ProjectResource = 5,
  IntellectualProperty = 6,
}

interface ITargetProps {
  name: string;
  acceptextension: string;
  acceptmime: string;
  multiple?: boolean;
  handleFiles: (files: FileList | undefined) => void;
}

const DropTarget = (targetProps: ITargetProps) => {
  const { name, multiple, acceptextension, acceptmime, handleFiles } =
    targetProps;
  const t: IMediaUploadStrings = useSelector(mediaUploadSelector, shallowEqual);

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
      <MyLabel id="file" htmlFor="upload" onChange={handleNameChange}>
        {name === ''
          ? multiple
            ? t.dragDropMultiple
            : t.dragDropSingle
          : name}
      </MyLabel>
      <HiddenInput
        id="upload"
        type="file"
        accept={acceptextension}
        multiple={multiple}
        onChange={handleNameChange}
      />
    </FileDrop>
  ) : (
    <div>
      <MyLabel id="file" htmlFor="upload" onChange={handleNameChange}>
        {name === ''
          ? multiple
            ? t.dragDropMultiple
            : t.dragDropSingle
          : name}
      </MyLabel>
      <HiddenInput
        id="upload"
        type="file"
        accept={acceptmime}
        multiple={multiple}
        onChange={handleNameChange}
      />
    </div>
  );
};

interface IProps {
  visible: boolean;
  onVisible: (v: boolean) => void;
  uploadType: UploadType;
  uploadMethod?: (files: File[]) => void;
  multiple?: boolean;
  cancelMethod?: () => void;
  metaData?: JSX.Element;
  ready?: () => boolean;
  speaker?: string;
  onSpeaker?: (speaker: string) => void;
  createProject?: (name: string) => Promise<string>;
  team?: string; // used to check for speakers when adding a card
}

function MediaUpload(props: IProps) {
  const {
    visible,
    onVisible,
    uploadType,
    multiple,
    uploadMethod,
    cancelMethod,
    metaData,
    ready,
    speaker,
    onSpeaker,
    createProject,
    team,
  } = props;
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const { showMessage } = useSnackBar();
  const [acceptextension, setAcceptExtension] = useState('');
  const [acceptmime, setAcceptMime] = useState('');
  const [hasRights, setHasRight] = useState(!onSpeaker || Boolean(speaker));
  const t: IMediaUploadStrings = useSelector(mediaUploadSelector, shallowEqual);
  const title = [
    t.title,
    t.resourceTitle,
    t.ITFtitle,
    t.PTFtitle,
    'FUTURE TODO',
    t.resourceTitle,
    t.intellectualPropertyTitle,
  ];
  const text = [
    t.task,
    t.resourceTask,
    t.ITFtask,
    t.PTFtask,
    'FUTURE TODO',
    t.projectResourceTask,
    t.intellectualPropertyTask,
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

  const handleRights = (hasRights: boolean) => setHasRight(hasRights);
  const handleSpeaker = (speaker: string) => {
    onSpeaker && onSpeaker(speaker);
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
        '.mp3, .m4a, .wav, .ogg, .pdf, .png, .jpg',
      ].map((s) => s)[uploadType]
    );
    setAcceptMime(
      [
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg',
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg, application/pdf',
        'application/itf',
        'application/ptf',
        'image/jpeg, image/svg+xml, image/png',
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg, application/pdf',
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg, application/pdf, image/png, image/jpeg',
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
          <DialogContentText>
            {text[uploadType].replace('{0}', speaker || '')}
          </DialogContentText>
          {onSpeaker && uploadType === UploadType.Media && (
            <SpeakerName
              name={hasRights ? speaker || '' : ''}
              onRights={handleRights}
              onChange={handleSpeaker}
              createProject={createProject}
              team={team}
            />
          )}
          <Drop>
            {hasRights ? (
              <DropTarget
                name={name}
                handleFiles={handleFiles}
                acceptextension={acceptextension}
                acceptmime={acceptmime}
                multiple={multiple}
              />
            ) : (
              <MyLabel>{'\u00A0'}</MyLabel>
            )}
          </Drop>
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
            disabled={
              (ready && !ready()) || !files || files.length === 0 || !hasRights
            }
          >
            {t.upload}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default MediaUpload;
