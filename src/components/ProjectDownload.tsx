import React from 'react';
import { useGlobal } from 'reactn';
import * as actions from '../store';
import path from 'path-browserify';
import {
  IState,
  ITranscriptionTabStrings,
  ExportType,
  Project,
  ISharedStrings,
} from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import { useSnackBar } from '../hoc/SnackBar';
import Progress from '../control/UploadProgress';
import {
  findRecord,
  offlineProjectUpdateFilesDownloaded,
  useProjectExport,
} from '../crud';
import {
  currentDateTime,
  dataPath,
  logError,
  PathType,
  Severity,
} from '../utils';
import { RecordOperation } from '@orbit/records';
import IndexedDBSource from '@orbit/indexeddb';
import { useSelector } from 'react-redux';
import { sharedSelector, transcriptionTabSelector } from '../selector';
import { useDispatch } from 'react-redux';
const ipc = (window as any)?.electron;

enum Steps {
  Prepare,
  Download,
  Import,
  Finished,
  Error,
}

interface IProps {
  open: boolean;
  projectIds: string[];
  finish: () => void;
}

export const ProjectDownload = (props: IProps) => {
  const { open, projectIds, finish } = props;
  const t: ITranscriptionTabStrings = useSelector(transcriptionTabSelector);
  const ts: ISharedStrings = useSelector(sharedSelector);
  const exportStatus = useSelector(
    (state: IState) => state.importexport.importexportStatus
  );
  const exportFile = useSelector(
    (state: IState) => state.importexport.exportFile
  );
  const dispatch = useDispatch();
  const exportComplete = () => dispatch(actions.exportComplete());
  const [errorReporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const [enableOffsite, setEnableOffsite] = useGlobal('enableOffsite');
  const [busy, setBusy] = useGlobal('importexportBusy');
  const { showMessage, showTitledMessage } = useSnackBar();
  const doProjectExport = useProjectExport({
    message: t.creatingDownloadFile,
  });
  const [progress, setProgress] = React.useState<Steps>(Steps.Prepare);
  const [steps, setSteps] = React.useState<string[]>([]);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [exportName, setExportName] = React.useState('');
  const [exportUrl, setExportUrl] = React.useState('');
  const [offlineUpdates] = React.useState<RecordOperation[]>([]);
  const backup = coordinator.getSource('backup') as IndexedDBSource;

  const translateError = (err: IAxiosStatus): string => {
    if (err.errStatus === 401) return ts.expiredToken;
    if (err.errMsg.includes('RangeError')) return t.exportTooLarge;
    return err.errMsg;
  };

  React.useEffect(() => {
    const updateLocalOnly = async () => {
      await backup.sync((t) => offlineUpdates);
      await memory.sync((t) => offlineUpdates);
    };
    if (open && projectIds.length > 0 && progress === Steps.Prepare) {
      if (currentStep < projectIds.length) {
        let newSteps = new Array<string>();
        projectIds.forEach((pId) => {
          const projRec = findRecord(memory, 'project', pId) as Project;
          if (projRec) newSteps = newSteps.concat(projRec.attributes.name);
        });
        setSteps(newSteps);
        doProjectExport(ExportType.PTF, projectIds[currentStep]);
      } else if (busy) {
        setBusy(false);
        if (offlineUpdates.length > 0) updateLocalOnly();
        setTimeout(() => {
          setExportName('');
          setExportUrl('');
          setProgress(Steps.Finished);
          finish();
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, progress, currentStep, projectIds.length]);

  React.useEffect(() => {
    if (open && exportStatus) {
      if (exportStatus.errStatus) {
        showTitledMessage(t.error, translateError(exportStatus));
        exportComplete();
        setProgress(Steps.Error);
      } else {
        if (!enableOffsite) setEnableOffsite(true);
        if (exportStatus?.statusMsg) {
          showMessage(exportStatus?.statusMsg);
        }
        if (exportStatus.complete) {
          if (exportFile) {
            setExportName(exportFile.message);
            setExportUrl(exportFile.fileURL);
            exportComplete();
            setProgress(Steps.Download);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportFile, exportStatus]);

  interface StatReply {
    received: number;
    total: number;
    error: any;
  }

  React.useEffect(() => {
    if (progress === Steps.Download) {
      const localPath = dataPath(exportName, PathType.ZIP);
      ipc?.createFolder(path.dirname(localPath)).then(() => {
        ipc
          ?.downloadLaunch(exportUrl, localPath)
          .then((token: string) => {
            const timer = setInterval(() => {
              ipc?.downloadStat(token).then((reply: string) => {
                const { received, total, error } = reply
                  ? (JSON.parse(reply) as StatReply)
                  : {
                      received: 0,
                      total: 0,
                      error: 'no downloadStat reply for ' + token,
                    };
                if (error) {
                  logError(Severity.error, errorReporter, error);
                  clearInterval(timer);
                  ipc?.downloadClose(token);
                } else if (received < total) {
                  showTitledMessage(
                    t.downloadProject,
                    t.downloading.replace(
                      '{0}',
                      `${exportName} ${Math.round((received * 100) / total)}%`
                    )
                  );
                } else {
                  clearInterval(timer);
                  ipc?.downloadClose(token);
                  setProgress(Steps.Import);
                }
              });
            }, 500);
          })
          .catch((ex: Error) => {
            logError(Severity.error, errorReporter, ex);
          })
          .finally(() => {
            URL.revokeObjectURL(exportUrl);
          });
      });
      showTitledMessage(
        t.downloadProject,
        t.downloading.replace('{0}', exportName)
      );
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [progress]);

  React.useEffect(() => {
    if (progress === Steps.Import) {
      (async () => {
        const localPath = dataPath(exportName, PathType.ZIP);
        await ipc?.zipStreamExtract(localPath, dataPath());
        offlineProjectUpdateFilesDownloaded(
          projectIds[currentStep],
          offlineUpdates,
          memory,
          currentDateTime()
        );
        setCurrentStep(currentStep + 1);
        setProgress(Steps.Prepare);
      })();
    } else if (progress === Steps.Error) {
      setCurrentStep(currentStep + 1);
      setProgress(Steps.Prepare);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [progress]);

  React.useEffect(() => {
    return () => {
      if (projectIds.length > 0) {
        exportComplete();
        setBusy(false);
        finish();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const percent = (count: number, total: number) => {
    if (!total) return 0;
    return Math.ceil((count * 100) / total);
  };

  return (
    <div>
      <Progress
        open={open}
        title={t.downloadProject}
        progress={percent(progress, Steps.Import)}
        steps={steps}
        currentStep={currentStep}
        action={() => {
          finish();
        }}
        allowCancel={false}
      />
    </div>
  );
};

export default ProjectDownload;
