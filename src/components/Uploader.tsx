import React from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import { IState, IMediaTabStrings, ISharedStrings } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import localStrings from '../selector/localize';
import MediaUpload, { UploadType } from './MediaUpload';
import { remoteIdNum } from '../crud';
import Auth from '../auth/Auth';

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
  setMessage: React.Dispatch<React.SetStateAction<JSX.Element>>;
  setComplete: (amount: number) => void; // 0 to 100
  finish?: (planId: string, mediaRemoteIds?: string[]) => void; // logic when upload complete
  metaData?: JSX.Element; // component embeded in dialog
  ready?: () => boolean; // if false control is disabled
  createProject?: (file: FileList) => Promise<any>;
  status: typeof statusInit;
}

export const Uploader = (props: IProps) => {
  const { auth, t, isOpen, onOpen, setMessage, status } = props;
  const { nextUpload } = props;
  const { uploadError } = props;
  const { uploadComplete, setComplete, finish } = props;
  const { uploadFiles } = props;
  const { metaData, ready } = props;
  const { createProject } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [remote] = useGlobal('remote');
  const [errorReporter] = useGlobal('errorReporter');
  const [plan] = useGlobal('plan');
  const planIdRef = React.useRef<string>();
  const successCount = React.useRef<number>(0);
  const fileList = React.useRef<FileList>();
  const authRef = React.useRef<Auth>(auth);
  const mediaIdRef = React.useRef<string[]>([]);

  const finishMessage = () => {
    setTimeout(() => {
      if (fileList.current)
        setMessage(
          <span>
            {t.uploadComplete
              .replace('{0}', successCount.current.toString())
              .replace('{1}', fileList.current.length.toString())}
          </span>
        );
      uploadComplete();
      setComplete(0);
      if (successCount.current > 0 && finish)
        finish(planIdRef.current || plan, mediaIdRef.current);
    }, 1000);
  };

  const getPlanId = () =>
    remoteIdNum('plan', planIdRef.current || plan, memory.keyMap);

  const pullPlanMedia = () => {
    const planId = getPlanId();
    if (planId !== undefined) {
      var filterrec = {
        attribute: 'plan-id',
        value: planId,
      };
      remote
        .pull((q) => q.findRecords('mediafile').filter(filterrec))
        .then((transform) => memory.sync(transform));
    }
  };

  const itemComplete = (n: number, success: boolean, data?: any) => {
    if (success) successCount.current += 1;
    if (data?.stringId) mediaIdRef.current.push(data?.stringId);
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    setComplete(Math.min((n * 100) / uploadList.length, 100));
    const next = n + 1;
    if (next < uploadList.length && !status.canceled) {
      doUpload(next);
    } else {
      finishMessage();
      pullPlanMedia();
    }
  };

  const acceptExtPat = /\.wav$|\.mp3$|\.m4a$|\.ogg$/i;

  const doUpload = (currentlyLoading: number) => {
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (acceptExtPat.test(uploadList[currentlyLoading].name)) {
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
    } else {
      setMessage(
        <span className={classes.unsupported}>
          {t.unsupported.replace('{0}', uploadList[currentlyLoading].name)}
        </span>
      );
    }
  };

  const uploadMedia = async (files: FileList) => {
    if (!files || files.length === 0) {
      setMessage(<span>{t.selectFiles}</span>);
      return;
    }
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
  };

  React.useEffect(() => {
    if (uploadError !== '') {
      setMessage(<span>{uploadError}</span>);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [uploadError]);

  return (
    <MediaUpload
      visible={isOpen}
      uploadType={UploadType.Media}
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
