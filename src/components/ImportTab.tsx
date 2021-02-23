/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
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
import { WithDataProps, withData } from '../mods/react-orbitjs';
import Confirm from './AlertDialog';
import {
  Button,
  makeStyles,
  Theme,
  createStyles,
  Typography,
  LinearProgress,
  AppBar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import Auth from '../auth/Auth';
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
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { doDataChanges } from '../hoc/DataChanges';
import { HeadHeight } from '../App';
import { localUserKey, LocalKey } from '../utils';

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
    IRecordProps,
    WithDataProps {
  auth: Auth;
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
    auth,
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

  const { showMessage } = useSnackBar();
  const [changeData, setChangeData] = useState(Array<IRow>());
  const [importTitle, setImportTitle] = useState('');
  const [confirmAction, setConfirmAction] = useState('');
  const [uploadVisible, setUploadVisible] = useState(false);
  const [filter, setFilter] = useState(false);
  const [hiddenColumnNames, setHiddenColumnNames] = useState<string[]>([]);
  const { getOrganizedBy } = useOrganizedBy();
  const [projectsLoaded] = useGlobal('projectsLoaded');
  const getOfflineProject = useOfflnProjRead();
  const { handleElectronImport, getElectronImportData } = useElectronImport(
    importComplete
  );
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
  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        '& .MuiDialog-paper': {
          maxWidth: '90%',
          minWidth: '600px',
          minHeight: '80%',
        },
        '& .MuiTable-root': {
          tableLayout: 'auto',
          paddingRight: theme.spacing(1),
        },
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
      icon: {
        marginLeft: theme.spacing(1),
      },
      grow: {
        flexGrow: 1,
      },
      dialogHeader: theme.mixins.gutters({
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
      }) as any,
      progress: {
        top: `calc(${HeadHeight}px - ${theme.spacing(1)}px)`,
        zIndex: 100,
        width: '100%',
      },
    })
  );
  const classes = useStyles();

  useEffect(() => {
    const electronImport = () => {
      var importData = getElectronImportData(project || '');
      if (importData.valid) {
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
      else electronImport();
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
          auth,
          orbitError,
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
      auth,
      orbitError,
      t.importPending,
      t.importComplete
    );
  };

  const uploadCancel = () => {
    setUploadVisible(false);
    handleClose();
  };
  function tryParseJSON(jsonString: string) {
    try {
      var o = JSON.parse(jsonString);

      // Handle non-exception-throwing cases:
      // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
      // but... JSON.parse(null) returns null, and typeof null === "object",
      // so we must check for that, too. Thankfully, null is falsey, so this suffices:
      if (o && typeof o === 'object') {
        return o;
      }
    } catch (e) {}

    return false;
  }
  const translateError = (err: IAxiosStatus): string => {
    console.log(err.errMsg);
    switch (err.errStatus) {
      case 301:
        localStorage.setItem(localUserKey(LocalKey.url, memory), '/');
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
            localStorage.setItem(localUserKey(LocalKey.url, memory), '/');
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
            imported =
              t.transcription + ':' + mediafile.attributes.transcription;
            old =
              t.transcription +
              ':' +
              (c.online.data as MediaFile).attributes.transcription;
            break;
          case 'passage':
            passage = c.imported.data as Passage;
            section = sectionFromPassage(passage, true);
            if (section)
              plan = planFromSection(section, false)?.attributes.name || '';
            imported =
              t.state +
              ':' +
              localizeActivityState(passage.attributes.state, ta);
            old =
              t.state +
              ':' +
              localizeActivityState(
                (c.online.data as Passage).attributes.state,
                ta
              );
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
                          (section?.relationships?.editor
                            .data as RecordIdentity).id,
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
                  (oldsection.relationships?.transcriber
                    ?.data as RecordIdentity)?.id
              ) {
                var transcriber = section.relationships?.transcriber?.data
                  ? (memory.cache.query((q: QueryBuilder) =>
                      q.findRecord({
                        type: 'user',
                        id: remoteIdGuid(
                          'user',
                          (section?.relationships?.transcriber
                            .data as RecordIdentity).id,
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
                      (oldsection?.relationships?.transcriber
                        .data as RecordIdentity).id,
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
              auth,
              coordinator,
              fingerprint,
              projectsLoaded,
              getOfflineProject,
              errorReporter,
              user,
              setLanguage
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

  return (
    <Dialog
      className={classes.root}
      open={isOpen}
      onClose={handleClose}
      disableBackdropClick={true}
      disableEscapeKeyDown={true}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        {syncBuffer ? t.importSync : t.importProject + ' ' + (planName || '')}
      </DialogTitle>
      <DialogContent>
        <div>
          <Typography variant="h5">{importTitle}</Typography>
          <Typography variant="body1" className={classes.dialogHeader}>
            {importStatus
              ? importStatus.statusMsg +
                (importStatus.errMsg !== '' ? ': ' + importStatus.errMsg : '')
              : ''}
          </Typography>
          {changeData.length > 0 && (
            <div className={classes.actions}>
              <div className={classes.grow}>{'\u00A0'}</div>
              <Button
                key="filter"
                aria-label={t.copy}
                variant="outlined"
                color="primary"
                className={classes.button}
                onClick={handleCopy}
                title={t.copy}
              >
                {t.copy}
              </Button>
              <Button
                key="filter"
                aria-label={t.filter}
                variant="outlined"
                color="primary"
                className={classes.button}
                onClick={handleFilter}
                title={t.showHideFilter}
              >
                {t.filter}
                {filter ? (
                  <SelectAllIcon className={classes.icon} />
                ) : (
                  <FilterIcon className={classes.icon} />
                )}
              </Button>
            </div>
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
            <AppBar
              position="fixed"
              className={classes.progress}
              color="inherit"
            >
              <LinearProgress variant="indeterminate" />
            </AppBar>
          )}
          <MediaUpload
            visible={uploadVisible}
            uploadType={UploadType.ITF}
            uploadMethod={uploadITF}
            cancelMethod={uploadCancel}
          />
          {confirmAction === '' || (
            <Confirm
              text={confirmAction + '  ' + t.continue}
              yesResponse={handleActionConfirmed}
              noResponse={handleActionRefused}
            />
          )}
        </div>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button
          disabled={importStatus !== undefined}
          onClick={handleClose}
          variant="contained"
          color="primary"
        >
          {t.close}
        </Button>
      </DialogActions>
    </Dialog>
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
