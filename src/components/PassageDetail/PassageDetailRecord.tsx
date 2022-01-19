import { connect } from 'react-redux';
import {
  IMediaTabStrings,
  ISharedStrings,
  IState,
  MediaFile,
} from '../../model';
import localStrings from '../../selector/localize';
import {
  Button,
  createStyles,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';
import Auth from '../../auth/Auth';
import PassageRecord from '../PassageRecord';
import { useEffect, useRef, useState } from 'react';
import {
  findRecord,
  pullPlanMedia,
  related,
  remoteIdGuid,
  remoteIdNum,
  useArtifactType,
  useFetchMediaUrl,
  useOfflnMediafileCreate,
} from '../../crud';
import { useGlobal } from 'reactn';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { passageDefaultFilename } from '../../utils/passageDefaultFilename';
import * as actions from '../../store';
import { bindActionCreators } from 'redux';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { useSnackBar } from '../../hoc/SnackBar';
import { useMediaAttach } from '../../crud/useMediaAttach';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    status: {
      marginRight: theme.spacing(2),
      alignSelf: 'center',
      display: 'block',
      gutterBottom: 'true',
    },
    unsupported: {
      color: theme.palette.secondary.light,
    },
  })
);
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
interface IRecordProps {
  mediafiles: Array<MediaFile>;
}
interface IProps extends IRecordProps, IStateProps, IDispatchProps {
  auth: Auth;
  ready?: () => boolean;
}

export function PassageDetailRecord(props: IProps) {
  const { auth, ready, t, ts } = props;
  const { uploadFiles, nextUpload, uploadError, uploadComplete, doOrbitError } =
    props;
  const { mediafiles } = props;
  const [reporter] = useGlobal('errorReporter');
  const [offline] = useGlobal('offline');
  const [plan] = useGlobal('plan');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const { createMedia } = useOfflnMediafileCreate();
  const [statusText, setStatusText] = useState('');
  const [doSave, setDoSave] = useState(false);
  const fileList = useRef<File[]>();
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const classes = useStyles();
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [mediaRec, setMediaRec] = useState<MediaFile>();
  const successCount = useRef(0);
  const mediaIdRef = useRef('');
  const { passage, mediafileId } = usePassageDetailContext();
  const { vernacularId } = useArtifactType();
  const { showMessage } = useSnackBar();
  const [attachPassage] = useMediaAttach({
    doOrbitError,
  });
  const onReady = () => {
    console.log('passage record says ready...');
    setDoSave(false);
  };

  useEffect(() => {
    console.log('mediafileId', mediafileId);
    if (mediafileId !== mediaState.urlMediaId)
      fetchMediaUrl({ id: mediafileId, auth });
    setMediaRec(findRecord(memory, 'mediafile', mediafileId) as MediaFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId]);

  useEffect(() => {
    setDefaultFileName(
      passageDefaultFilename(passage?.id, memory, vernacularId)
    );
  }, [memory, passage, vernacularId, mediafiles]);

  useEffect(() => {
    if (uploadError !== '') {
      if (uploadError.indexOf('unsupported') > 0)
        showMessage(
          <span className={classes.unsupported}>
            {t.unsupported.replace(
              '{0}',
              uploadError.substring(0, uploadError.indexOf(':unsupported'))
            )}
          </span>
        );
      else showMessage(uploadError);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [uploadError]);

  const handleSave = () => {
    setDoSave(true);
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
    }, 1000);
  };
  const itemComplete = async (n: number, success: boolean, data?: any) => {
    if (success) successCount.current += 1;
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (data?.stringId) {
      mediaIdRef.current = data?.stringId;
    } else if (success && data) {
      // offlineOnly
      var num = 1;
      if (mediaRec) {
        num = mediaRec.attributes.versionNumber + 1;
      }
      await createMedia(data, num, uploadList[n].size, passage.id);
    }
    setDoSave(false);
    setStatusText('');
    if (!offline) {
      pullPlanMedia(plan, memory, remote).then(() => {
        var mediaId =
          remoteIdGuid('mediafile', mediaIdRef.current, memory.keyMap) ||
          mediaIdRef.current;
        attachPassage(
          passage.id,
          related(passage, 'section'),
          plan,
          mediaId
        ).then(() => finishMessage());
      });
    } else {
      finishMessage();
    }
  };
  const getPlanId = () => remoteIdNum('plan', plan, memory.keyMap) || plan;
  const getArtifactTypeId = () =>
    remoteIdNum('artifacttype', vernacularId || '', memory.keyMap) ||
    vernacularId;

  const uploadMedia = async (files: File[]) => {
    uploadFiles(files);
    fileList.current = files;
    const mediaFile = {
      planId: getPlanId(),
      versionNumber: 1,
      originalFile: files[0].name,
      contentType: files[0].type,
      artifactTypeId: getArtifactTypeId(),
    } as any;
    nextUpload(mediaFile, files, 0, auth, offline, reporter, itemComplete);
  };

  return (
    <div>
      <PassageRecord
        mediaId={mediafileId}
        auth={auth}
        uploadMethod={uploadMedia}
        onReady={onReady}
        defaultFilename={defaultFilename}
        allowWave={true}
        showFilename={true}
        setCanSave={setCanSave}
        setStatusText={setStatusText}
        doSave={doSave}
      />
      <Typography variant="caption" className={classes.status}>
        {statusText}
      </Typography>
      <Button
        id="rec-save"
        className={classes.button}
        onClick={handleSave}
        variant="contained"
        color="primary"
        disabled={(ready && !ready()) || !canSave}
      >
        {ts.save}
      </Button>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  uploadError: state.upload.errmsg,
  t: localStrings(state, { layout: 'mediaTab' }),
  ts: localStrings(state, { layout: 'shared' }),
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
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};
export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(PassageDetailRecord) as any
) as any;
