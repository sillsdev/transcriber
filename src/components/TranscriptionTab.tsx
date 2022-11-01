import React, { useState, useEffect, useMemo, useContext } from 'react';
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
  OrgWorkflowStep,
} from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
} from '@mui/material';
// import CopyIcon from '@mui/icons-material/FileCopy';
import FilterIcon from '@mui/icons-material/FilterList';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ViewIcon from '@mui/icons-material/RemoveRedEye';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import {
  GrowingSpacer,
  PaddedBox,
  TabActions,
  TabAppBar,
  PriButton,
  AltButton,
} from '../control';
import { useSnackBar } from '../hoc/SnackBar';
import TreeGrid from './TreeGrid';
import TranscriptionShow from './TranscriptionShow';
import { TokenContext } from '../context/TokenProvider';
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
  usePlanType,
} from '../crud';
import { useOfflnProjRead } from '../crud/useOfflnProjRead';
import IndexedDBSource from '@orbit/indexeddb';
import { dateOrTime } from '../utils';
import AudioDownload from './AudioDownload';
import { SelectExportType, iconMargin } from '../control';
import AudioExportMenu from './AudioExportMenu';

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
  projectPlans: Plan[];
  planColumn?: boolean;
  floatTop?: boolean;
  step?: string;
  orgSteps?: OrgWorkflowStep[];
}

export function TranscriptionTab(props: IProps) {
  const {
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
    step,
    orgSteps,
  } = props;
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
  const [enableOffsite, setEnableOffsite] = useGlobal('enableOffsite');
  const { getOrganizedBy } = useOrganizedBy();
  const [fingerprint] = useGlobal('fingerprint');
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
    const onlyLatest = onlyTypeId !== undefined;
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
      token,
      errorReporter,
      t.exportingProject,
      t.noData.replace(
        '{0}',
        onlyTypeId !== undefined
          ? localizedArtifactType(artifactType)
          : t.changed
      ),
      t.offlineData,
      localizedArtifact,
      getOfflineProject,
      step,
      orgSteps
    );
  };
  const handleProjectExport = () => {
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

  const handleAudioExportMenu = (what: string) => {
    if (what === 'zip') {
      setBusy(true);
      doProjectExport(ExportType.AUDIO);
    } else if (what === 'burrito') {
      setBusy(true);
      doProjectExport(ExportType.BURRITO);
      // } else if (what === 'dbl') {
      //   setBusy(true);
      //   doProjectExport(ExportType.DBL);
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
        setPlan(projectPlans[0].id); //set the global plan
        setScripture(getPlanType(projectPlans[0].id).scripture);
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
        const latest = plan ? getMediaInPlans([plan], media, null, true) : [];
        if (state !== ActivityStates.NoMedia && latest.length > 0)
          return <ActionCell {...props} mediaId={latest[0].id} />;
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
            <AltButton
              id="transFilt"
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
          </TabActions>
        </TabAppBar>
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
              { columnName: 'name', direction: 'asc' },
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
