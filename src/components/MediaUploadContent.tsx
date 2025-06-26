import React, { useEffect, useRef, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { IMediaUploadStrings } from '../model';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  LinearProgress,
  styled,
} from '@mui/material';
import path from 'path-browserify';
import { useSnackBar } from '../hoc/SnackBar';
import SpeakerName from './SpeakerName';
import { mediaUploadSelector } from '../selector';
import { LinkEdit } from '../control/LinkEdit';
import { MarkDownEdit } from '../control/MarkDownEdit';
import { isUrl } from '../utils';
import {
  MarkDownType,
  SIZELIMIT,
  UploadType,
  UriLinkType,
} from './MediaUpload';

const FileDrop =
  process.env.NODE_ENV !== 'test' ? require('react-file-drop').FileDrop : <></>;

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
  onVisible: (v: boolean) => void;
  uploadType: UploadType;
  uploadMethod?: (files: File[]) => void;
  multiple?: boolean;
  cancelMethod?: () => void;
  cancelLabel?: string;
  metaData?: JSX.Element;
  ready?: () => boolean;
  speaker?: string;
  onSpeaker?: (speaker: string) => void;
  team?: string; // used to check for speakers when adding a card
  onFiles?: (files: File[]) => void;
  inValue?: string;
  onValue?: (value: string) => void;
  onNonAudio?: (nonAudio: boolean) => void;
  saveText?: string;
}

function MediaUploadContent(props: IProps) {
  const {
    onVisible,
    uploadType,
    multiple,
    uploadMethod,
    cancelMethod,
    cancelLabel,
    metaData,
    ready,
    speaker,
    onSpeaker,
    team,
    onFiles,
    inValue,
    onValue,
    onNonAudio,
    saveText,
  } = props;
  const [name, setName] = useState('');
  const [files, setFilesx] = useState<File[]>([]);
  const filesRef = useRef(files);
  const { showMessage } = useSnackBar();
  const [acceptextension, setAcceptExtension] = useState('');
  const [sizeLimit, setSizeLimit] = useState(0);
  const [acceptmime, setAcceptMime] = useState('');
  const [hasRights, setHasRight] = useState(!onSpeaker || Boolean(speaker));
  const [progress, setProgress] = useState(false);
  const t: IMediaUploadStrings = useSelector(mediaUploadSelector, shallowEqual);
  const text = [
    t.task,
    t.resourceTask,
    t.ITFtask,
    t.PTFtask,
    'FUTURE TODO',
    t.projectResourceTask,
    t.intellectualPropertyTask,
    t.graphicTask,
    t.linkTask,
    t.markdownTask,
  ];

  const handleAddOrSave = () => {
    if (uploadMethod && files) {
      setProgress(true);
      uploadMethod(files);
    }
    handleFiles(undefined);
  };
  const handleCancel = () => {
    handleFiles(undefined);
    if (cancelMethod) {
      cancelMethod();
    }
    onVisible(false);
  };
  const setFiles = (f: File[]) => {
    filesRef.current = f;
    setFilesx(f);
    onFiles && onFiles(f);
  };
  const fileName = (files: File[]) => {
    return files.length === 0
      ? ''
      : files.length === 1
      ? files[0].name
      : files.length.toString() + ' files selected';
  };
  const checkSizes = (files: File[], sizelimit: number) => {
    var smallenoughfiles = Array.from(
      files.filter((s) => s.size <= sizelimit * 1000000)
    );
    if (smallenoughfiles.length < files.length) {
      var rejectedFiles = Array.from(files).filter(
        (s) => s.size > sizelimit * 1000000
      );
      showMessage(
        t.toobig
          .replace('{0}', rejectedFiles.map((f) => f.name).join(', '))
          .replace('{1}', sizelimit.toString())
      );
    }
    return smallenoughfiles;
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
      const nonAudio = goodFiles.some((f) => !f?.type.includes('audio'));
      if (onNonAudio) onNonAudio(nonAudio);
      goodFiles = checkSizes(goodFiles, sizeLimit);
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
  const handleValue = (newValue: string) => {
    const type = uploadType === UploadType.Link ? UriLinkType : MarkDownType;
    setFiles([{ name: newValue, size: newValue.length, type } as File]);
    onValue && onValue(newValue);
  };

  useEffect(() => setProgress(false), []);

  useEffect(() => {
    if (inValue) {
      setFiles([
        { name: inValue, size: inValue.length, type: MarkDownType } as File,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inValue]);

  useEffect(() => {
    setAcceptExtension(
      [
        '.mp3, .m4a, .wav, .ogg',
        '.mp3, .m4a, .wav, .ogg, .pdf',
        '.itf',
        '.ptf',
        '.jpg, .jpeg, .svg, .png',
        '.mp3, .m4a, .wav, .ogg, .pdf',
        '.mp3, .m4a, .wav, .ogg, .pdf, .png, .jpg, .jpeg',
        '.png, .jpg, .jpeg, .webp',
      ].map((s) => s)[uploadType]
    );
    setAcceptMime(
      [
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg',
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg, application/pdf',
        'application/itf',
        'application/ptf',
        'image/jpeg, image/jpeg, image/svg+xml, image/png',
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg, application/pdf',
        'audio/mpeg, audio/wav, audio/x-m4a, audio/ogg, application/pdf, image/png, image/jpeg, image/jpeg',
        'image/png, image/jpeg, image/jpeg, image/webp',
      ].map((s) => s)[uploadType]
    );
    var size = SIZELIMIT(uploadType);
    setSizeLimit(size);
    if (filesRef.current.length > 0) {
      var goodFiles = checkSizes(filesRef.current, size);
      setName(fileName(goodFiles));
      setFiles(goodFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadType]);

  return (
    <>
      <DialogContent>
        <DialogContentText>
          {text[uploadType].replace('{0}', speaker || '')}
        </DialogContentText>
        {onSpeaker && uploadType === UploadType.Media && (
          <SpeakerName
            name={hasRights ? speaker || '' : ''}
            onRights={handleRights}
            onChange={handleSpeaker}
            team={team}
          />
        )}
        {![UploadType.Link, UploadType.MarkDown].includes(uploadType) ? (
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
        ) : uploadType === UploadType.Link ? (
          <LinkEdit onValue={handleValue} />
        ) : (
          <MarkDownEdit inValue={inValue} onValue={handleValue} />
        )}
        {metaData}
        {progress && <LinearProgress variant="indeterminate" />}
      </DialogContent>
      <DialogActions>
        <Button
          id="uploadCancel"
          onClick={handleCancel}
          variant="outlined"
          color="primary"
        >
          {cancelLabel || t.cancel}
        </Button>
        <Button
          id="uploadSave"
          onClick={handleAddOrSave}
          variant="contained"
          color="primary"
          disabled={
            (ready && !ready()) ||
            !files ||
            files.length === 0 ||
            files[0].name.trim() === '' ||
            !hasRights ||
            (uploadType === UploadType.Link && !isUrl(files[0].name))
          }
        >
          {saveText || t.upload}
        </Button>
      </DialogActions>
    </>
  );
}

export default MediaUploadContent;
