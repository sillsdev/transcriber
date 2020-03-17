import React, { useEffect, useState } from 'react';
import { IAxiosStatus } from '../store/AxiosStatus';
import {
  Project,
  IImportStrings,
  IState,
  IElectronImportStrings,
} from '../model';
import { WithDataProps, withData } from '../mods/react-orbitjs';
import Confirm from './AlertDialog';
import {
  Button,
  makeStyles,
  Theme,
  createStyles,
  Typography,
  FormLabel,
  FormControl,
  TextareaAutosize,
} from '@material-ui/core';
import Auth from '../auth/Auth';
import localStrings from '../selector/localize';
import { bindActionCreators } from 'redux';
import { QueryBuilder } from '@orbit/data';
import { connect } from 'react-redux';
import * as actions from '../store';
import MediaUpload, { UploadType } from './MediaUpload';
import SnackBar from './SnackBar';
import {
  handleElectronImport,
  IImportData,
  getElectronImportData,
} from '../routes/ElectronImport';
import { useGlobal } from 'reactn';
import AdmZip from 'adm-zip';
import { remoteIdNum } from '../utils';

interface IStateProps {
  t: IImportStrings;
  ei: IElectronImportStrings;
  importStatus: IAxiosStatus | undefined;
}

interface IDispatchProps {
  importProjectToElectron: typeof actions.importProjectToElectron;
  importProjectFromElectron: typeof actions.importProjectFromElectron;
  importComplete: typeof actions.importComplete;
}

interface IRecordProps {
  projects: Array<Project>;
}
interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  auth: Auth;
}
export function ImportTab(props: IProps) {
  const {
    t,
    ei,
    auth,
    importComplete,
    importStatus,
    importProjectToElectron,
    importProjectFromElectron,
  } = props;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_busy, setBusy] = useGlobal('importexportBusy');
  const [memory] = useGlobal('memory');
  const [backup] = useGlobal('backup');
  const [keyMap] = useGlobal('keyMap');
  const [project] = useGlobal('project');

  const [message, setMessage] = useState(<></>);
  const [importMessage, setImportMessage] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [zipFile, setZipFile] = useState<AdmZip | null>(null);
  const [confirmAction, setConfirmAction] = useState('');
  const [uploadVisible, setUploadVisible] = useState(false);

  const isElectron = process.env.REACT_APP_MODE === 'electron';
  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        width: '100%',
      },
      container: {
        display: 'flex',
        margin: theme.spacing(4),
      },
      paper: {},
      actions: theme.mixins.gutters({
        paddingBottom: 16,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
      }) as any,
      button: {
        margin: theme.spacing(1),
        variant: 'outlined',
        color: 'primary',
      },
      label: { margin: theme.spacing(4) },
      textarea: {
        width: '100%',
        border: 'none',
        outline: 'none',
        resize: 'none',
        'background-color': 'transparent',
      },
    })
  );
  const classes = useStyles();

  const handleProjectImport = () => {
    setImportTitle('');
    setImportMessage('');
    if (isElectron) electronImport();
    else setUploadVisible(true);
  };

  const handleActionConfirmed = () => {
    if (!zipFile) {
      console.log('No zip file yet...');
      setTimeout(() => {
        handleActionConfirmed();
      }, 2000);
    } else {
      setBusy(true);
      handleElectronImport(
        memory,
        backup,
        zipFile,
        importProjectToElectron,
        ei
      );
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
    setBusy(false);
  };

  const electronImport = () => {
    var importData: IImportData = getElectronImportData(memory, ei);
    if (importData.errMsg) setMessage(<span>{importData.errMsg}</span>);
    else {
      setZipFile(importData.zip);
      if (importData.warnMsg) {
        setConfirmAction(importData.warnMsg);
      } else {
        //no warning...so set confirmed
        //zip file never got set here
        //handleActionConfirmed();
        setBusy(true);
        handleElectronImport(
          memory,
          backup,
          importData.zip,
          importProjectToElectron,
          ei
        );
      }
    }
  };
  const uploadITF = (files: FileList) => {
    if (!files || files.length === 0) {
      setMessage(<span>{t.noFile}</span>);
    } else {
      setBusy(true);
      importProjectFromElectron(
        files,
        remoteIdNum('project', project, keyMap),
        auth,
        t.importPending,
        t.importComplete
      );
    }
    setUploadVisible(false);
  };

  const uploadCancel = () => {
    setUploadVisible(false);
  };

  const showMessage = (title: string, msg: string) => {
    setMessage(
      <span>
        {title}
        <br />
        {msg}
      </span>
    );
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const translateError = (err: IAxiosStatus): string => {
    console.log(err.errMsg);
    switch (err.errStatus) {
      case 401:
        return t.expiredToken;
      case 422:
        return t.invalidITF;
      case 450:
        return t.invalidProject;
    }
    return err.errMsg;
  };

  useEffect(() => {
    if (importStatus) {
      if (importStatus.errStatus) {
        setImportTitle(translateError(importStatus));
        setImportMessage(importStatus.errMsg);
        showMessage(t.error, translateError(importStatus));
        importComplete();
        setBusy(false);
      } else {
        if (importStatus.statusMsg) {
          setImportTitle(importStatus.statusMsg);
          showMessage(t.import, importStatus.statusMsg);
        }
        if (importStatus.complete) {
          //import completed ok but might have message
          setImportTitle(
            importStatus.errMsg !== '' ? t.onlineChangeReport : t.importComplete
          );
          setImportMessage(importStatus.errMsg);
          importComplete();
          setBusy(false);
          if (isElectron) {
            backup
              .pull(q => q.findRecords())
              .then(transform => {
                memory.sync(transform).then(() => {
                  console.log('done');
                });
              })
              .catch(err => console.log('IndexedDB Pull error: ', err));
          }
        }
      }
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [importStatus]);

  return (
    <div id="ImportTab" className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          <Button
            key="import"
            aria-label={t.importProject}
            variant="contained"
            color="primary"
            className={classes.button}
            onClick={handleProjectImport}
            title={t.importProject}
          >
            {t.importProject}
          </Button>
        </div>

        <FormControl>
          <FormLabel className={classes.label}>
            <Typography variant="h5">{importTitle}</Typography>
            <TextareaAutosize
              className={classes.textarea}
              id="standard-multiline-flexible"
              value={importMessage}
            />
          </FormLabel>
        </FormControl>

        <MediaUpload
          visible={uploadVisible}
          uploadType={UploadType.ITF}
          uploadMethod={uploadITF}
          cancelMethod={uploadCancel}
        />
        {confirmAction === '' || (
          <Confirm
            text={confirmAction + '  Continue?'}
            yesResponse={handleActionConfirmed}
            noResponse={handleActionRefused}
          />
        )}
        <SnackBar message={message} reset={handleMessageReset} />
      </div>
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'import' }),
  ei: localStrings(state, { layout: 'electronImport' }),
  importStatus: state.importexport.importexportStatus,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      importProjectToElectron: actions.importProjectToElectron,
      importProjectFromElectron: actions.importProjectFromElectron,
      importComplete: actions.importComplete,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ImportTab) as any
) as any;
