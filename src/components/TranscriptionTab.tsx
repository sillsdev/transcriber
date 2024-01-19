import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useGlobal } from 'reactn';
import Memory from '@orbit/memory';
import * as actions from '../store';
import {
  IState,
  Passage,
  PassageD,
  Section,
  User,
  ITranscriptionTabStrings,
  IActivityStateStrings,
  Role,
  Plan,
  MediaFileD,
  ActivityStates,
  BookName,
  Project,
  ISharedStrings,
  ExportType,
  OrgWorkflowStep,
  VProject,
  OfflineProject,
} from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import {
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Alert,
  TextField, //mui 6 has a datepicker...upgrade this when...
} from '@mui/material';
// import CopyIcon from '@mui/icons-material/FileCopy';
import ViewIcon from '@mui/icons-material/RemoveRedEye';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import {
  GrowingSpacer,
  PaddedBox,
  TabActions,
  TabAppBar,
  PriButton,
  AltButton,
  FilterButton,
} from '../control';
import { useSnackBar } from '../hoc/SnackBar';
import TreeGrid from './TreeGrid';
import TranscriptionShow from './TranscriptionShow';
import { TokenContext } from '../context/TokenProvider';
import {
  related,
  sectionEditorName,
  sectionTranscriberName,
  sectionCompare,
  passageCompare,
  passageRefText,
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
  usePlanType,
  PassageReference,
} from '../crud';
import { useOfflnProjRead } from '../crud/useOfflnProjRead';
import IndexedDBSource from '@orbit/indexeddb';
import { dateOrTime } from '../utils';
import AudioDownload from './AudioDownload';
import { SelectExportType } from '../control';
import AudioExportMenu from './AudioExportMenu';
import moment, { Moment } from 'moment';
import { isPublishingTitle } from '../control/RefRender';
import { useOrbitData } from '../hoc/useOrbitData';
import { useSelector } from 'react-redux';
import {
  activitySelector,
  sharedSelector,
  transcriptionTabSelector,
} from '../selector';
import { useDispatch } from 'react-redux';
import { getSection } from './AudioTab/getSection';
import useSectionMap from '../utils/useSectionMap';

interface IRow {
  id: string;
  name: React.ReactNode;
  state: string;
  planName: string;
  transcriber: string;
  editor: string;
  passages: string;
  updated: string;
  action: string;
  parentId: string;
  sort: string;
}
const getChildRows = (row: any, rootRows: any[]) => {
  const childRows = rootRows.filter((r) => r.parentId === (row ? row.id : ''));
  return childRows.length ? childRows : null;
};

interface IProps {
  projectPlans: Plan[];
  planColumn?: boolean;
  floatTop?: boolean;
  step?: string;
  orgSteps?: OrgWorkflowStep[];
}

