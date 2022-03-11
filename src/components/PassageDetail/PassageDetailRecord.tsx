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
import { useContext, useEffect, useRef, useState } from 'react';
import { useFetchMediaUrl, VernacularTag } from '../../crud';
import { useGlobal } from 'reactn';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { passageDefaultFilename } from '../../utils/passageDefaultFilename';
import * as actions from '../../store';
import { bindActionCreators } from 'redux';
import Memory from '@orbit/memory';
import { useSnackBar } from '../../hoc/SnackBar';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder, RecordIdentity } from '@orbit/data';
import MediaRecord from '../MediaRecord';
import { UnsavedContext } from '../../context/UnsavedContext';
import Uploader from '../Uploader';
import AudacityManager from '../Workflow/AudacityManager';
import { isElectron } from '../../api-variable';
import { AudacityLogo } from '../../control';
import AddIcon from '@material-ui/icons/LibraryAddOutlined';
import BigDialog from '../../hoc/BigDialog';
import VersionDlg from '../AudioTab/VersionDlg';
import VersionsIcon from '@material-ui/icons/List';
import { PlanProvider } from '../../context/PlanContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      maxHeight: '40px',
      alignSelf: 'center',
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
const SaveWait = 500;
export function PassageDetailRecord(props: IProps) {
  const { auth, ready, ts } = props;
  const { mediafiles } = props;
  const { startSave, toolChanged, toolsChanged, saveRequested, waitForSave } =
    useContext(UnsavedContext).state;
  const [reporter] = useGlobal('errorReporter');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [statusText, setStatusText] = useState('');
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const classes = useStyles();
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const { passage, mediafileId } = usePassageDetailContext();
  const { showMessage } = useSnackBar();
  const toolId = 'RecordTool';
  const onReady = () => {};
  const [importList, setImportList] = useState<File[]>();
  const cancelled = useRef(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [audacityVisible, setAudacityVisible] = useState(false);
  const [versionVisible, setVersionVisible] = useState(false);
  const [preload, setPreload] = useState(false);

  useEffect(() => {
    toolChanged(toolId, canSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSave]);

  useEffect(() => {
    if (saveRequested(toolId)) handleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  useEffect(() => {
    if (mediafileId !== mediaState.id) fetchMediaUrl({ id: mediafileId, auth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId]);

  useEffect(() => {
    setDefaultFileName(
      passageDefaultFilename(passage?.id, memory, VernacularTag)
    );
  }, [memory, passage, mediafiles]);

  const handleSave = () => {
    startSave(toolId);
  };

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    setStatusText('');
    if (importList) {
      setImportList(undefined);
      setUploadVisible(false);
      setAudacityVisible(false);
    }
    setPreload(true);
  };

  const saveIfChanged = (cb: () => void) => {
    if (canSave) {
      startSave(toolId);
      waitForSave(() => cb(), SaveWait);
    } else cb();
  };

  //from the on screen recorder...send it off to the uploader
  const uploadMedia = async (files: File[]) => {
    setImportList(files);
    setUploadVisible(true);
  };
  const handleAudacityImport = (i: number, list: File[]) => {
    saveIfChanged(() => {
      console.log('audacity import', list);
      setImportList(list);
      setUploadVisible(true);
    });
  };

  const handleAudacityClose = () => {
    setAudacityVisible(false);
  };
  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };
  const handleUpload = () => {
    saveIfChanged(() => {
      setUploadVisible(true);
    });
  };
  const handleAudacity = () => {
    saveIfChanged(() => {
      setAudacityVisible(true);
    });
  };
  const handleVersions = () => {
    setVersionVisible(true);
  };
  const handleVerHistClose = () => {
    setVersionVisible(false);
  };

  return (
    <PlanProvider {...props}>
      <div>
        <Button
          className={classes.button}
          id="pdRecordVersions"
          onClick={handleVersions}
          title={ts.versionHistory}
        >
          <VersionsIcon />
          {ts.versionHistory}
        </Button>
        <Button
          className={classes.button}
          id="pdRecordUpload"
          onClick={handleUpload}
          title={!offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular}
        >
          <AddIcon />
          {!offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular}
        </Button>

        {isElectron && (
          <Button
            className={classes.button}
            id="pdAudacity"
            onClick={handleAudacity}
            title={ts.launchAudacity}
          >
            <AudacityLogo />
            {ts.launchAudacity}
          </Button>
        )}
        <MediaRecord
          toolId={toolId}
          mediaId={mediafileId}
          auth={auth}
          uploadMethod={uploadMedia}
          onReady={onReady}
          defaultFilename={defaultFilename}
          allowWave={true}
          showFilename={true}
          preload={preload}
          setCanSave={setCanSave}
          setStatusText={setStatusText}
          metaData={
            <>
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
            </>
          }
        />

        <Uploader
          recordAudio={false}
          auth={auth}
          importList={importList}
          isOpen={uploadVisible}
          onOpen={handleUploadVisible}
          showMessage={showMessage}
          multiple={false}
          finish={afterUpload}
          cancelled={cancelled}
          passageId={passage.id}
        />
        <AudacityManager
          item={1}
          open={audacityVisible}
          onClose={handleAudacityClose}
          passageId={{ type: 'passage', id: passage.id } as RecordIdentity}
          mediaId={mediafileId}
          onImport={handleAudacityImport}
        />
        <BigDialog
          title={ts.versionHistory}
          isOpen={versionVisible}
          onOpen={handleVerHistClose}
        >
          <VersionDlg auth={auth} passId={passage.id} />
        </BigDialog>
      </div>
    </PlanProvider>
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
