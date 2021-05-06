import React from 'react';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  ITranscriptionTabStrings,
  FileResponse,
  ExportType,
  Project,
  ISharedStrings,
} from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { useSnackBar } from '../hoc/SnackBar';
import Progress from '../control/UploadProgress';
import { offlineProjectUpdateFilesDownloaded, useProjecExport } from '../crud';
import { currentDateTime, dataPath, downloadFile, PathType } from '../utils';
import AdmZip from 'adm-zip';
import { Operation } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
enum Steps {
  Prepare,
  Download,
  Import,
  Finished,
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

interface IProps extends IStateProps, IDispatchProps {
  open: Boolean;
  auth: Auth;
  projectIds: string[];
  finish: () => void;
}

export const ProjectDownload = (props: IProps) => {
  const { open, projectIds, auth, t, ts, finish } = props;
  const { exportProject, exportComplete, exportStatus, exportFile } = props;
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const [enableOffsite, setEnableOffsite] = useGlobal('enableOffsite');
  const [busy, setBusy] = useGlobal('importexportBusy');
  const { showMessage, showTitledMessage } = useSnackBar();
  const doProjectExport = useProjecExport({
    auth,
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
      console.log(currentStep, projectIds);
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
        setBusy(false);
      } else {
        if (!enableOffsite) setEnableOffsite(true);
        if (exportStatus?.statusMsg) {
          showMessage(exportStatus?.statusMsg);
        }
        if (exportStatus.complete) {
          if (exportFile) {
            setExportName(exportFile.data.attributes.message);
            setExportUrl(exportFile.data.attributes.fileurl);
            exportComplete();
            setProgress(Steps.Download);
          }
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [exportStatus, progress]);

  React.useEffect(() => {
    if (progress === Steps.Download) {
      const localPath = dataPath(exportName, PathType.ZIP);
      downloadFile({ url: exportUrl, localPath })
        .then(() => {
          setProgress(Steps.Import);
        })
        .finally(() => {
          URL.revokeObjectURL(exportUrl);
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
      const localPath = dataPath(exportName, PathType.ZIP);
      // console.log(`unzipping: ${localPath}`);
      const zip = new AdmZip(localPath);
      zip.extractAllTo(dataPath(), true);
      offlineProjectUpdateFilesDownloaded(
        projectIds[currentStep],
        offlineUpdates,
        memory,
        currentDateTime()
      );
      setProgress(Steps.Prepare);
      setCurrentStep(currentStep + 1);
    } /* eslint-disable-next-line react-hooks/exhaustive-deps */
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

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
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
)(ProjectDownload) as any;
