import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  Passage,
  Section,
  User,
  ITranscriptionTabStrings,
  IActivityStateStrings,
  Role,
  Plan,
  MediaFile,
  ActivityStates,
  FileResponse,
  BookName,
  Project,
  ISharedStrings,
  ExportType,
} from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  AppBar,
  Menu,
  MenuItem,
  PopoverOrigin,
  useTheme,
} from '@material-ui/core';
// import CopyIcon from '@material-ui/icons/FileCopy';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import ViewIcon from '@material-ui/icons/RemoveRedEye';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import { useSnackBar } from '../hoc/SnackBar';
import TreeGrid from './TreeGrid';
import TranscriptionShow from './TranscriptionShow';
import Auth from '../auth/Auth';
import {
  related,
  sectionNumber,
  sectionEditorName,
  sectionTranscriberName,
  sectionCompare,
  passageCompare,
  passageDescription,
  getVernacularMediaRec,
  getAllMediaRecs,
  getMediaEaf,
  getMediaName,
  getMediaInPlans,
  useOrganizedBy,
  useArtifactType,
  ArtifactTypeSlug,
  useTranscription,
  usePassageState,
  VernacularTag,
} from '../crud';
import { useOfflnProjRead } from '../crud/useOfflnProjRead';
import IndexedDBSource from '@orbit/indexeddb';
import { dateOrTime } from '../utils';
import { ActionHeight, tabActions, actionBar } from './PlanTabs';
import AudioDownload from './AudioDownload';
import { SelectExportType } from '../control';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    bar: actionBar,
    highBar: {
      left: 'auto',
      top: 'auto',
      position: 'unset',
      width: '95%',
    },
    content: {
      paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)}px)`,
    },
    actions: tabActions,
    grow: {
      flexGrow: 1,
    },
    button: {
      margin: theme.spacing(1),
      color: 'primary',
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    actionIcon: {},
    actionWords: {
      fontSize: 'small',
    },
    viewIcon: {
      fontSize: 16,
    },
    link: {},
    downloadButtons: {
      display: 'flex',
      alignItems: 'center',
    },
    typeSelect: {
      paddingRight: theme.spacing(2),
    },
  })
);

interface IRow {
  id: string;
  name: string;
  state: string;
  planName: string;
  transcriber: string;
  editor: string;
  passages: string;
  updated: string;
  action: string;
  parentId: string;
}
const getChildRows = (row: any, rootRows: any[]) => {
  const childRows = rootRows.filter((r) => r.parentId === (row ? row.id : ''));
  return childRows.length ? childRows : null;
};

/* build the section name = sequence + name */
const getSection = (section: Section) => {
  const name =
    section && section.attributes && section.attributes.name
      ? section.attributes.name
      : '';
  return sectionNumber(section) + ' ' + name;
};

/* build the passage name = sequence + book + reference */
const getReference = (passage: Passage, bookData: BookName[] = []) => {
  return passageDescription(passage, bookData);
};

interface IStateProps {
  t: ITranscriptionTabStrings;
  ts: ISharedStrings;
  activityState: IActivityStateStrings;
  exportFile: FileResponse;
  exportStatus: IAxiosStatus | undefined;
  allBookData: BookName[];
}

interface IDispatchProps {
  exportProject: typeof actions.exportProject;
  exportComplete: typeof actions.exportComplete;
}

interface IRecordProps {
  projects: Array<Project>;
  passages: Array<Passage>;
  sections: Array<Section>;
  users: Array<User>;
  roles: Array<Role>;
}

interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  auth: Auth;
  projectPlans: Plan[];
  planColumn?: boolean;
  floatTop?: boolean;
}

export function TranscriptionTab(props: IProps) {
  const {
    auth,
    activityState,
    t,
    ts,
    projects,
    passages,
    sections,
    users,
    roles,
    projectPlans,
    planColumn,
    exportProject,
    exportComplete,
    exportStatus,
    exportFile,
    allBookData,
    floatTop,
  } = props;
  const classes = useStyles();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [busy, setBusy] = useGlobal('importexportBusy');
  const [plan, setPlan] = useGlobal('plan');
  const [coordinator] = useGlobal('coordinator');
  const [memory] = useGlobal('memory');
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const [offline] = useGlobal('offline');
  const [errorReporter] = useGlobal('errorReporter');
  const [lang] = useGlobal('lang');
  const { showMessage, showTitledMessage } = useSnackBar();
  const [openExport, setOpenExport] = useState(false);
  const [data, setData] = useState(Array<IRow>());
  const [passageId, setPassageId] = useState('');
  const eafAnchor = React.useRef<HTMLAnchorElement>(null);
  const [dataUrl, setDataUrl] = useState<string | undefined>();
  const [dataName, setDataName] = useState('');
  const exportAnchor = React.useRef<HTMLAnchorElement>(null);
  const [exportUrl, setExportUrl] = useState<string | undefined>();
  const [exportName, setExportName] = useState('');
  const [project] = useGlobal('project');
  const [user] = useGlobal('user');
  const [actionMenuItem, setActionMenuItem] =
    React.useState<null | HTMLElement>(null);
  const handleMenu = (e: React.MouseEvent<HTMLButtonElement>) =>
    setActionMenuItem(e.currentTarget);
  const handleClose = () => setActionMenuItem(null);
  const [anchorSpec] = useState<PopoverOrigin>({
    vertical: 'bottom',
    horizontal: 'left',
  });
  const theme = useTheme();
  const [transformSpec] = useState<PopoverOrigin>({
    vertical: -theme.spacing(5),
    horizontal: 'left',
  });
  const [enableOffsite, setEnableOffsite] = useGlobal('enableOffsite');
  const { getOrganizedBy } = useOrganizedBy();
  const [fingerprint] = useGlobal('fingerprint');
  const getOfflineProject = useOfflnProjRead();
  const [globalStore] = useGlobal();
  const { getTypeId } = useArtifactType();
  const [artifactTypes] = useState<ArtifactTypeSlug[]>([
    ArtifactTypeSlug.Vernacular,
    ArtifactTypeSlug.Retell,
    ArtifactTypeSlug.QandA,
    ArtifactTypeSlug.BackTranslation,
  ]);
  const [artifactType, setArtifactType] = useState<ArtifactTypeSlug>(
    artifactTypes[0]
  );
  const getTranscription = useTranscription(true);
  const columnDefs = [
    { name: 'name', title: getOrganizedBy(true) },
    { name: 'state', title: t.sectionstate },
    { name: 'planName', title: t.plan },
    { name: 'passages', title: t.passages },
    { name: 'transcriber', title: ts.transcriber },
    { name: 'editor', title: ts.editor },
    { name: 'action', title: '\u00A0' },
    { name: 'updated', title: t.updated },
  ];
  const columnWidths = [
    { columnName: 'name', width: 300 },
    { columnName: 'state', width: 150 },
    { columnName: 'planName', width: 150 },
    { columnName: 'passages', width: 120 },
    { columnName: 'transcriber', width: 120 },
    { columnName: 'editor', width: 120 },
    { columnName: 'updated', width: 200 },
    { columnName: 'action', width: 150 },
  ];
  const [filter, setFilter] = useState(false);
  const getPassageState = usePassageState();

  const defaultHiddenColumnNames = useMemo(
    () =>
      (planColumn ? ['planName'] : []).concat(
        projectPlans.length > 0 && projectPlans[0].attributes.flat
          ? ['passages']
          : []
      ),
    [projectPlans, planColumn]
  );

  const handleFilter = () => setFilter(!filter);
  const translateError = (err: IAxiosStatus): string => {
    if (err.errStatus === 401) return ts.expiredToken;
    if (err.errMsg.includes('RangeError')) return t.exportTooLarge;
    return err.errMsg;
  };
  const doProjectExport = (exportType: ExportType) => {
    setBusy(true);

    const mediaFiles = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('mediafile')
    ) as MediaFile[];
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];

    var projectplans = plans.filter((pl) => related(pl, 'project') === project);
    let media: MediaFile[] = getMediaInPlans(
      projectplans.map((p) => p.id),
      mediaFiles,
      VernacularTag,
      true
    );
    const attached = media
      .map((m) => related(m, 'passage'))
      .filter((p) => p && p !== '');
    if (!attached.length) {
      showMessage(t.incompletePlan);
      setBusy(false);
      return;
    }
    /* get correct count */
    const onlyTypeId = [ExportType.DBL, ExportType.BURRITO].includes(exportType)
      ? VernacularTag
      : exportType === ExportType.AUDIO
      ? getTypeId(artifactType)
      : undefined;
    const onlyLatest = onlyTypeId === VernacularTag;
    media = getMediaInPlans(
      projectplans.map((p) => p.id),
      mediaFiles,
      onlyTypeId,
      onlyLatest
    );
    exportProject(
      exportType,
      onlyTypeId,
      memory,
      backup,
      project,
      fingerprint,
      user,
      media.length,
      auth,
      errorReporter,
      t.exportingProject,
      getOfflineProject
    );
  };
  const handleProjectExport = () => {
    if (offline) setOpenExport(true);
    else doProjectExport(ExportType.PTF);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const exportId = useMemo(
    () => (artifactType ? getTypeId(artifactType) : VernacularTag),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artifactType]
  );

  const getCopy = (
    projectPlans: Plan[],
    passages: Array<Passage>,
    sections: Array<Section>,
    bookData: BookName[]
  ) => {
    const copyData: string[] = [];
    projectPlans.forEach((planRec) => {
      let planName = planColumn ? planRec?.attributes?.name : '';
      sections
        .filter((s) => related(s, 'plan') === planRec.id && s.attributes)
        .sort(sectionCompare)
        .forEach((section) => {
          const sectionpassages = passages
            .filter((ps) => related(ps, 'section') === section.id)
            .sort(passageCompare);
          let sectionHead = '-----\n' + getSection(section) + '\n';
          sectionpassages.forEach((passage: Passage) => {
            // const state = passage?.attributes?.state ||'';
            const ref = getReference(passage, bookData);
            const transcription = getTranscription(passage.id, exportId);
            if (transcription !== '') {
              if (planName && planName !== '') {
                copyData.push(`*****\n${planName}\n`);
                planName = '';
              }
              if (sectionHead !== '') {
                copyData.push(sectionHead);
                sectionHead = '';
              }
              if (ref && ref !== '') copyData.push(ref);
              copyData.push(transcription + '\n');
            }
          });
        });
    });

    return copyData;
  };

  const handleCopyPlan = () => {
    navigator.clipboard
      .writeText(
        getCopy(projectPlans, passages, sections, allBookData).join('\n')
      )
      .then(() => {
        showMessage(t.availableOnClipboard);
      })
      .catch((err) => {
        showMessage(t.cantCopy);
      });
  };

  // const handleDbl = () => {
  //   setActionMenuItem(null);
  //   setBusy(true);
  //   doProjectExport(ExportType.DBL);
  // };

  const handleBurrito = () => {
    setActionMenuItem(null);
    setBusy(true);
    doProjectExport(ExportType.BURRITO);
  };

  const handleAudioExport = () => {
    setActionMenuItem(null);
    setBusy(true);
    doProjectExport(ExportType.AUDIO);
  };

  const handleBackup = () => {
    doProjectExport(ExportType.FULLBACKUP);
  };

  const handleSelect = (passageId: string) => () => {
    setPassageId(passageId);
  };

  const handleCloseTranscription = () => {
    setPassageId('');
  };

  const hasTranscription = (passageId: string) => {
    let transcription = '';
    if (exportId === VernacularTag) {
      const mediaRec = getVernacularMediaRec(passageId, memory);
      transcription = mediaRec?.attributes?.transcription || '';
    } else {
      const transcriptions = getAllMediaRecs(passageId, memory, exportId).map(
        (m) => m.attributes?.transcription
      );
      transcription = transcriptions.join('\n');
    }
    return transcription.length > 0;
  };

  const handleEaf = (passageId: string) => () => {
    const mediaRec = getVernacularMediaRec(passageId, memory);
    if (!mediaRec) return;
    const eafCode = btoa(
      getMediaEaf(mediaRec, memory, globalStore.errorReporter)
    );
    const name = getMediaName(mediaRec, memory, globalStore.errorReporter);
    setDataUrl('data:text/xml;base64,' + eafCode);
    setDataName(name + '.eaf');
  };

  useEffect(() => {
    if (dataUrl && dataName !== '') {
      if (eafAnchor && eafAnchor.current) {
        eafAnchor.current.click();
        setDataUrl(undefined);
        setDataName('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, dataName, eafAnchor]);

  useEffect(() => {
    if (exportUrl && exportName !== '') {
      if (exportAnchor && exportAnchor.current) {
        exportAnchor.current.click();
        URL.revokeObjectURL(exportUrl);
        setExportUrl(undefined);
        showTitledMessage(
          t.exportProject,
          t.downloading.replace('{0}', exportName)
        );
        setExportName('');
        exportComplete();
        setBusy(false);
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [exportUrl, exportName, exportAnchor]);

  useEffect(() => {
    if (exportStatus) {
      if (exportStatus.errStatus) {
        showTitledMessage(t.error, translateError(exportStatus));
        exportComplete();
        setBusy(false);
      } else {
        if (!enableOffsite) setEnableOffsite(true);
        if (exportStatus.statusMsg) {
          showMessage(exportStatus.statusMsg);
        }
        if (exportStatus.complete) {
          setBusy(false);
          if (exportFile && exportName === '') {
            setExportName(exportFile.data.attributes.message);
            setExportUrl(exportFile.data.attributes.fileurl);
          }
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [exportStatus]);

  useEffect(() => {
    if (projectPlans.length === 1) {
      if (plan === '') {
        setPlan(projectPlans[0].id); //set the global plan
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPlans, plan]);

  const getAssignments = (
    projectPlans: Plan[],
    passages: Array<Passage>,
    sections: Array<Section>,
    users: Array<User>,
    activityState: IActivityStateStrings,
    bookData: BookName[]
  ) => {
    const rowData: IRow[] = [];
    projectPlans.forEach((planRec) => {
      sections
        .filter((s) => related(s, 'plan') === planRec.id && s.attributes)
        .sort(sectionCompare)
        .forEach((section) => {
          const sectionpassages = passages
            .filter((ps) => related(ps, 'section') === section.id)
            .sort(passageCompare);
          rowData.push({
            id: section.id,
            name: getSection(section),
            state: '',
            planName: planRec.attributes.name,
            editor: sectionEditorName(section, users),
            transcriber: sectionTranscriberName(section, users),
            passages: sectionpassages.length.toString(),
            updated: dateOrTime(section?.attributes?.dateUpdated, lang),
            action: '',
            parentId: '',
          });
          sectionpassages.forEach((passage: Passage) => {
            const state = activityState.getString(getPassageState(passage));
            rowData.push({
              id: passage.id,
              name: getReference(passage, bookData),
              state: state,
              planName: planRec.attributes.name,
              editor: '',
              transcriber: '',
              passages: '',
              updated: dateOrTime(passage.attributes.dateUpdated, lang),
              action: passage.id,
              parentId: section.id,
            } as IRow);
          });
        });
    });

    return rowData as Array<IRow>;
  };

  useEffect(() => {
    setData(
      getAssignments(
        projectPlans,
        passages,
        sections,
        users,
        activityState,
        allBookData
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plan,
    projectPlans,
    passages,
    sections,
    users,
    roles,
    activityState,
    allBookData,
  ]);

  interface ICell {
    value: string;
    style?: React.CSSProperties;
    mediaId: string;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
  }

  const LinkCell = ({ value, style, ...restProps }: any) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      {restProps.children.slice(0, 2)}
      <Button
        key={value}
        aria-label={value}
        color="primary"
        className={classes.link}
        onClick={handleSelect(restProps.row.id)}
      >
        {value}
        <ViewIcon className={classes.viewIcon} />
      </Button>
    </Table.Cell>
  );

  const ActionCell = ({ value, style, mediaId, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <div className={classes.downloadButtons}>
        <IconButton
          id={'eaf-' + value}
          key={'eaf-' + value}
          aria-label={'eaf-' + value}
          color="default"
          className={classes.actionWords}
          onClick={handleEaf(value)}
          disabled={!hasTranscription(value)}
        >
          {t.elan}
          <br />
          {t.export}
        </IconButton>
        <AudioDownload auth={auth} mediaId={mediaId} />
      </div>
    </Table.Cell>
  );

  const TreeCell = (props: any) => {
    const { column, row } = props;
    if (column.name === 'name' && row.parentId !== '') {
      return <LinkCell {...props} />;
    }
    return (
      <td className="MuiTableCell-root">
        <div style={{ display: 'flex' }}>{props.children}</div>
      </td>
    );
  };

  const DataCell = (props: ICell) => {
    const { column, row } = props;
    if (column.name === 'action') {
      if (row.parentId && row.parentId !== '') {
        const passRec = memory.cache.query((q: QueryBuilder) =>
          q.findRecord({ type: 'passage', id: row.id })
        ) as Passage;
        const state = getPassageState(passRec);
        const media = memory.cache.query((q: QueryBuilder) =>
          q
            .findRecords('mediafile')
            .filter({ relation: 'passage', record: passRec })
        ) as MediaFile[];
        if (state !== ActivityStates.NoMedia && media.length > 0)
          return <ActionCell {...props} mediaId={media[0].id} />;
        else return <td className="MuiTableCell-root" />;
      }
    }
    return <Table.Cell {...props} />;
  };

  const WhichExportDlg = () => {
    const doPTF = () => {
      setOpenExport(false);
      doProjectExport(ExportType.PTF);
    };
    const doITF = () => {
      setOpenExport(false);
      doProjectExport(ExportType.ITF);
    };
    const closeNoChoice = () => {
      setOpenExport(false);
    };

    return (
      <Dialog
        open={openExport}
        onClose={closeNoChoice}
        aria-labelledby="transExpDlg"
        aria-describedby="transExpDesc"
      >
        <DialogTitle id="transExpDlg">{t.exportType}</DialogTitle>
        <DialogContent>
          <DialogContentText id="transExpDesc">
            {t.exportExplanation}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button id="expCancel" onClick={closeNoChoice} color="default">
            {t.cancel}
          </Button>
          <Button id="expPtf" onClick={doPTF} color="primary">
            {t.exportPTFtype}
          </Button>
          <Button id="expItf" onClick={doITF} color="primary" autoFocus>
            {t.exportITFtype}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <div id="TranscriptionTab" className={classes.container}>
      <div className={classes.paper}>
        <AppBar
          position="fixed"
          className={clsx(classes.bar, {
            [classes.highBar]: planColumn || floatTop,
          })}
          color="default"
        >
          <div className={classes.actions}>
            {(planColumn || floatTop) && (
              <Button
                id="transExp"
                key="export"
                aria-label={t.exportProject}
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={handleProjectExport}
                title={t.exportProject}
                disabled={busy}
              >
                {t.exportProject}
              </Button>
            )}
            <Button
              id="transCopy"
              key="copy"
              aria-label={t.copyTranscriptions}
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleCopyPlan}
              title={t.copyTip}
            >
              {t.copyTranscriptions}
            </Button>
            <Button
              id="audioExport"
              key="export"
              aria-label={`audio export`}
              aria-owns={actionMenuItem ? 'action-menu' : undefined}
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleMenu}
            >
              {`Audio Export`}
            </Button>
            <Menu
              id="import-export-menu"
              anchorEl={actionMenuItem}
              open={Boolean(actionMenuItem)}
              onClose={handleClose}
              anchorOrigin={anchorSpec}
              transformOrigin={transformSpec}
            >
              <MenuItem id="zipExport" key={3} onClick={handleAudioExport}>
                {'Latest Audio'}
              </MenuItem>
              {/* <MenuItem id="dblExport" key={1} onClick={handleDbl}>
                {`Digital Bible Library`}
              </MenuItem> */}
              <MenuItem id="burritoExport" key={2} onClick={handleBurrito}>
                {`Scripture Burrito`}
              </MenuItem>
            </Menu>
            {planColumn && offline && projects.length > 1 && (
              <Button
                id="transBackup"
                key="backup"
                aria-label={t.electronBackup}
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={handleBackup}
                title={t.electronBackup}
              >
                {t.electronBackup}
              </Button>
            )}
            <div className={classes.grow}>{'\u00A0'}</div>
            <SelectExportType
              exportType={artifactType}
              exportTypes={artifactTypes}
              setExportType={setArtifactType}
            />
            <Button
              id="transFilt"
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
        </AppBar>
        <div className={classes.content}>
          <TreeGrid
            columns={columnDefs}
            columnWidths={columnWidths}
            rows={data}
            getChildRows={getChildRows}
            cellComponent={TreeCell}
            dataCell={DataCell}
            pageSizes={[]}
            tableColumnExtensions={[
              { columnName: 'passages', align: 'right' },
              { columnName: 'name', wordWrapEnabled: true },
            ]}
            groupingStateColumnExtensions={[
              { columnName: 'name', groupingEnabled: false },
              { columnName: 'passages', groupingEnabled: false },
            ]}
            sorting={[
              { columnName: 'planName', direction: 'asc' },
              { columnName: 'name', direction: 'asc' },
            ]}
            treeColumn={'name'}
            showfilters={filter}
            showgroups={filter}
            showSelection={false}
            defaultHiddenColumnNames={defaultHiddenColumnNames}
          />
        </div>
      </div>

      {passageId !== '' && (
        <TranscriptionShow
          id={passageId}
          visible={passageId !== ''}
          closeMethod={handleCloseTranscription}
          exportId={exportId}
        />
      )}
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a ref={exportAnchor} href={exportUrl} download={exportName} />
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a ref={eafAnchor} href={dataUrl} download={dataName} />
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <WhichExportDlg />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'transcriptionTab' }),
  ts: localStrings(state, { layout: 'shared' }),
  activityState: localStrings(state, { layout: 'activityState' }),
  exportFile: state.importexport.exportFile,
  exportStatus: state.importexport.importexportStatus,
  allBookData: state.books.bookData,
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

const mapRecordsToProps = {
  projects: (q: QueryBuilder) => q.findRecords('project'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(TranscriptionTab) as any
) as any;
