import React, { useRef, useContext, useEffect, useState } from 'react';
import { useGlobal } from 'reactn';
import * as actions from '../store';
import { IState, IMediaTabStrings, ISharedStrings, MediaFile } from '../model';
import MediaUpload, { SIZELIMIT, UploadType } from './MediaUpload';
import {
  pullTableList,
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
import { shallowEqual, useSelector } from 'react-redux';
import { NextUploadProps } from '../store';
import { useDispatch } from 'react-redux';
import { mediaTabSelector, sharedSelector } from '../selector';
import { passageDefaultSuffix } from '../utils/passageDefaultFilename';
import { IndexedDBSource } from '@orbit/indexeddb';
import path from 'path-browserify';
import { RecordKeyMap } from '@orbit/records';
import { AlertSeverity } from '../hoc/SnackBar';

interface IProps {
  noBusy?: boolean;
  recordAudio: boolean;
  allowWave?: boolean;
  defaultFilename?: string;
  isOpen: boolean;
  onOpen: (visible: boolean) => void;
  showMessage: (msg: string | JSX.Element, alert?: AlertSeverity) => void;
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

export const Uploader = (props: IProps) => {
  const {
    noBusy,
    mediaId,
    recordAudio,
    allowWave,
    defaultFilename,
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
  const { finish } = props;
  const { metaData, ready } = props;
  const { createProject } = props;
  const t: IMediaTabStrings = useSelector(mediaTabSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const uploadError = useSelector((state: IState) => state.upload.errmsg);
  const dispatch = useDispatch();
  const uploadFiles = (files: File[]) => dispatch(actions.uploadFiles(files));
  const nextUpload = (props: NextUploadProps) =>
    dispatch(actions.nextUpload(props));
  const uploadComplete = () => dispatch(actions.uploadComplete());
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
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
  const { createMedia } = useOfflnMediafileCreate();
  const [, setComplete] = useGlobal('progress');
  const [errMsgs, setErrMsgs] = useState<string[]>([]);
  const { localizedArtifactTypeFromId } = useArtifactType();
  const handleSpeakerChange = (speaker: string) => {
    onSpeakerChange && onSpeakerChange(speaker);
  };

  const finishMessage = () => {
    //wait for any error messages to show up
    setTimeout(() => {
      errMsgs.forEach((err, ix) => {
        setTimeout(() => showMessage(err, AlertSeverity.Error), ix ? 2000 : 0);
      });
      setErrMsgs([]);
      //wait to show the final message if there are errors
      setTimeout(() => {
        if (fileList.current) {
          showMessage(
            t.uploadComplete
              .replace('{0}', successCount.current.toString())
              .replace('{1}', fileList.current.length.toString())
          );
        }
      }, errMsgs.length * 2000);
      uploadComplete();
      setComplete(0);
      setBusy(false);
      cancelled.current = successCount.current <= 0;
      finish && finish(planIdRef.current, mediaIdRef.current);
    }, 1000);
  };

  const getArtifactTypeId = () =>
    artifactTypeId
      ? remoteIdNum(
          'artifacttype',
          artifactTypeId,
          memory.keyMap as RecordKeyMap
        ) || artifactTypeId
      : artifactTypeId;
  const getPassageId = () =>
    remoteIdNum('passage', passageId || '', memory.keyMap as RecordKeyMap) ||
    passageId;
  const getSourceMediaId = () =>
    remoteIdNum(
      'mediafile',
      sourceMediaId || '',
      memory.keyMap as RecordKeyMap
    ) || sourceMediaId;
  const getUserId = () =>
    remoteIdNum('user', user || '', memory.keyMap as RecordKeyMap) || user;

  const itemComplete = async (n: number, success: boolean, data?: any) => {
    if (success) successCount.current += 1;
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (data?.stringId) mediaIdRef.current.push(data?.stringId);
    else if (success && data) {
      // offlineOnly
      var psgId = passageId || '';
      var num = 1;
      if (psgId && !artifactTypeId) {
        const mediaFiles = (
          memory.cache.query((q) => q.findRecords('mediafile')) as MediaFile[]
        )
          .filter(
            (m) =>
              related(m, 'passage') === psgId &&
              related(m, 'artifactType') === null
          )
          .sort(
            (i, j) => j.attributes.versionNumber - i.attributes.versionNumber
          );
        if (mediaFiles.length > 0) {
          //vernacular
          num = mediaFiles[0].attributes.versionNumber + 1;
        }
      }
      const newMediaRec = await createMedia(
        data,
        num,
        uploadList[n].size,
        psgId,
        artifactTypeId !== undefined ? artifactTypeId : '',
        sourceMediaId || '',
        user
      );
      mediaIdRef.current.push(newMediaRec.id);
    }

    setComplete(Math.min((n * 100) / uploadList.length, 100));
    const next = n + 1;
    if (next < uploadList.length && !cancelled.current) {
      doUpload(next);
    } else if (!offline && mediaIdRef.current?.length > 0) {
      pullTableList(
        'mediafile',
        mediaIdRef.current,
        memory,
        remote,
        backup,
        errorReporter
      ).then(() => {
        finishMessage();
      });
    } else {
      finishMessage();
    }
  };

  const getPlanId = () =>
    remoteIdNum('plan', planIdRef.current, memory.keyMap as RecordKeyMap) ||
    planIdRef.current;

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
      recordedbyUserId: getUserId(),
      sourceMediaId: getSourceMediaId(),
      sourceSegments: sourceSegments,
      performedBy: performedBy,
      topic: topic,
      eafUrl: !artifactTypeId
        ? ts.mediaAttached
        : localizedArtifactTypeFromId(artifactTypeId), //put psc message here
    } as any;

    nextUpload({
      record: mediaFile,
      files: uploadList,
      n: currentlyLoading,
      token: ctx.accessToken || '',
      offline: offline,
      errorReporter,
      uploadType: uploadType ?? UploadType.Media,
      cb: itemComplete,
    });
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
    var suffix = passageDefaultSuffix(planIdRef.current, memory, offline);

    while (
      files.findIndex(
        (f) => !path.basename(f.name, path.extname(f.name)).endsWith(suffix)
      ) > -1
    ) {
      var ix = files.findIndex(
        (f) => !path.basename(f.name, path.extname(f.name)).endsWith(suffix)
      );
      files.splice(
        ix,
        1,
        new File(
          [files[ix]],
          path.basename(files[ix].name, path.extname(files[ix].name)) +
            suffix +
            path.extname(files[ix].name)
        )
      );
    }
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

  useEffect(() => {
    setErrMsgs([]);
  }, []);

  useEffect(() => {
    if (uploadError && uploadError !== '') {
      var msg = uploadError;
      if (uploadError.indexOf('unsupported') > 0)
        msg = t.unsupported.replace(
          '{0}',
          uploadError.substring(0, uploadError.indexOf(':unsupported'))
        );
      else if (uploadError.indexOf('toobig') > 0) {
        msg = t.toobig
          .replace(
            '{0}',
            uploadError.substring(0, uploadError.indexOf(':toobig'))
          )
          .replace(
            '{1}',
            uploadError.substring(
              uploadError.indexOf('toobig:') + 'toobig:'.length
            )
          )
          .replace('{2}', SIZELIMIT(uploadType ?? UploadType.Media).toString());
      }
      errMsgs.push(msg);
      setBusy(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [uploadError]);

  useEffect(() => {
    if (importList) {
      uploadMedia(importList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importList]);

  useEffect(() => {
    if (plan !== '') planIdRef.current = plan;
  }, [plan]);

  return (
    <div>
      {recordAudio && ready && !importList && (
        <PassageRecordDlg
          visible={isOpen}
          onVisible={onOpen}
          mediaId={mediaId ?? ''}
          uploadMethod={uploadMedia}
          onCancel={uploadCancel}
          metaData={metaData}
          ready={ready}
          defaultFilename={defaultFilename}
          allowWave={allowWave}
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
          onSpeaker={
            !artifactTypeId &&
            (uploadType || UploadType.Media) === UploadType.Media
              ? handleSpeakerChange
              : undefined
          }
          createProject={createProject}
          team={team}
        />
      )}
    </div>
  );
};

export default Uploader;
