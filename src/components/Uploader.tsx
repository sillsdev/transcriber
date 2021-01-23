import React from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import { IState, IMediaTabStrings, ISharedStrings, MediaFile } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import localStrings from '../selector/localize';
import MediaUpload, { UploadType } from './MediaUpload';
import { remoteIdNum } from '../crud';
import Auth from '../auth/Auth';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { currentDateTime } from '../utils';
import { TransformBuilder } from '@orbit/data';
import { AddRecord } from '../model/baseModel';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    unsupported: {
      color: theme.palette.secondary.light,
    },
  })
);

export const statusInit = { canceled: false };

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

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
  isOpen: boolean;
  onOpen: (visible: boolean) => void;
  showMessage: (msg: string | JSX.Element) => void;
  setComplete: (amount: number) => void; // 0 to 100
  finish?: (planId: string, mediaRemoteIds?: string[]) => void; // logic when upload complete
  metaData?: JSX.Element; // component embeded in dialog
  ready?: () => boolean; // if false control is disabled
  createProject?: (file: File[]) => Promise<any>;
  status: typeof statusInit;
  multiple?: boolean;
}

export const Uploader = (props: IProps) => {
  const { auth, t, isOpen, onOpen, showMessage, status, multiple } = props;
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
  const planIdRef = React.useRef<string>();
  const successCount = React.useRef<number>(0);
  const fileList = React.useRef<File[]>();
  const authRef = React.useRef<Auth>(auth);
  const mediaIdRef = React.useRef<string[]>([]);

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
      if (successCount.current > 0 && finish)
        finish(planIdRef.current || plan, mediaIdRef.current);
      else if (status) status.canceled = true;
    }, 1000);
  };

  const getPlanId = () =>
    remoteIdNum('plan', planIdRef.current || plan, memory.keyMap);

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
    else {
      // offlineOnly
      const mediaRec: MediaFile = {
        type: 'mediafile',
        attributes: {
          ...data,
          versionNumber: 1,
          transcription: '',
          filesize: uploadList[n].size,
          position: 0,
          dateCreated: currentDateTime(),
          dateUpdated: currentDateTime(),
        },
      } as any;
      const planRecId = { type: 'plan', id: planIdRef.current || plan };
      if (planRecId) {
        const t = new TransformBuilder();
        await memory.update([
          ...AddRecord(t, mediaRec, user, memory),
          t.replaceRelatedRecord(mediaRec, 'plan', planRecId),
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
    } as any;
    nextUpload(
      mediaFile,
      uploadList,
      currentlyLoading,
      authRef.current,
      errorReporter,
      itemComplete
    );
  };

  const uploadMedia = async (files: File[]) => {
    if (!files || files.length === 0) {
      showMessage(t.selectFiles);
      return;
    }
    setBusy(true);
    if (createProject) planIdRef.current = await createProject(files);
    uploadFiles(files);
    successCount.current = 0;
    fileList.current = files;
    mediaIdRef.current = new Array<string>();
    authRef.current = auth;
    doUpload(0);
    onOpen(false);
  };

  const uploadCancel = () => {
    onOpen(false);
    if (status) status.canceled = true;
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

  return (
    <MediaUpload
      visible={isOpen}
      uploadType={UploadType.Media}
      multiple={multiple}
      uploadMethod={uploadMedia}
      cancelMethod={uploadCancel}
      metaData={metaData}
      ready={ready}
    />
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

export default connect(mapStateToProps, mapDispatchToProps)(Uploader);
