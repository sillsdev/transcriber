import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import moment from 'moment';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  Passage,
  PassageSection,
  Section,
  User,
  ITranscriptionTabStrings,
  IActivityStateStrings,
  Role,
  Plan,
  MediaFile,
  ActivityStates,
} from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, IconButton } from '@material-ui/core';
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
  sectionReviewerName,
  sectionTranscriberName,
  sectionCompare,
} from '../utils/section';
import { passageCompare, passageDescription } from '../utils/passage';
import {
  updateXml,
  getMediaRec,
  getMediaLang,
  getMediaName,
  remoteId,
  related,
  remoteIdNum,
} from '../utils';
import eaf from './TranscriptionEaf';
let Encoder = require('node-html-encoder').Encoder;
let encoder = new Encoder('entity');

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }),
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
  reviewer: string;
  passages: string;
  action: string;
  parentId: string;
}
const getChildRows = (row: any, rootRows: any[]) => {
  const childRows = rootRows.filter(r => r.parentId === (row ? row.id : ''));
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
const getReference = (passage: Passage[]) => {
  if (passage.length === 0) return '';
  return passageDescription(passage[0]);
};

const getAssignments = (
  projectPlans: Plan[],
  passages: Array<Passage>,
  passageSections: Array<PassageSection>,
  sections: Array<Section>,
  users: Array<User>,
  activityState: IActivityStateStrings
) => {
  function passageSectionCompare(a: PassageSection, b: PassageSection) {
    const pa = passages.filter(p => p.id === related(a, 'passage'));
    const pb = passages.filter(p => p.id === related(b, 'passage'));
    return passageCompare(pa[0], pb[0]);
  }
  const rowData: IRow[] = [];
  projectPlans.forEach(planRec => {
    sections
      .filter(s => related(s, 'plan') === planRec.id && s.attributes)
      .sort(sectionCompare)
      .forEach(section => {
        const sectionps = passageSections
          .filter(ps => related(ps, 'section') === section.id)
          .sort(passageSectionCompare);
        rowData.push({
          id: section.id,
          name: getSection(section),
          state: '',
          planName: planRec.attributes.name,
          reviewer: sectionReviewerName(section, users),
          transcriber: sectionTranscriberName(section, users),
          passages: sectionps.length.toString(),
          action: '',
          parentId: '',
        });
        sectionps.forEach((ps: PassageSection) => {
          const passageId = related(ps, 'passage');
          const passage = passages.filter(p => p.id === passageId);
          const state =
            passage.length > 0 &&
            passage[0].attributes &&
            passage[0].attributes.state
              ? activityState.getString(passage[0].attributes.state)
              : '';
          rowData.push({
            id: passageId,
            name: getReference(passage),
            state: state,
            planName: planRec.attributes.name,
            reviewer: '',
            transcriber: '',
            passages: '',
            action: passageId,
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
  exportFile: File;
  exportStatus: IAxiosStatus;
}

interface IDispatchProps {
  fetchMediaUrl: typeof actions.fetchMediaUrl;
  exportProject: typeof actions.exportProject;
  exportComplete: typeof actions.exportComplete;
}

interface IRecordProps {
  passages: Array<Passage>;
  passageSections: Array<PassageSection>;
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
    passages,
    passageSections,
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
  } = props;
  const classes = useStyles();
  const [plan, setPlan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [keyMap] = useGlobal('keyMap');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  const [passageId, setPassageId] = useState('');
  const eafAnchor = React.useRef<HTMLAnchorElement>(null);
  const [dataUrl, setDataUrl] = useState();
  const [dataName, setDataName] = useState('');
  const audAnchor = React.useRef<HTMLAnchorElement>(null);
  const [audUrl, setAudUrl] = useState();
  const [audName, setAudName] = useState('');
  const exportAnchor = React.useRef<HTMLAnchorElement>(null);
  const [exportUrl, setExportUrl] = useState();
  const [exportName, setExportName] = useState('');
  const [project] = useGlobal('project');
  const columnDefs = [
    { name: 'name', title: t.section },
    { name: 'state', title: t.sectionstate },
    { name: 'planName', title: t.plan },
    { name: 'passages', title: t.passages },
    { name: 'transcriber', title: t.transcriber },
    { name: 'reviewer', title: t.reviewer },
    { name: 'action', title: '\u00A0' },
  ];
  const columnWidths = [
    { columnName: 'name', width: 300 },
    { columnName: 'state', width: 150 },
    { columnName: 'planName', width: 150 },
    { columnName: 'passages', width: 120 },
    { columnName: 'transcriber', width: 120 },
    { columnName: 'reviewer', width: 120 },
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

    return err.errMsg;
  };
  const handleProjectExport = () => {
    exportProject(
      remoteIdNum('project', project, keyMap),
      auth,
      'exporting project'
    );
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
    const mediaAttr = mediaRec && mediaRec.attributes;
    const transcription =
      mediaAttr && mediaAttr.transcription ? mediaAttr.transcription : '';
    const encTranscript = encoder.htmlEncode(transcription);
    const durationNum = mediaAttr && mediaAttr.duration;
    const duration = durationNum ? (durationNum * 1000).toString() : '0';
    const lang = getMediaLang(mediaRec, memory);
    const name = getMediaName(mediaRec, memory);
    const mime = mediaAttr && mediaAttr.contentType;
    const ext = /mpeg/.test(mime ? mime : '') ? '.mp3' : '.wav';
    const audioUrl = mediaAttr && mediaAttr.audioUrl;
    const audioBase = audioUrl && audioUrl.split('?')[0];
    const audioName = audioBase && audioBase.split('/').pop();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(eaf(), 'text/xml');
    updateXml('@DATE', xmlDoc, moment().format('YYYY-MM-DDTHH:MM:SSZ'));
    // updateXml("*[local-name()='ANNOTATION_VALUE']", xmlDoc, encTranscript);
    updateXml('@DEFAULT_LOCALE', xmlDoc, lang ? lang : 'en');
    updateXml('@LANGUAGE_CODE', xmlDoc, lang ? lang : 'en');
    updateXml("*[@TIME_SLOT_ID='ts2']/@TIME_VALUE", xmlDoc, duration);
    updateXml('@MEDIA_FILE', xmlDoc, audioName ? audioName : name + ext);
    updateXml('@MEDIA_URL', xmlDoc, audioName ? audioName : name + ext);
    updateXml('@MIME_TYPE', xmlDoc, mime ? mime : 'audio/*');
    const annotationValue = 'ANNOTATION_VALUE';
    const serializer = new XMLSerializer();
    const eafCode = btoa(
      serializer
        .serializeToString(xmlDoc)
        .replace(
          '<' + annotationValue + '/>',
          '<' +
            annotationValue +
            '>' +
            encTranscript +
            '</' +
            annotationValue +
            '>'
        )
    );
    setDataUrl('data:text/xml;base64,' + eafCode);
    setDataName(name + '.eaf');
    handleAudioFn(passageId);
  };

  const handleAudio = (passageId: string) => () => handleAudioFn(passageId);
  const handleAudioFn = (passageId: string) => {
    const mediaRec = getMediaRec(passageId, memory);
    const id = remoteId('mediafile', mediaRec ? mediaRec.id : '', keyMap);
    const name = getMediaName(mediaRec, memory);
    fetchMediaUrl(id, auth);
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
        console.log('ExportName: ' + exportName);
        exportAnchor.current.click();
        URL.revokeObjectURL(exportUrl);
        setExportUrl(undefined);
        showMessage(t.exportProject, exportName + ' ' + t.downloadComplete);
        setExportName('');
        exportComplete();
        console.log('out ExportName: ' + exportName);
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [exportUrl, exportName, exportAnchor]);

  useEffect(() => {
    if (exportStatus) {
      if (exportStatus.errStatus) {
        showMessage(t.exportError, translateError(exportStatus));
      } else {
        if (exportStatus.statusMsg) {
          showMessage(t.exportProject, exportStatus.statusMsg);
        }
        if (exportStatus.complete && exportName === '') {
          console.log('set export Name');
          setExportName(exportFile.name);
          console.log(exportName);
          var objectUrl = URL.createObjectURL(exportFile);
          setExportUrl(objectUrl);
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
        passageSections,
        sections,
        users,
        activityState
      )
    );
  }, [
    plan,
    projectPlans,
    passages,
    passageSections,
    sections,
    users,
    roles,
    activityState,
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
      if (row.parentId !== '') {
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

  return (
    <div id="TranscriptionTab" className={classes.container}>
      <div className={classes.paper}>
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
            >
              {t.exportProject}
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
            title={'Show/Hide filter rows'}
          >
            {t.filter}
            {filter ? (
              <SelectAllIcon className={classes.icon} />
            ) : (
              <FilterIcon className={classes.icon} />
            )}
          </Button>
        </div>
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
        />{' '}
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
      <SnackBar {...props} message={message} reset={handleMessageReset} />
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
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(TranscriptionTab) as any
) as any;