export function TranscriptionTab(props: IProps) {
  const { projectPlans, planColumn, floatTop, step, orgSteps } = props;
  const t: ITranscriptionTabStrings = useSelector(transcriptionTabSelector);
  const ts: ISharedStrings = useSelector(sharedSelector);
  const activityState = useSelector(activitySelector);
  const exportFile = useSelector(
    (state: IState) => state.importexport.exportFile
  );
  const exportStatus = useSelector(
    (state: IState) => state.importexport.importexportStatus
  );
  const allBookData = useSelector((state: IState) => state.books.bookData);
  const dispatch = useDispatch();
  const exportProject = (
    exportType: ExportType,
    artifactType: string | null | undefined,
    memory: Memory,
    backup: IndexedDBSource,
    projectid: number | string,
    userid: number | string,
    numberOfMedia: number,
    token: string | null,
    errorReporter: any, //global errorReporter
    pendingmsg: string,
    nodatamsg: string,
    writingmsg: string,
    localizedArtifact: string,
    getOfflineProject: (plan: Plan | VProject | string) => OfflineProject,
    importedDate?: Moment,
    target?: string,
    orgWorkflowSteps?: OrgWorkflowStep[]
  ) =>
    dispatch(
      actions.exportProject(
        exportType,
        artifactType,
        memory,
        backup,
        projectid,
        userid,
        numberOfMedia,
        token,
        errorReporter,
        pendingmsg,
        nodatamsg,
        writingmsg,
        localizedArtifact,
        getOfflineProject,
        importedDate,
        target,
        orgWorkflowSteps
      )
    );
  const exportComplete = () => dispatch(actions.exportComplete());
  const projects = useOrbitData<Project[]>('project');
  const passages = useOrbitData<Passage[]>('passage');
  const sections = useOrbitData<Section[]>('section');
  const users = useOrbitData<User[]>('user');
  const roles = useOrbitData<Role[]>('role');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [busy, setBusy] = useGlobal('importexportBusy');
  const [plan, setPlan] = useGlobal('plan');
  const getPlanType = usePlanType();
  const [isScripture, setScripture] = useState(false);
  const [coordinator] = useGlobal('coordinator');
  const [memory] = useGlobal('memory');
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const [offline] = useGlobal('offline');
  const [errorReporter] = useGlobal('errorReporter');
  const [lang] = useGlobal('lang');
  const token = useContext(TokenContext).state.accessToken;
  const { showMessage, showTitledMessage } = useSnackBar();
  const [openExport, setOpenExport] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [sinceDate, setSinceDate] = useState<string>('');
  const [snapshotDate, setSnapshotDate] = useState<Moment | undefined>();
  const [data, setData] = useState(Array<IRow>());
  const [alertOpen, setAlertOpen] = useState(false);
  const [passageId, setPassageId] = useState('');
  const eafAnchor = React.useRef<HTMLAnchorElement>(null);
  const [dataUrl, setDataUrl] = useState<string | undefined>();
  const [dataName, setDataName] = useState('');
  const exportAnchor = React.useRef<HTMLAnchorElement>(null);
  const [exportUrl, setExportUrl] = useState<string | undefined>();
  const [exportName, setExportName] = useState('');
  const [sectionMap] = useSectionMap();
  const [project] = useGlobal('project');
  const [user] = useGlobal('user');
  const [enableOffsite, setEnableOffsite] = useGlobal('enableOffsite');
  const { getOrganizedBy } = useOrganizedBy();
  const getOfflineProject = useOfflnProjRead();
  const [globalStore] = useGlobal();
  const { getTypeId, localizedArtifactType } = useArtifactType();
  const [artifactTypes] = useState<ArtifactTypeSlug[]>([
    ArtifactTypeSlug.Vernacular,
    ArtifactTypeSlug.Retell,
    ArtifactTypeSlug.QandA,
    ArtifactTypeSlug.WholeBackTranslation,
    ArtifactTypeSlug.PhraseBackTranslation,
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

  const localizedArtifact = useMemo(
    () =>
      artifactType === ArtifactTypeSlug.Vernacular
        ? ''
        : localizedArtifactType(artifactType),
    [artifactType, localizedArtifactType]
  );
  const flat = useMemo(
    () => projectPlans.length > 0 && projectPlans[0].attributes.flat,
    [projectPlans]
  );

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
  const doProjectExport = (exportType: ExportType, importedDate?: Moment) => {
    setBusy(true);

    const mediaFiles = memory.cache.query((q) =>
      q.findRecords('mediafile')
    ) as MediaFileD[];
    const plans = memory.cache.query((q) => q.findRecords('plan')) as Plan[];

    var projectplans = plans.filter((pl) => related(pl, 'project') === project);
    /* get correct count */
    const onlyTypeId = [ExportType.DBL, ExportType.BURRITO].includes(exportType)
      ? VernacularTag
      : [ExportType.AUDIO, ExportType.ELAN].includes(exportType)
      ? getTypeId(artifactType)
      : undefined;
    const onlyLatest = onlyTypeId !== undefined;
    let media = getMediaInPlans(
      projectplans.map((p) => p.id) as string[],
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
      user,
      media.length,
      token,
      errorReporter,
      t.creatingDownloadFile,
      t.noData.replace(
        '{0}',
        onlyTypeId !== undefined
          ? localizedArtifactType(artifactType)
          : t.changed
      ),
      t.writingDownloadFile,
      localizedArtifact,
      getOfflineProject,
      importedDate,
      step,
      orgSteps
    );
  };
  const handleProjectExport = () => {
    setAlertOpen(false);
    if (offline) setOpenExport(true);
    else doProjectExport(ExportType.PTF);
  };

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
            .sort(passageCompare) as PassageD[];
          let sectionHead =
            '-----\n' + getSection([section], sectionMap) + '\n';
          sectionpassages.forEach((passage) => {
            // const state = passage?.attributes?.state ||'';
            const ref = passageRefText(passage, bookData);
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
    var trans = getCopy(projectPlans, passages, sections, allBookData).join(
      '\n'
    );
    if (trans.length > 0)
      navigator.clipboard
        .writeText(trans)
        .then(() => {
          showMessage(t.availableOnClipboard);
        })
        .catch((err) => {
          showMessage(t.cantCopy);
        });
    else
      showMessage(t.noData.replace('{0}', localizedArtifactType(artifactType)));
  };

  const handleAudioExportMenu = (what: string | ExportType) => {
    setBusy(true);
    switch (what) {
      case ExportType.AUDIO:
      case ExportType.ELAN:
      case ExportType.BURRITO:
        //case ExportType.DBL:
        doProjectExport(what);
        break;
      default:
        setBusy(false);
        break;
    }
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
        if (process.env.REACT_APP_DEBUG !== 'true')
          exportAnchor.current.click();
        else console.log(exportUrl);
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
            setAlertOpen(exportStatus.errMsg !== '');
            setExportName(exportFile.message);
            setExportUrl(exportFile.fileURL);
          }
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [exportStatus]);

  useEffect(() => {
    if (projectPlans.length === 1) {
      if (plan === '') {
        setPlan(projectPlans[0].id as string); //set the global plan
        setScripture(getPlanType(projectPlans[0].id as string).scripture);
      } else {
        setScripture(getPlanType(plan).scripture);
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
          if (sectionpassages.length > 0) {
            rowData.push({
              id: section.id as string,
              name: getSection([section], sectionMap),
              state: '',
              planName: planRec.attributes.name,
              editor: sectionEditorName(section, users),
              transcriber: sectionTranscriberName(section, users),
              passages: sectionpassages.length.toString(),
              updated: dateOrTime(section?.attributes?.dateUpdated, lang),
              action: '',
              parentId: '',
              sort: (section.attributes.sequencenum || 0).toFixed(2).toString(),
            });
            sectionpassages.forEach((passage: Passage) => {
              const state = activityState.getString(getPassageState(passage));
              if (!isPublishingTitle(passage?.attributes?.reference, flat)) {
                rowData.push({
                  id: passage.id,
                  name: (
                    <PassageReference
                      passage={passage}
                      bookData={bookData}
                      flat={flat}
                    />
                  ),
                  state: state,
                  planName: planRec.attributes.name,
                  editor: '',
                  transcriber: '',
                  passages: '',
                  updated: dateOrTime(passage.attributes.dateUpdated, lang),
                  action: passage.id,
                  parentId: section.id,
                } as IRow);
              }
            });
          }
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
      {/* {restProps?.children?.slice(0, 2)} */}
      <Button
        key={value}
        aria-label={value}
        color="primary"
        onClick={handleSelect(restProps.row.id)}
      >
        {value}
        <ViewIcon sx={{ fontSize: '16px', ml: 1 }} />
      </Button>
    </Table.Cell>
  );

  const ActionCell = ({ value, style, mediaId, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          id={'eaf-' + value}
          key={'eaf-' + value}
          aria-label={'eaf-' + value}
          color="default"
          sx={{ fontSize: 'small' }}
          onClick={handleEaf(value)}
          disabled={!hasTranscription(value)}
        >
          {t.elan}
          <br />
          {t.export}
        </IconButton>
        <AudioDownload mediaId={mediaId} title={t.download} />
      </Box>
    </Table.Cell>
  );

  const TreeCell = (props: any) => {
    const { column, row } = props;
    if (column.name === 'name' && row.parentId !== '') {
      return <LinkCell {...props} key={`link-${row?.id}`} />;
    }
    return (
      <Table.Cell {...props}>
        <Box sx={{ display: 'flex' }}>{props.value}</Box>
      </Table.Cell>
    );
  };

  const DataCell = (props: ICell) => {
    const { column, row } = props;
    if (column.name === 'action') {
      if (row.parentId) {
        const passRec = memory.cache.query((q) =>
          q.findRecord({ type: 'passage', id: row.id })
        ) as PassageD;
        const state = getPassageState(passRec);
        const media = memory.cache.query((q) =>
          q
            .findRecords('mediafile')
            .filter({ relation: 'passage', record: passRec })
        ) as MediaFileD[];
        const latest = plan ? getMediaInPlans([plan], media, null, true) : [];
        if (state !== ActivityStates.NoMedia && latest.length > 0)
          return <ActionCell {...props} mediaId={latest[0].id as string} />;
        else return <Table.Cell {...props} value=""></Table.Cell>;
      }
    }
    return <Table.Cell {...props} />;
  };

  const WhichExportDlg = () => {
    const doPTF = () => {
      setOpenExport(false);
      doProjectExport(ExportType.PTF);
    };
    const doITF = (event: React.MouseEvent<HTMLElement>) => {
      if (event.shiftKey) {
        const op = getOfflineProject(project);
        var oldDate = moment(op.attributes.snapshotDate);
        setSnapshotDate(oldDate);
        setSinceDate(
          op.attributes.snapshotDate.substring(
            0,
            op.attributes.snapshotDate.indexOf('T')
          )
        );
        setOpenDatePicker(true);
      } else {
        setOpenExport(false);
        doProjectExport(ExportType.ITF);
      }
    };
    const doITFwDate = () => {
      const doIt = (newDate: Moment | undefined) => {
        setOpenDatePicker(false);
        setOpenExport(false);
        doProjectExport(ExportType.ITF, newDate);
      };
      var newDate = moment(sinceDate);
      if (newDate.isValid()) {
        doIt(newDate.date() !== snapshotDate?.date() ? newDate : undefined);
      } else {
        showMessage('invalid date');
      }
    };
    const closeNoChoice = () => {
      setOpenExport(false);
    };
    const handleTextChange = (e: any) => {
      setSinceDate(e.target.value);
    };
    return (
      <Dialog
        open={openExport}
        onClose={closeNoChoice}
        aria-labelledby="transExpDlg"
        aria-describedby="transExpDesc"
        disableEnforceFocus
      >
        <DialogTitle id="transExpDlg">{t.exportType}</DialogTitle>
        <DialogContent>
          <DialogContentText id="transExpDesc">
            {t.exportExplanation}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button id="expCancel" onClick={closeNoChoice} sx={{ color: 'grey' }}>
            {t.cancel}
          </Button>
          <Button id="expPtf" onClick={doPTF} color="primary">
            {t.exportPTFtype}
          </Button>
          <Button id="expItf" onClick={doITF} color="primary" autoFocus>
            {t.exportITFtype}
          </Button>
          {openDatePicker && (
            <TextField
              id="datesince"
              value={sinceDate}
              onChange={handleTextChange}
              label={t.exportSince}
              focused
              sx={{ width: '400px' }}
            />
          )}
          {openDatePicker && (
            <Button
              id="expItfGo"
              onClick={doITFwDate}
              color="primary"
              autoFocus
            >
              {t.exportSinceGo}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box id="TranscriptionTab" sx={{ display: 'flex' }}>
      <div>
        <TabAppBar
          position="fixed"
          highBar={planColumn || floatTop}
          color="default"
        >
          <TabActions>
            {(planColumn || floatTop) && (
              <AltButton
                id="transExp"
                key="export"
                aria-label={t.exportProject}
                onClick={handleProjectExport}
                title={t.exportProject}
                disabled={busy}
              >
                {t.exportProject}
              </AltButton>
            )}
            <AltButton
              id="transCopy"
              key="copy"
              aria-label={t.copyTranscriptions}
              onClick={handleCopyPlan}
              title={t.copyTip}
            >
              {t.copyTranscriptions +
                (localizedArtifact ? ' (' + localizedArtifact + ')' : '')}
            </AltButton>
            {step && (
              <AudioExportMenu
                key="audioexport"
                action={handleAudioExportMenu}
                localizedArtifact={localizedArtifact}
                isScripture={isScripture}
              />
            )}
            {planColumn && offline && projects.length > 1 && (
              <PriButton
                id="transBackup"
                key="backup"
                aria-label={t.electronBackup}
                onClick={handleBackup}
                title={t.electronBackup}
                sx={{
                  m: 1,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  justifyContent: 'flex-start',
                }}
              >
                {t.electronBackup}
              </PriButton>
            )}
            <GrowingSpacer />
            <SelectExportType
              exportType={artifactType}
              exportTypes={artifactTypes}
              setExportType={setArtifactType}
            />
            <FilterButton filter={filter} onFilter={handleFilter} />
          </TabActions>
        </TabAppBar>
        {alertOpen && (
          <Alert
            severity="warning"
            onClose={() => {
              setAlertOpen(false);
            }}
          >
            {t.offlineData}
          </Alert>
        )}
        <PaddedBox>
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
              { columnName: 'sort', direction: 'asc' },
            ]}
            treeColumn={'name'}
            showfilters={filter}
            showgroups={filter}
            showSelection={false}
            defaultHiddenColumnNames={defaultHiddenColumnNames}
            checks={[]}
          />
        </PaddedBox>
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
    </Box>
  );
}

export default TranscriptionTab;
