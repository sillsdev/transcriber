import React, { useRef, useContext } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import { IState, IMediaTabStrings, ISharedStrings, MediaFile } from '../model';
import { styled } from '@mui/material';
import localStrings from '../selector/localize';
import MediaUpload, { UploadType } from './MediaUpload';
import {
  findRecord,
  pullPlanMedia,
  related,
  remoteIdNum,
  useArtifactType,
  useOfflnMediafileCreate,
} from '../crud';
import { TokenContext } from '../context/TokenProvider';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import PassageRecordDlg from './PassageRecordDlg';
import { restoreScroll } from '../utils';

const UnsupportedMessage = styled('span')(({ theme }) => ({
  color: theme.palette.secondary.light,
}));

interface IStateProps {
  t: IMediaTabStrings;
  ts: ISharedStrings;
  uploadError: string;
}

interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
  doOrbitError: typeof actions.doOrbitError;
}

interface IProps {
  noBusy?: boolean;
  recordAudio: boolean;
  allowWave?: boolean;
  defaultFilename?: string;
  isOpen: boolean;
  onOpen: (visible: boolean) => void;
  showMessage: (msg: string | JSX.Element) => void;
  finish?: (planId: string, mediaRemoteIds?: string[]) => void; // logic when upload complete
  metaData?: JSX.Element; // component embeded in dialog
  ready?: () => boolean; // if false control is disabled
  createProject?: (name: string) => Promise<string>;
  cancelled: React.MutableRefObject<boolean>;
  multiple?: boolean;
  mediaId?: string;
  importList?: File[];
  artifactTypeId?: string | null;
  passageId?: string;
  sourceMediaId?: string;
  sourceSegments?: string;
  performedBy?: string;
  onSpeakerChange?: (performedBy: string) => void;
  topic?: string;
  uploadType?: UploadType;
  team?: string; // used when adding a card to check speakers
}

