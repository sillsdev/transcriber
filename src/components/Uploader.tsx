import React, { useRef } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import { IState, IMediaTabStrings, ISharedStrings, MediaFile } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import localStrings from '../selector/localize';
import MediaUpload, { UploadType } from './MediaUpload';
import { getMediaInPlans, related, remoteIdNum } from '../crud';
import Auth from '../auth/Auth';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { currentDateTime } from '../utils';
import { TransformBuilder } from '@orbit/data';
import { AddRecord } from '../model/baseModel';
import PassageRecord from './PassageRecord';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    unsupported: {
      color: theme.palette.secondary.light,
    },
  })
);

export interface IStatus {
  canceled: boolean;
}

interface IStateProps {
  t: IMediaTabStrings;
  ts: ISharedStrings;
  uploadError: string;
}

interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
  recordAudio: boolean;
  defaultFilename?: string;
  isOpen: boolean;
  onOpen: (visible: boolean) => void;
  showMessage: (msg: string | JSX.Element) => void;
  setComplete: (amount: number) => void; // 0 to 100
  finish?: (planId: string, mediaRemoteIds?: string[]) => void; // logic when upload complete
  metaData?: JSX.Element; // component embeded in dialog
  ready?: () => boolean; // if false control is disabled
  createProject?: (file: File[]) => Promise<any>;
  status: IStatus;
  multiple?: boolean;
  mediaId?: string;
  importList?: File[];
}

export const Uploader = (props: IProps) => {
  const {
    auth,
    mediaId,
    recordAudio,
    defaultFilename,
    t,
    isOpen,
    onOpen,
    showMessage,
    status,
    multiple,
    importList,
  } = props;
  const { nextUpload } = props;
  const { uploadError } = props;
  const { uploadComplete, setComplete, finish } = props;
  const { uploadFiles } = props;
  const { metaData, ready } = props;
  const { createProject } = props;
  const classes = useStyles();
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [errorReporter] = useGlobal('errorReporter');
  const [, setBusy] = useGlobal('importexportBusy');
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly');
  const planIdRef = useRef<string>(plan);
  const successCount = useRef<number>(0);
  const fileList = useRef<File[]>();
  const authRef = useRef<Auth>(auth);
  const mediaIdRef = useRef<string[]>([]);
  const artifactTypeRef = useRef<string>('');

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
      status.canceled = successCount.current <= 0;
      finish && finish(planIdRef.current, mediaIdRef.current);
    }, 1000);
  };

  const getPlanId = () =>
    remoteIdNum('plan', planIdRef.current, memory.keyMap) || planIdRef.current;

  const pullPlanMedia = async () => {
    const planId = getPlanId();
    if (planId !== undefined) {
      var filterrec = {
        attribute: 'plan-id',
        value: planId,
      };
      var t = await remote.pull((q) =>
        q.findRecords('mediafile').filter(filterrec)
      );
      await memory.sync(t);
    }
  };

  const itemComplete = async (n: number, success: boolean, data?: any) => {
    if (success) successCount.current += 1;
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (data?.stringId) mediaIdRef.current.push(data?.stringId);
    else if (success && data) {
      // offlineOnly
      const planRecId = { type: 'plan', id: planIdRef.current };
      if (planRecId.id) {
        var media = getMediaInPlans(
          [planRecId.id],
          memory.cache.query((q) => q.findRecords('mediafile')) as MediaFile[]
        ).filter((m) => m.attributes.originalFile === data.originalFile);
        var num = 1;
        var psg = '';
        if (media.length > 0) {
          var last = media.sort((i, j) =>
            i.attributes.versionNumber > j.attributes.versionNumber ? -1 : 1
          )[0];
          num = last.attributes.versionNumber + 1;
          psg = related(last, 'passage');
        }
        const mediaRec: MediaFile = {
          type: 'mediafile',
          attributes: {
            ...data,
            versionNumber: num,
            transcription: '',
            filesize: uploadList[n].size,
            position: 0,
            dateCreated: currentDateTime(),
            dateUpdated: currentDateTime(),
          },
        } as any;
        const t = new TransformBuilder();
        await memory.update([
          ...AddRecord(t, mediaRec, user, memory),
          t.replaceRelatedRecord(mediaRec, 'plan', planRecId),
        ]);
        if (psg && psg !== '')
          await memory.update([
            t.replaceRelatedRecord(mediaRec, 'passage', {
              type: 'passage',
              id: psg,
            }),
          ]);
        mediaIdRef.current.push(mediaRec.id);
      } else {
        throw new Error('Plan Id not set.  Media not created.');
      }
    }
    setComplete(Math.min((n * 100) / uploadList.length, 100));
    const next = n + 1;
    if (next < uploadList.length && !status.canceled) {
      doUpload(next);
    } else if (!offlineOnly) {
      pullPlanMedia().then(() => finishMessage());
    } else {
      finishMessage();
    }
  };

  const doUpload = (currentlyLoading: number) => {
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    const mediaFile = {
      planId: getPlanId(),
      originalFile: uploadList[currentlyLoading].name,
      contentType: uploadList[currentlyLoading].type,
      artifactType: artifactTypeRef.current,
    } as any;
    nextUpload(
      mediaFile,
      uploadList,
      currentlyLoading,
      authRef.current,
      offlineOnly,
      errorReporter,
      itemComplete
    );
  };

  const uploadMedia = async (files: File[], artifactType?: string) => {
    successCount.current = 0;
    if (!files || files.length === 0) {
      showMessage(t.selectFiles);
      return;
    }
    setBusy(true);
    if (createProject) planIdRef.current = await createProject(files);
    uploadFiles(files);
    fileList.current = files;
    mediaIdRef.current = new Array<string>();
    authRef.current = auth;
    artifactTypeRef.current = artifactType || '';
    doUpload(0);
    onOpen(false);
  };

  const uploadCancel = () => {
    onOpen(false);
    if (status) status.canceled = true;
    //what is this???
    document.getElementsByTagName('body')[0].removeAttribute('style');
  };

  React.useEffect(() => {
    if (uploadError !== '') {
      if (uploadError.indexOf('unsupported') > 0)
        showMessage(
          <span className={classes.unsupported}>
            {t.unsupported.replace(
              '{0}',
              uploadError.substr(0, uploadError.indexOf(':unsupported'))
            )}
          </span>
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
        <PassageRecord
          visible={isOpen}
          mediaId={mediaId}
          auth={auth}
          multiple={multiple}
          uploadMethod={uploadMedia}
          cancelMethod={uploadCancel}
          metaData={metaData}
          ready={ready}
          defaultFilename={defaultFilename}
        />
      )}
      {!recordAudio && !importList && (
        <MediaUpload
          visible={isOpen}
          uploadType={UploadType.Media}
          multiple={multiple}
          uploadMethod={uploadMedia}
          cancelMethod={uploadCancel}
          metaData={metaData}
          ready={ready}
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
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Uploader);
