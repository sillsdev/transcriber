import React, { useEffect, useState } from 'react';
import { IAxiosStatus } from '../store/AxiosStatus';
import {
  Project,
  IImportStrings,
  IState,
  IElectronImportStrings,
  Passage,
  MediaFile,
  Section,
  User,
  GroupMembership,
  Group,
  BookName,
  ISharedStrings,
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
} from '@material-ui/core';
import Auth from '../auth/Auth';
import localStrings from '../selector/localize';
import { bindActionCreators } from 'redux';
import { QueryBuilder, RecordIdentity } from '@orbit/data';
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
import { remoteIdNum, passageDescription, remoteIdGuid } from '../crud';
import ShapingTable from './ShapingTable';
import { isElectron } from '../api-variable';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { doDataChanges } from '../hoc/DataChanges';

interface IStateProps {
  t: IImportStrings;
  ts: ISharedStrings;
  ei: IElectronImportStrings;
  importStatus: IAxiosStatus | undefined;
  allBookData: BookName[];
}

interface IDispatchProps {
  importProjectToElectron: typeof actions.importProjectToElectron;
  importProjectFromElectron: typeof actions.importProjectFromElectron;
  importComplete: typeof actions.importComplete;
  orbitError: typeof actions.doOrbitError;
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
    ts,
    ei,
    auth,
    importComplete,
    importStatus,
    importProjectToElectron,
    importProjectFromElectron,
    orbitError,
    allBookData,
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
  const [memory] = useGlobal('memory');
  const [remote] = useGlobal('remote');
  const [fingerprint] = useGlobal('fingerprint');
  const [backup] = useGlobal('backup');
  const [project] = useGlobal('project');
  const [coordinatorActivated] = useGlobal('coordinatorActivated');
  const [errorReporter] = useGlobal('errorReporter');

  const [message, setMessage] = useState(<></>);
  const [changeData, setChangeData] = useState(Array<IRow>());
  const [importTitle, setImportTitle] = useState('');
  const [zipFile, setZipFile] = useState<AdmZip | null>(null);
  const [confirmAction, setConfirmAction] = useState('');
  const [uploadVisible, setUploadVisible] = useState(false);
  const [filter, setFilter] = useState(false);
  const [hiddenColumnNames, setHiddenColumnNames] = useState<string[]>([]);

  const handleFilter = () => setFilter(!filter);
  const columnDefs = [
    { name: 'plan', title: t.plan },
    { name: 'section', title: t.section },
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
      icon: {
        marginLeft: theme.spacing(1),
      },
      grow: {
        flexGrow: 1,
      },
    })
  );
  const classes = useStyles();

  const handleProjectImport = () => {
    setImportTitle('');
    setChangeData([]);
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
        coordinatorActivated,
        zipFile,
        importProjectToElectron,
        orbitError,
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
          coordinatorActivated,
          importData.zip,
          importProjectToElectron,
          orbitError,
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
        remoteIdNum('project', project, memory.keyMap),
        auth,
        orbitError,
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

  const getChangeData = (changeReport: string) => {
    interface IData {
      data: any;
    }
    interface IChanges {
      type: string;
      online: IData;
      imported: IData;
    }
    if (changeReport === '') return [];
    var changes = JSON.parse(changeReport);
    var data = [] as IRow[];
    if (Array.isArray(changes)) {
      changes.forEach((c: IChanges) => {
        var passage;
        var section: Section | undefined;
        var old = '';
        var imported = '';
        var other = '';
        var plan = '';
        switch (c.type) {
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
            imported = t.state + ':' + passage.attributes.state;
            old = t.state + ':' + (c.online.data as Passage).attributes.state;
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
        setImportTitle(translateError(importStatus));
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
          var changeReport = importStatus.errMsg;
          var chdata = getChangeData(changeReport);
          setChangeData(chdata);
          setImportTitle(
            chdata.length > 0 ? t.onlineChangeReport : t.importComplete
          );
          importComplete();
          if (remote)
            doDataChanges(auth, remote, memory, fingerprint, errorReporter);
          setBusy(false);
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
          </FormLabel>
        </FormControl>
        {changeData.length > 0 && (
          <div className={classes.actions}>
            <div className={classes.grow}>{'\u00A0'}</div>

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
  ts: localStrings(state, { layout: 'shared' }),
  ei: localStrings(state, { layout: 'electronImport' }),
  importStatus: state.importexport.importexportStatus,
  allBookData: state.books.bookData,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      importProjectToElectron: actions.importProjectToElectron,
      importProjectFromElectron: actions.importProjectFromElectron,
      importComplete: actions.importComplete,
      orbitError: actions.doOrbitError,
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
