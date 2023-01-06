import React from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import path from 'path-browserify';
import {
  IState,
  ITranscriptionTabStrings,
  ExportType,
  Project,
  ISharedStrings,
  FileResponse,
} from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { useSnackBar } from '../hoc/SnackBar';
import Progress from '../control/UploadProgress';
import { offlineProjectUpdateFilesDownloaded, useProjectExport } from '../crud';
import {
  currentDateTime,
  dataPath,
  logError,
  PathType,
  Severity,
} from '../utils';
import AdmZip from 'adm-zip';
import { Operation } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
const ipc = (window as any)?.electron;

enum Steps {
  Prepare,
  Download,
  Import,
  Finished,
  Error,
}

interface IStateProps {
  t: ITranscriptionTabStrings;
  ts: ISharedStrings;
  exportFile: FileResponse;
  exportStatus: IAxiosStatus | undefined;
}

interface IDispatchProps {
  exportProject: typeof actions.exportProject;
  exportComplete: typeof actions.exportComplete;
}

interface IProps {
  open: Boolean;
  projectIds: string[];
  finish: () => void;
}

export const ProjectDownload = (
  props: IProps & IStateProps & IDispatchProps
) => {
  const { open, projectIds, t, ts, finish } = props;
  const { exportProject, exportComplete, exportStatus, exportFile } = props;
  const [errorReporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const [enableOffsite, setEnableOffsite] = useGlobal('enableOffsite');
  const [busy, setBusy] = useGlobal('importexportBusy');
  const { showMessage, showTitledMessage } = useSnackBar();
  const doProjectExport = useProjectExport({
    exportProject,
    t,
    message: t.downloadingProject,
  });
  const [progress, setProgress] = React.useState<Steps>(Steps.Prepare);
  const [steps, setSteps] = React.useState<string[]>([]);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [exportName, setExportName] = React.useState('');
  const [exportUrl, setExportUrl] = React.useState('');
  const [offlineUpdates] = React.useState<Operation[]>([]);
  const backup = coordinator.getSource('backup') as IndexedDBSource;

  const translateError = (err: IAxiosStatus): string => {
    if (err.errStatus === 401) return ts.expiredToken;
    if (err.errMsg.includes('RangeError')) return t.exportTooLarge;
    return err.errMsg;
  };

  React.useEffect(() => {
    const updateLocalOnly = async () => {
      await memory.sync(
        await backup.push((t: TransformBuilder) => offlineUpdates)
      );
    };
    if (open && projectIds.length > 0 && progress === Steps.Prepare) {
      if (currentStep < projectIds.length) {
        let newSteps = new Array<string>();
        projectIds.forEach((pId) => {
          const projRec = memory.cache.query((q: QueryBuilder) =>
            q.findRecord({ type: 'project', id: pId })
          ) as Project;
          if (projRec) newSteps = newSteps.concat(projRec.attributes.name);
        });
        setSteps(newSteps);
        setProgress(Steps.Prepare);
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
                const { received, total, error } = JSON.parse(
                  reply
                ) as StatReply;
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
        const zip = (await ipc?.zipOpen(localPath)) as AdmZip;
        await ipc?.zipExtract(zip, dataPath(), true);
        await ipc?.zipClose(zip);
        offlineProjectUpdateFilesDownloaded(
          projectIds[currentStep],
          offlineUpdates,
          memory,
          currentDateTime()
        );
        setProgress(Steps.Prepare);
        setCurrentStep(currentStep + 1);
      })();
    } else if (progress === Steps.Error) {
      setProgress(Steps.Prepare);
      setCurrentStep(currentStep + 1);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [progress]);

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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'transcriptionTab' }),
  ts: localStrings(state, { layout: 'shared' }),
  exportFile: state.importexport.exportFile,
  exportStatus: state.importexport.importexportStatus,
});

const mapDispatchToProps = (dispatch: any) => ({
  ...bindActionCreators(
    {
      exportProject: actions.exportProject,
      exportComplete: actions.exportComplete,
    },
    dispatch
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectDownload as any) as any;
