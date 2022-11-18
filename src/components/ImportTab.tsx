/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useContext } from 'react';
import { TokenContext } from '../context/TokenProvider';
import { errorStatus, IAxiosStatus } from '../store/AxiosStatus';
import {
  Project,
  IImportStrings,
  IState,
  Passage,
  MediaFile,
  Section,
  User,
  GroupMembership,
  Group,
  BookName,
  ISharedStrings,
  IDialog,
  VProject,
  localizeActivityState,
  IActivityStateStrings,
} from '../model';
import { withData } from 'react-orbitjs';
import Confirm from './AlertDialog';
import {
  Button,
  Typography,
  LinearProgress,
  AppBar,
  AppBarProps,
  Dialog,
  DialogProps,
  DialogTitle,
  DialogContent,
  DialogActions,
  styled,
  SxProps,
} from '@mui/material';
import localStrings from '../selector/localize';
import { bindActionCreators } from 'redux';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { QueryBuilder, RecordIdentity } from '@orbit/data';
import { connect } from 'react-redux';
import * as actions from '../store';
import MediaUpload, { UploadType } from './MediaUpload';
import { useSnackBar } from '../hoc/SnackBar';
import { useElectronImport } from '../routes/ElectronImport';
import { useGlobal } from 'reactn';
import {
  remoteIdNum,
  passageDescription,
  remoteIdGuid,
  useOrganizedBy,
  useOfflnProjRead,
  SetUserLanguage,
} from '../crud';
import ShapingTable from './ShapingTable';
import { isElectron } from '../api-variable';
import FilterIcon from '@mui/icons-material/FilterList';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import { doDataChanges } from '../hoc/DataChanges';
import { HeadHeight } from '../App';
import {
  localUserKey,
  LocalKey,
  logError,
  Severity,
  axiosError,
  tryParseJSON,
} from '../utils';
import { ActionRow, AltButton, iconMargin } from '../control';

const headerProps = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
} as SxProps;

const StyledDialog = styled(Dialog)<DialogProps>(({ theme }) => ({
  '& .MuiDialog-paper': {
    maxWidth: '90%',
    minWidth: '600px',
    minHeight: '80%',
  },
  '& .MuiTable-root': {
    tableLayout: 'auto',
    paddingRight: theme.spacing(1),
  },
}));

const ProgressBar = styled(AppBar)<AppBarProps>(({ theme }) => ({
  top: `calc(${HeadHeight}px - ${theme.spacing(1)})`,
  zIndex: 100,
  width: '100%',
}));

interface IStateProps {
  t: IImportStrings;
  ta: IActivityStateStrings;
  ts: ISharedStrings;
  importStatus: IAxiosStatus | undefined;
  allBookData: BookName[];
}

interface IDispatchProps {
  importProjectToElectron: typeof actions.importProjectToElectron;
  importProjectFromElectron: typeof actions.importProjectFromElectron;
  importSyncFromElectron: typeof actions.importSyncFromElectron;
  importComplete: typeof actions.importComplete;
  orbitError: typeof actions.doOrbitError;
  setLanguage: typeof actions.setLanguage;
}