export const Uploader = (props: IProps & IStateProps & IDispatchProps) => {
  const {
    noBusy,
    mediaId,
    recordAudio,
    allowWave,
    defaultFilename,
    t,
    ts,
    isOpen,
    onOpen,
    showMessage,
    cancelled,
    multiple,
    importList,
    artifactTypeId,
    passageId,
    sourceMediaId,
    sourceSegments,
    performedBy,
    onSpeakerChange,
    topic,
    uploadType,
    team,
  } = props;
  const { nextUpload } = props;
  const { uploadError } = props;
  const { uploadComplete, finish, doOrbitError } = props;
  const { uploadFiles } = props;
  const { metaData, ready } = props;
  const { createProject } = props;
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [errorReporter] = useGlobal('errorReporter');
  const [, setBusy] = useGlobal('importexportBusy');
  const [plan] = useGlobal('plan');
  const [offline] = useGlobal('offline');
  const [user] = useGlobal('user');
  const planIdRef = useRef<string>(plan);
  const successCount = useRef<number>(0);
  const fileList = useRef<File[]>();
  const ctx = useContext(TokenContext).state;
  const mediaIdRef = useRef<string[]>([]);
  const artifactTypeRef = useRef<string>('');
  const { createMedia } = useOfflnMediafileCreate(doOrbitError);
  const [, setComplete] = useGlobal('progress');
  const { localizedArtifactTypeFromId } = useArtifactType();

  const handleSpeakerChange = (speaker: string) => {
    onSpeakerChange && onSpeakerChange(speaker);
  };

  const finishMessage = () => {
    setTimeout(() => {
      if (fileList.current)
        showMessage(
          t.uploadComplete
            .replace('{0}', successCount.current.toString())
            .replace('{1}', fileList.current.length.toString())
        );
      uploadComplete();
      setComplete(0);
      setBusy(false);
      cancelled.current = successCount.current <= 0;
      finish && finish(planIdRef.current, mediaIdRef.current);
    }, 1000);
  };

  const getArtifactTypeId = () =>
    artifactTypeId
      ? remoteIdNum('artifacttype', artifactTypeId, memory.keyMap) ||
        artifactTypeId
      : artifactTypeId;
  const getPassageId = () =>
    remoteIdNum('passage', passageId || '', memory.keyMap) || passageId;
  const getSourceMediaId = () =>
    remoteIdNum('mediafile', sourceMediaId || '', memory.keyMap) ||
    sourceMediaId;
  const getUserId = () =>
    remoteIdNum('user', user || '', memory.keyMap) || user;

  const itemComplete = async (n: number, success: boolean, data?: any) => {
    if (success) successCount.current += 1;
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (data?.stringId) mediaIdRef.current.push(data?.stringId);
    else if (success && data) {
      // offlineOnly
      var psgId = passageId || '';
      var num = 1;
      if (mediaId) {
        const mediaRec = findRecord(memory, 'mediafile', mediaId) as MediaFile;
        if (mediaRec) {
          psgId = related(mediaRec, 'passage');
          if (!artifactTypeId)
            //vernacular
            num = mediaRec.attributes.versionNumber + 1;
        }
      }
      const newMediaRec = await createMedia(
        data,
        num,
        uploadList[n].size,
        psgId,
        artifactTypeId !== undefined ? artifactTypeId : '',
        sourceMediaId || '',
        recordAudio ? user : ''
      );
      mediaIdRef.current.push(newMediaRec.id);
    }

    setComplete(Math.min((n * 100) / uploadList.length, 100));
    const next = n + 1;
    if (next < uploadList.length && !cancelled.current) {
      doUpload(next);
    } else if (!offline) {
      pullPlanMedia(planIdRef.current, memory, remote).then(() => {
        finishMessage();
      });
    } else {
      finishMessage();
    }
  };

  const getPlanId = () =>
    remoteIdNum('plan', planIdRef.current, memory.keyMap) || planIdRef.current;

  const doUpload = (currentlyLoading: number) => {
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    const mediaFile = {
      planId: getPlanId(),
      versionNumber: 1,
      originalFile: uploadList[currentlyLoading].name,
      contentType: uploadList[currentlyLoading].type,
      artifactTypeId: getArtifactTypeId(),
      passageId: getPassageId(),
      userId: getUserId(),
      sourceMediaId: getSourceMediaId(),
      sourceSegments: sourceSegments,
      performedBy: performedBy,
      topic: topic,
      eafUrl: !artifactTypeId
        ? ts.mediaAttached
        : localizedArtifactTypeFromId(artifactTypeId), //put psc message here
    } as any;
    if (recordAudio) mediaFile.recordedbyUserId = getUserId();
    nextUpload(
      mediaFile,
      uploadList,
      currentlyLoading,
      ctx.accessToken || '',
      offline,
      errorReporter,
      itemComplete
    );
  };

  const uploadMedia = async (files: File[]) => {
    successCount.current = 0;
    if (!files || files.length === 0) {
      showMessage(t.selectFiles);
      return;
    }
    if (!noBusy) setBusy(true);
    let name =
      uploadType === UploadType.IntellectualProperty
        ? 'Project'
        : files[0]?.name.split('.')[0];
    if (createProject) planIdRef.current = await createProject(name);
    uploadFiles(files);
    fileList.current = files;
    mediaIdRef.current = new Array<string>();
    artifactTypeRef.current = artifactTypeId || '';
    doUpload(0);
  };

  const uploadCancel = () => {
    onOpen(false);
    if (cancelled) cancelled.current = true;
    restoreScroll();
  };

  React.useEffect(() => {
    if (uploadError !== '') {
      if (uploadError.indexOf('unsupported') > 0)
        showMessage(
          <UnsupportedMessage>
            {t.unsupported.replace(
              '{0}',
              uploadError.substr(0, uploadError.indexOf(':unsupported'))
            )}
          </UnsupportedMessage>
        );
      else showMessage(uploadError);
      setBusy(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [uploadError]);

  React.useEffect(() => {
    if (importList) {
      uploadMedia(importList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importList]);

  React.useEffect(() => {
    if (plan !== '') planIdRef.current = plan;
  }, [plan]);

  return (
    <div>
      {recordAudio && !importList && (
        <PassageRecordDlg
          visible={isOpen}
          onVisible={onOpen}
          mediaId={mediaId}
          uploadMethod={uploadMedia}
          onCancel={uploadCancel}
          metaData={metaData}
          ready={ready}
          defaultFilename={defaultFilename}
          allowWave={allowWave}
          showFilename={allowWave}
          speaker={performedBy}
          onSpeaker={handleSpeakerChange}
          createProject={createProject}
          team={team}
        />
      )}
      {!recordAudio && !importList && (
        <MediaUpload
          visible={isOpen}
          onVisible={onOpen}
          uploadType={uploadType || UploadType.Media}
          multiple={multiple}
          uploadMethod={uploadMedia}
          cancelMethod={uploadCancel}
          metaData={metaData}
          ready={ready}
          speaker={performedBy}
          onSpeaker={handleSpeakerChange}
          createProject={createProject}
          team={team}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaTab' }),
  ts: localStrings(state, { layout: 'shared' }),
  uploadError: state.upload.errmsg,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      uploadFiles: actions.uploadFiles,
      nextUpload: actions.nextUpload,
      uploadComplete: actions.uploadComplete,
      doOrbitError: actions.doOrbitError,
    },
    dispatch
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Uploader) as any as (props: IProps) => JSX.Element;
