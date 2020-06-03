import React, { useState, useEffect } from 'react';
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
} from '@material-ui/core';
// import CopyIcon from '@material-ui/icons/FileCopy';
import SoundIcon from '@material-ui/icons/Audiotrack';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import ViewIcon from '@material-ui/icons/RemoveRedEye';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import SnackBar from './SnackBar';
import TreeGrid from './TreeGrid';
import TranscriptionShow from './TranscriptionShow';
import Auth from '../auth/Auth';
import {
  sectionNumber,
  sectionEditorName,
  sectionTranscriberName,
  sectionCompare,
} from '../utils/section';
import { passageCompare, passageDescription } from '../utils/passage';
import {
  getMediaRec,
  getMediaEaf,
  remoteId,
  related,
  remoteIdNum,
  getMediaName,
} from '../utils';
import { DrawerWidth, HeadHeight } from '../routes/drawer';
import { TabHeight } from './PlanTabs';
import { isElectron } from '../api-variable';
import { getMediaInPlans } from '../utils/getMediaInPlans';

const ActionHeight = 52;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    bar: {
      top: `calc(${TabHeight}px + ${HeadHeight}px)`,
      left: `${DrawerWidth}px`,
      height: `${ActionHeight}px`,
      width: `calc(100% - ${DrawerWidth}px)`,
    },
    highBar: {
      top: `${HeadHeight}px`,
    },
    content: {
      paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)}px)`,
    },
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }) as any,
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
          action: '',
          parentId: '',
        });
        sectionpassages.forEach((passage: Passage) => {
          const state =
            passage.attributes && passage.attributes.state
              ? activityState.getString(passage.attributes.state)
              : '';
          rowData.push({
            id: passage.id,
            name: getReference(passage, bookData),
            state: state,
            planName: planRec.attributes.name,
            editor: '',
            transcriber: '',
            passages: '',
            action: passage.id,
            parentId: section.id,
          } as IRow);
        });
      });
  });

  return rowData as Array<IRow>;
};

interface IStateProps {
  t: ITranscriptionTabStrings;
  activityState: IActivityStateStrings;
  hasUrl: boolean;
  mediaUrl: string;
  exportFile: FileResponse;
  exportStatus: IAxiosStatus | undefined;
  allBookData: BookName[];
}

interface IDispatchProps {
  fetchMediaUrl: typeof actions.fetchMediaUrl;
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
  action?: (what: string, where: number[]) => boolean;
  auth: Auth;
  projectPlans: Plan[];
  planColumn?: boolean;
}

export function TranscriptionTab(props: IProps) {
  const {
    auth,
    activityState,
    t,
    projects,
    passages,
    sections,
    users,
    roles,
    projectPlans,
    planColumn,
    hasUrl,
    mediaUrl,
    fetchMediaUrl,
    exportProject,
    exportComplete,
    exportStatus,
    exportFile,
    allBookData,
  } = props;
  const classes = useStyles();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [busy, setBusy] = useGlobal('importexportBusy');
  const [plan, setPlan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [keyMap] = useGlobal('keyMap');
  const [offline] = useGlobal('offline');
  const [errorReporter] = useGlobal('errorReporter');
  const [message, setMessage] = useState(<></>);
  const [openExport, setOpenExport] = useState(false);
  const [data, setData] = useState(Array<IRow>());
  const [passageId, setPassageId] = useState('');
  const eafAnchor = React.useRef<HTMLAnchorElement>(null);
  const [dataUrl, setDataUrl] = useState<string | undefined>();
  const [dataName, setDataName] = useState('');
  const audAnchor = React.useRef<HTMLAnchorElement>(null);
  const [audUrl, setAudUrl] = useState<string | undefined>();
  const [audName, setAudName] = useState('');
  const exportAnchor = React.useRef<HTMLAnchorElement>(null);
  const [exportUrl, setExportUrl] = useState<string | undefined>();
  const [exportName, setExportName] = useState('');
  const [project] = useGlobal('project');
  const [user] = useGlobal('user');

  const columnDefs = [
    { name: 'name', title: t.section },
    { name: 'state', title: t.sectionstate },
    { name: 'planName', title: t.plan },
    { name: 'passages', title: t.passages },
    { name: 'transcriber', title: t.transcriber },
    { name: 'editor', title: t.editor },
    { name: 'action', title: '\u00A0' },
  ];
  const columnWidths = [
    { columnName: 'name', width: 300 },
    { columnName: 'state', width: 150 },
    { columnName: 'planName', width: 150 },
    { columnName: 'passages', width: 120 },
    { columnName: 'transcriber', width: 120 },
    { columnName: 'editor', width: 120 },
    { columnName: 'action', width: 150 },
  ];
  const [defaultHiddenColumnNames, setDefaultHiddenColumnNames] = useState<
    string[]
  >([]);
  const [filter, setFilter] = useState(false);

  const handleMessageReset = () => {
    setMessage(<></>);
  };

  const handleFilter = () => setFilter(!filter);
  const translateError = (err: IAxiosStatus): string => {
    if (err.errStatus === 401) return t.expiredToken;
    if (err.errMsg.includes('RangeError')) return t.exportTooLarge;
    return err.errMsg;
  };
  const doProjectExport = (exportType: string) => {
    setBusy(true);

    const mediaFiles = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('mediafile')
    ) as MediaFile[];
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];

    var projectplans = plans.filter((pl) => related(pl, 'project') === project);
    let media: MediaFile[] = getMediaInPlans(projectplans, mediaFiles);
    exportProject(
      exportType,
      memory,
      remoteIdNum('project', project, keyMap),
      remoteIdNum('user', user, keyMap),
      media.length,
      auth,
      errorReporter,
      t.exportingProject
    );
  };
  const handleProjectExport = () => {
    if (isElectron) setOpenExport(true);
    else doProjectExport('ptf');
  };

  const getTranscription = (passageId: string) => {
    const mediaRec = getMediaRec(passageId, memory);
    return mediaRec?.attributes?.transcription || '';
  };

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
            const transcription = getTranscription(passage.id);
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
      .catch((err) => {
        setMessage(<span>{t.cantCopy}</span>);
      });
  };

  const handleBackup = () => {
    doProjectExport('zip');
  };

  const handleSelect = (passageId: string) => () => {
    setPassageId(passageId);
  };

  const handleCloseTranscription = () => {
    setPassageId('');
  };

  const hasTranscription = (passageId: string) => {
    const mediaRec = getMediaRec(passageId, memory);
    const mediaAttr = mediaRec && mediaRec.attributes;
    const transcription =
      mediaAttr && mediaAttr.transcription ? mediaAttr.transcription : '';
    return transcription.length > 0;
  };

  const handleEaf = (passageId: string) => () => {
    const mediaRec = getMediaRec(passageId, memory);
    if (!mediaRec) return;
    const eafCode = btoa(getMediaEaf(mediaRec, memory));
    const name = getMediaName(mediaRec, memory);
    setDataUrl('data:text/xml;base64,' + eafCode);
    setDataName(name + '.eaf');
    handleAudioFn(passageId);
  };

  const handleAudio = (passageId: string) => () => handleAudioFn(passageId);
  const handleAudioFn = (passageId: string) => {
    const mediaRec = getMediaRec(passageId, memory);
    const id = remoteId('mediafile', mediaRec ? mediaRec.id : '', keyMap);
    const name = getMediaName(mediaRec, memory);
    fetchMediaUrl(id, memory, offline, auth);
    setAudName(name);
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

  useEffect(() => {
    if (dataUrl && dataName !== '') {
      if (eafAnchor && eafAnchor.current) {
        eafAnchor.current.click();
        setDataUrl(undefined);
        setDataName('');
      }
    }
  }, [dataUrl, dataName, eafAnchor]);

  useEffect(() => {
    if (exportUrl && exportName !== '') {
      if (exportAnchor && exportAnchor.current) {
        exportAnchor.current.click();
        URL.revokeObjectURL(exportUrl);
        setExportUrl(undefined);
        showMessage(t.exportProject, t.downloading.replace('{0}', exportName));
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
        showMessage(t.error, translateError(exportStatus));
        exportComplete();
        setBusy(false);
      } else {
        if (exportStatus.statusMsg) {
          showMessage('', exportStatus.statusMsg);
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
    if (audUrl && audName !== '') {
      if (audAnchor && audAnchor.current) {
        audAnchor.current.click();
        setAudUrl(undefined);
        setAudName('');
      }
    }
  }, [audUrl, audName, audAnchor]);

  useEffect(() => {
    if (audName !== '' && !audUrl) setAudUrl(mediaUrl);
  }, [hasUrl, mediaUrl, audName, audUrl]);

  useEffect(() => {
    if (planColumn) {
      if (defaultHiddenColumnNames.length > 0)
        //assume planName is only one
        setDefaultHiddenColumnNames([]);
    } else if (projectPlans.length === 1) {
      if (plan === '') {
        setPlan(projectPlans[0].id); //set the global plan
      }
      setDefaultHiddenColumnNames(['planName']);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [projectPlans, plan, planColumn]);

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

  const ActionCell = ({ value, style, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
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
      <IconButton
        id={'aud-' + value}
        key={'aud-' + value}
        aria-label={'aud-' + value}
        color="default"
        className={classes.actionIcon}
        onClick={handleAudio(value)}
      >
        <SoundIcon />
      </IconButton>
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
        const state = passRec && passRec.attributes && passRec.attributes.state;
        const media = memory.cache.query((q: QueryBuilder) =>
          q
            .findRecords('mediafile')
            .filter({ relation: 'passage', record: passRec })
        ) as MediaFile[];
        if (state !== ActivityStates.NoMedia && media.length > 0)
          return <ActionCell {...props} />;
        else return <></>;
      }
    }
    return <Table.Cell {...props} />;
  };

  const WhichExportDlg = () => {
    const doPTF = () => {
      setOpenExport(false);
      doProjectExport('ptf');
    };
    const doITF = () => {
      setOpenExport(false);
      doProjectExport('itf');
    };
    const closeNoChoice = () => {
      setOpenExport(false);
    };

    return (
      <Dialog
        open={openExport}
        onClose={closeNoChoice}
        aria-labelledby="which-export-title"
        aria-describedby="which-export-description"
      >
        <DialogTitle id="which-export-title">{t.exportType}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t.exportExplanation}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNoChoice} color="default">
            {t.cancel}
          </Button>
          <Button onClick={doPTF} color="primary">
            {t.exportPTFtype}
          </Button>
          <Button onClick={doITF} color="primary" autoFocus>
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
          className={clsx(classes.bar, { [classes.highBar]: planColumn })}
          color="default"
        >
          <div className={classes.actions}>
            {planColumn && (
              <Button
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
            {planColumn && isElectron && projects.length > 1 && (
              <Button
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

      {passageId !== '' ? (
        <TranscriptionShow
          passageId={passageId}
          visible={passageId !== ''}
          closeMethod={handleCloseTranscription}
        />
      ) : (
        <></>
      )}
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a ref={exportAnchor} href={exportUrl} download={exportName} />
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a ref={eafAnchor} href={dataUrl} download={dataName} />
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a
        ref={audAnchor}
        href={audUrl}
        download={audName}
        target="_blank"
        rel="noopener noreferrer"
      />
      <WhichExportDlg />
      <SnackBar message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'transcriptionTab' }),
  activityState: localStrings(state, { layout: 'activityState' }),
  hasUrl: state.media.loaded,
  mediaUrl: state.media.url,
  exportFile: state.importexport.exportFile,
  exportStatus: state.importexport.importexportStatus,
  allBookData: state.books.bookData,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchMediaUrl: actions.fetchMediaUrl,
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