interface IRecordProps {
  projects: Array<Project>;
}
interface IProps
  extends IStateProps,
    IDialog<VProject>,
    IDispatchProps,
    IRecordProps {
  project?: string;
  planName?: string;
  syncBuffer: Buffer | undefined;
  syncFile: string | undefined;
}
export function ImportTab(props: IProps) {
  const {
    isOpen,
    onOpen,
    project,
    planName,
    syncBuffer,
    syncFile,
    t,
    ta,
    ts,
    importComplete,
    importStatus,
    importProjectToElectron,
    importProjectFromElectron,
    importSyncFromElectron,
    orbitError,
    allBookData,
    setLanguage,
  } = props;
  interface IRow {
    plan: string;
    section: string;
    passage: string;
    other: string;
    old: string;
    imported: string;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_busy, setBusy] = useGlobal('importexportBusy');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [fingerprint] = useGlobal('fingerprint');
  const [errorReporter] = useGlobal('errorReporter');
  const [user] = useGlobal('user');
  const [isOffline] = useGlobal('offline');
  const token = useContext(TokenContext).state.accessToken;
  const { showMessage } = useSnackBar();
  const [changeData, setChangeData] = useState(Array<IRow>());
  const [importTitle, setImportTitle] = useState('');
  const [confirmAction, setConfirmAction] = useState<string | JSX.Element>('');
  const [fileName, setFileName] = useState<string>('');
  const [importProject, setImportProject] = useState<string>('');
  const [uploadVisible, setUploadVisible] = useState(false);
  const [filter, setFilter] = useState(false);
  const [hiddenColumnNames, setHiddenColumnNames] = useState<string[]>([]);
  const { getOrganizedBy } = useOrganizedBy();
  const [projectsLoaded] = useGlobal('projectsLoaded');
  const [, setDataChangeCount] = useGlobal('dataChangeCount');
  const getOfflineProject = useOfflnProjRead();
  const { handleElectronImport, getElectronImportData } =
    useElectronImport(importComplete);
  const handleFilter = () => setFilter(!filter);
  const headerRow = () =>
    t.plan +
    '\t' +
    getOrganizedBy(true) +
    '\t' +
    t.passage +
    '\t' +
    t.other +
    '\t' +
    t.old +
    '\t' +
    t.imported;
  const copyRow = (row: IRow) =>
    row.plan +
    '\t' +
    row.section +
    '\t' +
    row.passage +
    '\t' +
    row.other +
    '\t' +
    row.old +
    '\t' +
    row.imported;
  const handleCopy = () => {
    navigator.clipboard
      .writeText(
        [headerRow()].concat(changeData.map((r) => copyRow(r))).join('\n')
      )
      .catch((err) => {
        showMessage(t.copyfail);
      });
  };
  const columnDefs = [
    { name: 'plan', title: t.plan },
    { name: 'section', title: getOrganizedBy(true) },
    { name: 'passage', title: t.passage },
    { name: 'other', title: t.other },
    { name: 'old', title: t.old },
    { name: 'imported', title: t.imported },
  ];
  const columnWidths = [
    { columnName: 'plan', width: 200 },
    { columnName: 'section', width: 100 },
    { columnName: 'passage', width: 100 },
    { columnName: 'other', width: 100 },
    { columnName: 'old', width: 220 },
    { columnName: 'imported', width: 220 },
  ];
  const columnFormatting = [
    { columnName: 'old', aligh: 'left', wordWrapEnabled: true },
    { columnName: 'imported', aligh: 'left', wordWrapEnabled: true },
  ];

  useEffect(() => {
    const electronImport = () => {
      var importData = getElectronImportData(project || '');
      if (importData.valid) {
        setFileName(importData.fileName);
        setImportProject(importData.projectName);
        if (importData.warnMsg) {
          setConfirmAction(importData.warnMsg);
        } else {
          //no warning...so set confirmed
          handleActionConfirmed();
        }
      } else handleActionRefused();
    };

    setImportTitle('');
    setChangeData([]);
    if (isElectron) {
      if (syncFile && syncBuffer) uploadSyncITF(syncBuffer, syncFile);
      //or do I want isLoggedIn...or are they the same???
      //if offline they should actually get to choose between replacing the project, or uploading someone else's changes...TODO
      else if (isOffline) electronImport();
      else setUploadVisible(true); //I'm online so allow upload of ITF
    } else setUploadVisible(true);
  }, []);

  const handleActionConfirmed = () => {
    setBusy(true);
    handleElectronImport(importProjectToElectron, orbitError);
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
    setBusy(false);
    handleClose();
  };

  const uploadITF = (files: File[]) => {
    if (!files || files.length === 0) {
      showMessage(t.noFile);
    } else {
      if (project) {
        setBusy(true);
        importProjectFromElectron(
          files,
          remoteIdNum('project', project, memory.keyMap),
          token,
          errorReporter,
          t.importPending,
          t.importComplete
        );
      }
    }
    setUploadVisible(false);
  };
  const uploadSyncITF = (buffer: Buffer, fileName: string) => {
    setBusy(true);
    importSyncFromElectron(
      fileName,
      buffer,
      token,
      errorReporter,
      t.importPending,
      t.importComplete
    );
  };

  const uploadCancel = () => {
    setUploadVisible(false);
    handleClose();
  };

  const translateError = (err: IAxiosStatus): string => {
    logError(Severity.error, errorReporter, axiosError(err));
    switch (err.errStatus) {
      case 301:
        localStorage.setItem(localUserKey(LocalKey.url), '/');
        return t.projectDeleted.replace('{0}', err.errMsg);
      case 401:
        return ts.expiredToken;
      case 406:
        return t.projectNotFound.replace('{0}', err.errMsg);
      case 422:
        var json = tryParseJSON(err.errMsg);
        if (Array.isArray(json)) {
          var msg = '';
          json.forEach((fr) => {
            var thiserr = errorStatus(fr.Status, fr.Message);
            msg += translateError(thiserr) + '\n';
          });
          return msg;
        }
        return t.invalidITF + ' ' + err.errMsg;
      case 450:
        return t.invalidProject;
    }
    return err.errMsg;
  };
  const sectionFromPassage = (passage: Passage, remote: boolean) => {
    var sectionid = passage.relationships?.section?.data as RecordIdentity;
    if (sectionid) {
      return memory.cache.query((q: QueryBuilder) =>
        q.findRecord({
          type: 'section',
          id: remote
            ? remoteIdGuid('section', sectionid.id, memory.keyMap)
            : sectionid.id,
        })
      ) as Section;
    }
    return undefined;
  };

  const planFromSection = (section: Section, remote: boolean) => {
    var planid = section.relationships?.plan?.data as RecordIdentity;
    if (planid) {
      return memory.cache.query((q: QueryBuilder) =>
        q.findRecord({
          type: 'plan',
          id: remote
            ? remoteIdGuid('plan', planid.id, memory.keyMap)
            : planid.id,
        })
      ) as Section;
    }
    return undefined;
  };
  interface IData {
    data: any;
  }
  interface IChanges {
    type: string;
    online: IData;
    imported: IData;
  }
  const getChangeData = (changeReport: string | IChanges[]) => {
    if (changeReport === '') return [];
    var data = [] as IRow[];
    if (!Array.isArray(changeReport)) changeReport = tryParseJSON(changeReport);
    if (Array.isArray(changeReport)) {
      changeReport.forEach((c: IChanges) => {
        var passage;
        var section: Section | undefined;
        var old = '';
        var imported = '';
        var other = '';
        var plan = '';
        switch (c.type) {
          case 'project':
            //expecting only deleted
            var project = c.imported.data as Project;
            imported = ' ';
            old = t.projectDeleted.replace('{0}', project.attributes.name);
            localStorage.setItem(localUserKey(LocalKey.url), '/');
            break;
          case 'mediafile':
            var mediafile = c.imported.data as MediaFile;
            var passageid = mediafile.relationships?.passage
              ?.data as RecordIdentity;
            if (passageid) {
              passage = memory.cache.query((q: QueryBuilder) =>
                q.findRecord({
                  type: 'passage',
                  id: remoteIdGuid('passage', passageid.id, memory.keyMap),
                })
              ) as Passage;
              section = sectionFromPassage(passage, false);
              if (section)
                plan = planFromSection(section, false)?.attributes.name || '';
            }
            var online = c.online.data as MediaFile;
            if (
              online.attributes.transcription !==
              mediafile.attributes.transcription
            ) {
              imported =
                t.transcription + ':' + mediafile.attributes.transcription;
              old =
                t.transcription +
                ':' +
                (c.online.data as MediaFile).attributes.transcription;
            }
            if (
              online.attributes.transcriptionstate !==
              mediafile.attributes.transcriptionstate
            ) {
              imported +=
                t.state +
                ':' +
                localizeActivityState(
                  mediafile.attributes.transcriptionstate,
                  ta
                );
              old +=
                t.state +
                ':' +
                localizeActivityState(online.attributes.transcriptionstate, ta);
            }
            break;
          case 'section':
            var oldsection = c.online.data as Section;
            section = c.imported.data as Section;
            if (section) {
              plan = planFromSection(section, true)?.attributes.name || '';
              imported = '';
              old = '';
              if (
                oldsection.relationships?.editor?.data &&
                (section?.relationships?.editor?.data as RecordIdentity)?.id !==
                  (oldsection?.relationships?.editor.data as RecordIdentity).id
              ) {
                var editor = section?.relationships?.editor?.data
                  ? (memory.cache.query((q: QueryBuilder) =>
                      q.findRecord({
                        type: 'user',
                        id: remoteIdGuid(
                          'user',
                          (
                            section?.relationships?.editor
                              .data as RecordIdentity
                          ).id,
                          memory.keyMap
                        ),
                      })
                    ) as User)
                  : undefined;
                var oldeditor = memory.cache.query((q: QueryBuilder) =>
                  q.findRecord({
                    type: 'user',
                    id: remoteIdGuid(
                      'user',
                      (oldsection?.relationships?.editor.data as RecordIdentity)
                        .id,
                      memory.keyMap
                    ),
                  })
                ) as User;
                imported +=
                  ts.editor +
                  ':' +
                  (editor ? editor.attributes.name : t.unassigned) +
                  '   ';
                old += ts.editor + ':' + oldeditor?.attributes.name + '   ';
              }
              if (
                oldsection.relationships?.transcriber?.data &&
                (section.relationships?.transcriber?.data as RecordIdentity)
                  ?.id !==
                  (
                    oldsection.relationships?.transcriber
                      ?.data as RecordIdentity
                  )?.id
              ) {
                var transcriber = section.relationships?.transcriber?.data
                  ? (memory.cache.query((q: QueryBuilder) =>
                      q.findRecord({
                        type: 'user',
                        id: remoteIdGuid(
                          'user',
                          (
                            section?.relationships?.transcriber
                              .data as RecordIdentity
                          ).id,
                          memory.keyMap
                        ),
                      })
                    ) as User)
                  : undefined;
                var oldtranscriber = memory.cache.query((q: QueryBuilder) =>
                  q.findRecord({
                    type: 'user',
                    id: remoteIdGuid(
                      'user',
                      (
                        oldsection?.relationships?.transcriber
                          .data as RecordIdentity
                      ).id,
                      memory.keyMap
                    ),
                  })
                ) as User;
                imported +=
                  ts.transcriber +
                  ':' +
                  (transcriber ? transcriber.attributes.name : t.unassigned) +
                  '   ';
                old +=
                  ts.transcriber +
                  ':' +
                  oldtranscriber?.attributes.name +
                  '   ';
              } /*
              if (section.attributes.state !== oldsection.attributes.state) {
                imported += t.state + ':' + section.attributes.state;
                old += t.state + ':' + oldsection.attributes.state;
              } */
            }
            break;
          case 'user':
            var usr = c.imported.data as User;
            usr.attributes.givenName = c.imported.data.attributes['given-name'];
            usr.attributes.familyName =
              c.imported.data.attributes['family-name'];
            var olduser = c.online.data as User;
            olduser.attributes.givenName =
              c.online.data.attributes['given-name'];
            olduser.attributes.familyName =
              c.online.data.attributes['family-name'];
            other = usr.attributes.email;
            imported = '';
            old = '';
            if (usr.attributes.name !== olduser.attributes.name) {
              imported +=
                t.username.replace(' ', '_') +
                ':' +
                usr.attributes.name +
                '   ';
              old +=
                t.username.replace(' ', '_') +
                ':' +
                olduser.attributes.name +
                '   ';
            }
            if (usr.attributes.familyName !== olduser.attributes.familyName) {
              imported +=
                t.family.replace(' ', '_') +
                ':' +
                usr.attributes.familyName +
                '   ';
              old +=
                t.family.replace(' ', '_') +
                ':' +
                olduser.attributes.familyName +
                '   ';
            }
            if (usr.attributes.givenName !== olduser.attributes.givenName) {
              imported +=
                t.given.replace(' ', '_') +
                ':' +
                usr.attributes.givenName +
                '   ';
              old +=
                t.given.replace(' ', '_') +
                ':' +
                olduser.attributes.givenName +
                '   ';
            }
            if (usr.attributes.phone !== olduser.attributes.phone) {
              imported +=
                t.phone.replace(' ', '_') + ':' + usr.attributes.phone + '   ';
              old +=
                t.phone.replace(' ', '_') +
                ':' +
                olduser.attributes.phone +
                '   ';
            }
            if (usr.attributes.locale !== olduser.attributes.locale) {
              imported +=
                t.locale.replace(' ', '_') +
                ':' +
                usr.attributes.locale +
                '   ';
              old +=
                t.locale.replace(' ', '_') +
                ':' +
                olduser.attributes.locale +
                '   ';
            }
            if (usr.attributes.timezone !== olduser.attributes.timezone) {
              imported +=
                t.timezone.replace(' ', '_') +
                ':' +
                usr.attributes.timezone +
                '   ';
              old +=
                t.timezone.replace(' ', '_') +
                ':' +
                olduser.attributes.timezone +
                '   ';
            }
            break;
          case 'groupmembership':
            var gm = c.imported.data as GroupMembership;
            var group = memory.cache.query((q: QueryBuilder) =>
              q.findRecord({
                type: 'group',
                id: remoteIdGuid(
                  'group',
                  (gm?.relationships?.group.data as RecordIdentity).id,
                  memory.keyMap
                ),
              })
            ) as Group;
            other = group.attributes.name;
            imported = t.fontsize + ':' + gm.attributes.fontSize;
            old =
              t.fontsize +
              ':' +
              (c.online.data as GroupMembership).attributes.fontSize;
            break;
          default:
        }
        if (imported.length > 0)
          data.push({
            plan: plan,
            section: section
              ? section.attributes.sequencenum + ' ' + section.attributes.name
              : '',
            passage: passage ? passageDescription(passage, allBookData) : '',
            other: other,
            old: old,
            imported: imported,
          } as IRow);
      });
    }

    if (data.findIndex((r) => r.other !== '') > -1) setHiddenColumnNames([]);
    else setHiddenColumnNames(['other']);
    return data;
  };

  useEffect(() => {
    if (importStatus) {
      if (importStatus.errStatus) {
        var json = tryParseJSON(importStatus.errMsg);
        var msg: string;
        if (json) {
          msg =
            translateError(
              errorStatus(importStatus.errStatus, JSON.stringify(json.errors))
            ) + '\n';
          var chdata = getChangeData(json.report);
          setChangeData([...changeData].concat(chdata));
          msg += chdata.length > 0 ? t.onlineChangeReport : '\n';
        } else {
          msg = translateError(importStatus);
        }
        setImportTitle(msg);
        importComplete();
        setBusy(false);
      } else {
        if (importStatus.complete) {
          //import completed ok but might have message
          chdata = getChangeData(importStatus.errMsg);
          setChangeData([...changeData].concat(chdata));
          setImportTitle(
            chdata.length > 0 ? t.onlineChangeReport : t.importComplete
          );
          importComplete();
          if (remote)
            doDataChanges(
              token || '',
              coordinator,
              fingerprint,
              projectsLoaded,
              getOfflineProject,
              errorReporter,
              user,
              setLanguage,
              setDataChangeCount
            );
          else SetUserLanguage(memory, user, setLanguage);

          setBusy(false);
        }
      }
    } else {
      if (syncFile && importTitle === t.importComplete) {
        handleClose();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [importStatus]);

  const handleClose = () => {
    onOpen && onOpen(false);
  };
  const isString = (what: any) => typeof what === 'string';

  return (
    <StyledDialog
      open={isOpen}
      onClose={handleClose}
      disableEscapeKeyDown={true}
      aria-labelledby="importDlg"
      disableEnforceFocus
    >
      <DialogTitle id="importDlg">
        {syncBuffer ? t.importSync : t.importProject + ' ' + (planName || '')}
      </DialogTitle>
      <DialogContent>
        <div>
          <Typography variant="h5">{importTitle}</Typography>
          <br />
          <Typography variant="subtitle2" sx={headerProps}>
            {fileName}
          </Typography>
          <Typography variant="h4" sx={headerProps}>
            {importProject}
          </Typography>
          <br />
          <Typography variant="body1" sx={headerProps}>
            {importStatus
              ? importStatus.statusMsg +
                (importStatus.errMsg !== '' ? ': ' + importStatus.errMsg : '')
              : ''}
          </Typography>
          {changeData.length > 0 && (
            <ActionRow>
              <AltButton
                id="importCopy"
                key="copy"
                aria-label={t.copy}
                onClick={handleCopy}
                title={t.copy}
              >
                {t.copy}
              </AltButton>
              <AltButton
                id="importFilt"
                key="filter"
                aria-label={t.filter}
                onClick={handleFilter}
                title={t.showHideFilter}
              >
                {t.filter}
                {filter ? (
                  <SelectAllIcon sx={iconMargin} />
                ) : (
                  <FilterIcon sx={iconMargin} />
                )}
              </AltButton>
            </ActionRow>
          )}
          {changeData.length > 0 && (
            <ShapingTable
              columns={columnDefs}
              columnWidths={columnWidths}
              sorting={[
                { columnName: 'plan', direction: 'asc' },
                { columnName: 'section', direction: 'asc' },
              ]}
              rows={changeData}
              shaping={filter}
              hiddenColumnNames={hiddenColumnNames}
              columnFormatting={columnFormatting}
            />
          )}
          {!importStatus || (
            <ProgressBar position="fixed" color="inherit">
              <LinearProgress variant="indeterminate" />
            </ProgressBar>
          )}
          <MediaUpload
            visible={uploadVisible}
            onVisible={setUploadVisible}
            uploadType={UploadType.ITF}
            uploadMethod={uploadITF}
            cancelMethod={uploadCancel}
          />
          {confirmAction === '' || (
            <Confirm
              jsx={isString(confirmAction) ? <span></span> : confirmAction}
              text={
                (isString(confirmAction) ? confirmAction + '  ' : '') +
                t.continue
              }
              yesResponse={handleActionConfirmed}
              noResponse={handleActionRefused}
            />
          )}
        </div>
      </DialogContent>
      <DialogActions
        sx={{
          pb: 2,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
        }}
      >
        <Button
          id="importClose"
          onClick={handleClose}
          variant="contained"
          color="primary"
          disabled={importStatus !== undefined}
        >
          {t.close}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'import' }),
  ta: localStrings(state, { layout: 'activityState' }),
  ts: localStrings(state, { layout: 'shared' }),
  importStatus: state.importexport.importexportStatus,
  allBookData: state.books.bookData,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      importProjectToElectron: actions.importProjectToElectron,
      importProjectFromElectron: actions.importProjectFromElectron,
      importSyncFromElectron: actions.importSyncFromElectron,
      importComplete: actions.importComplete,
      orbitError: actions.doOrbitError,
      setLanguage: actions.setLanguage,
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
