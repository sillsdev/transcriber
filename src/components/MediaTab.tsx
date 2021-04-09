import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  MediaFile,
  Passage,
  Section,
  IMediaTabStrings,
  Plan,
  BookName,
  ISharedStrings,
  IMediaActionsStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  AppBar,
  Typography,
  Radio,
  Switch,
  FormControlLabel,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import { ActionHeight, tabActions, actionBar } from './PlanTabs';
import { PlanContext } from '../context/PlanContext';
import { useSnackBar } from '../hoc/SnackBar';
import MediaActions from './MediaActions';
import MediaActions2 from './MediaActions2';
import Confirm from './AlertDialog';
import BigDialog from '../hoc/BigDialog';
import ShapingTable from './ShapingTable';
import Uploader, { statusInit } from './Uploader';
import Template from '../control/template';
import Auth from '../auth/Auth';
import moment from 'moment';

import {
  related,
  remoteId,
  passageReference,
  sectionDescription,
  getMediaInPlans,
  usePlan,
  useOrganizedBy,
  remoteIdGuid,
} from '../crud';
import { useGlobal } from 'reactn';
import {
  dateCompare,
  numCompare,
  localeDefault,
  useRemoteSave,
  refMatch,
} from '../utils';
import { HeadHeight } from '../App';
import MediaPlayer from './MediaPlayer';
import { useMediaAttach } from '../crud/useMediaAttach';
import Memory from '@orbit/memory';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    bar: actionBar,
    highBar: {
      top: `${HeadHeight}px`,
    },
    content: {
      paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)}px)`,
    },
    progress: {
      width: '100%',
    },
    actions: theme.mixins.gutters(tabActions) as any,
    grow: {
      flexGrow: 1,
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    link: {},
    unsupported: {
      color: theme.palette.secondary.light,
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
    },
    template: {
      marginBottom: theme.spacing(2),
    },
    slider: {
      marginLeft: theme.spacing(2),
      width: '80%',
    },
    cell: {
      width: '100%',
      padding: theme.spacing(1),
    },
  })
);

enum StatusL {
  No = 'N',
  Proposed = 'P',
  Yes = 'Y',
}

interface IRow {
  index: number;
  planid: string;
  passId: string;
  id: string;
  planName: string;
  playIcon: string;
  fileName: string;
  sectionId: string;
  sectionDesc: string;
  reference: string;
  duration: string;
  size: number;
  version: string;
  date: string;
  actions: typeof MediaActions;
}

interface IPRow {
  id: string;
  sectionId: string;
  sectionDesc: string;
  reference: string;
  attached: string;
  sort: string;
  book: string;
  chap: number;
  beg: number;
  end: number;
  secNum: number;
  pasNum: number;
}

// key is mediaId and value is row in pdata (passage data) table
interface IAttachMap {
  [key: string]: number;
}

interface IStateProps {
  t: IMediaTabStrings;
  tma: IMediaActionsStrings;
  ts: ISharedStrings;
  allBookData: BookName[];
}

interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}

interface IRecordProps {
  mediaFiles: Array<MediaFile>;
  passages: Array<Passage>;
  sections: Array<Section>;
}

interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  auth: Auth;
  attachTool?: boolean;
}

export function MediaTab(props: IProps) {
  const {
    t,
    tma,
    ts,
    doOrbitError,
    mediaFiles,
    passages,
    sections,
    auth,
    allBookData,
    attachTool,
  } = props;
  const classes = useStyles();
  const ctx = React.useContext(PlanContext);
  const { connected, readonly } = ctx.state;
  const [projRole] = useGlobal('projRole');
  const [plan] = useGlobal('plan');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const { getPlan } = usePlan();
  const [planRec] = useState(getPlan(plan) || ({} as Plan));
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [, setChanged] = useGlobal('changed');
  const [, saveCompleted] = useRemoteSave();
  const [urlOpen, setUrlOpen] = useGlobal('autoOpenAddMedia');
  const [isDeveloper] = useGlobal('developer');
  const { showMessage } = useSnackBar();
  const [data, setData] = useState(Array<IRow>());
  const [pdata, setPData] = useState(Array<IPRow>());
  const [attachCount, setAttachCount] = useState(0);
  const [attachVisible, setAttachVisible] = useState(attachTool);
  // const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [mcheck, setMCheck] = useState(-1);
  const [pcheck, setPCheck] = useState(-1);
  const [confirmAction, setConfirmAction] = useState('');
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));

  const columnDefs = [
    { name: 'planName', title: t.planName },
    { name: 'actions', title: t.actions },
    { name: 'fileName', title: t.fileName },
    { name: 'sectionDesc', title: organizedBy },
    {
      name: 'reference',
      title: attachVisible ? t.viewAssociations : t.reference,
    },
    { name: 'duration', title: t.duration },
    { name: 'size', title: t.size },
    { name: 'version', title: t.version },
    { name: 'date', title: t.date },
    { name: 'detach', title: '\u00A0' },
  ];
  const columnWidths = [
    { columnName: 'planName', width: 150 },
    { columnName: 'actions', width: 120 },
    { columnName: 'fileName', width: 220 },
    { columnName: 'sectionDesc', width: 150 },
    { columnName: 'reference', width: attachVisible ? 165 : 150 },
    { columnName: 'duration', width: 100 },
    { columnName: 'size', width: 100 },
    { columnName: 'version', width: 100 },
    { columnName: 'date', width: 100 },
    { columnName: 'detach', width: 120 },
  ];
  const columnFormatting = [
    { columnName: 'actions', aligh: 'center', wordWrapEnabled: false },
    { columnName: 'sectionDesc', aligh: 'left', wordWrapEnabled: true },
  ];
  const mSorting = [
    { columnName: 'planName', direction: 'asc' },
    { columnName: 'fileName', direction: 'asc' },
  ];
  const columnSorting = [
    { columnName: 'duration', compare: numCompare },
    { columnName: 'size', compare: numCompare },
    { columnName: 'version', compare: numCompare },
    { columnName: 'date', compare: dateCompare },
  ];
  const sortingEnabled = [
    { columnName: 'actions', sortingEnabled: false },
    { columnName: 'detach', sortingEnabled: false },
  ];
  const numCols = ['duration', 'size', 'version'];
  const [filter, setFilter] = useState(false);
  const mBandHead = [
    {
      title: <Typography variant="h6">{t.mediaAssociations}</Typography>,
      children: [
        { columnName: 'fileName' },
        { columnName: 'sectionDesc' },
        { columnName: 'reference' },
        { columnName: 'detach' },
      ],
    },
  ];
  const mSummaryItems = [{ columnName: 'fileName', type: 'count' }];
  const pColumnDefs = [
    { name: 'sectionDesc', title: organizedBy },
    { name: 'reference', title: t.reference },
    { name: 'attached', title: t.associated },
    { name: 'sort', title: '\u00A0' },
  ];
  const pColumnWidths = [
    { columnName: 'sectionDesc', width: 150 },
    { columnName: 'reference', width: 150 },
  ];
  const pColumnFormatting = [
    { columnName: 'sectionDesc', aligh: 'left', wordWrapEnabled: true },
    { columnName: 'reference', aligh: 'left', wordWrapEnabled: true },
  ];
  const pSorting = [{ columnName: 'sort', direction: 'asc' }];
  const pHiddenColumnNames = ['sort', 'attached'];
  const pSummaryItems = [{ columnName: 'reference', type: 'count' }];
  const [hiddenColumnNames, setHiddenColumnNames] = useState<string[]>([]);
  const [filteringEnabled, setFilteringEnabled] = useState([
    { columnName: 'actions', filteringEnabled: false },
  ]);
  const [pageSizes, setPageSizes] = useState<number[]>([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [status] = useState(statusInit);
  const [, setComplete] = useGlobal('progress');
  const [autoMatch, setAutoMatch] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [attachMap, setAttachMap] = useState<IAttachMap>({});
  const [dataAttach, setDataAttach] = useState(new Set<number>());
  const [uploadMedia, setUploadMedia] = useState<string>();
  const [attachedFilter, setAttachedFilter] = useState({
    columnName: 'attached',
    operation: 'equal',
    value: 'N',
  });
  const inProcess = React.useRef<boolean>(false);
  const [attachPassage, detachPassage] = useMediaAttach({
    ...props,
    ts,
    doOrbitError,
  });
  const [deleteFlag, setDeleteFlag] = useState(false);

  const hasPassage = (pRow: number) => {
    for (let mediaId of Object.keys(attachMap)) {
      if (attachMap[mediaId] === pRow) return true;
    }
    return false;
  };

  const handleUpload = () => {
    setUploadVisible(true);
  };

  const handleConfirmAction = (i: number) => {
    setCheck((check) => {
      return [...check, i];
    });
    setConfirmAction('Delete');
  };

  const handleDelete = (i: number) => {
    let versions = mediaFiles.filter(
      (f) =>
        related(f, 'plan') === data[i].planid &&
        f.attributes.originalFile === data[i].fileName
    );
    versions.forEach((v) => {
      memory.update((t: TransformBuilder) =>
        t.removeRecord({
          type: 'mediafile',
          id: v.id,
        })
      );
    });
    if (versions.length > 0) setDeleteFlag(true);
  };

  const handleActionConfirmed = () => {
    if (confirmAction === 'Delete') {
      check.forEach((i) => {
        handleDelete(i);
      });
      setCheck(Array<number>());
    }
    setConfirmAction('');
  };

  const handleActionRefused = () => {
    setConfirmAction('');
    setCheck(Array<number>());
  };

  const handleAutoMatch = () => setAutoMatch(!autoMatch);

  const handleAttachCancel = () => {
    setAttachVisible(false);
    setPCheck(-1);
  };

  const handleSave = async (argMap?: IAttachMap) => {
    const map = argMap || attachMap;
    inProcess.current = true;
    showMessage(t.saving);
    const handleRow = async (mediaId: string) => {
      const pRow = map[mediaId];
      await attachPassage(pdata[pRow].id, pdata[pRow].sectionId, plan, mediaId);
    };
    const total = Object.keys(map).length;
    let n = 0;
    setComplete(n);
    for (let mediaId of Object.keys(map)) {
      await handleRow(mediaId);
      n += 1;
      setComplete(Math.min((n * 100) / total, 100));
    }
    setAttachMap({});
    showMessage(t.savingComplete);
    inProcess.current = false;
    saveCompleted('');
  };

  const mediaRow = (mediaId: string) => {
    return data.reduce((m, r, j) => {
      return r.id === mediaId ? j : m;
    }, -1);
  };

  const doDetach = (mediaId: string) => {
    const mRow = mediaRow(mediaId);
    if (attachMap.hasOwnProperty(mediaId)) {
      const newMap = { ...attachMap };
      delete newMap[mediaId];
      setAttachMap(newMap);
      setChanged(true);
    } else {
      const passId = data[mRow].passId;
      if (passId && passId !== '') {
        detachPassage(passId, data[mRow].sectionId, plan, mediaId);
        setChanged(true);
      } else {
        showMessage(t.noPassageAttached.replace('{0}', data[mRow].fileName));
      }
    }
  };

  const doAttach = (mRow: number, pRow: number) => {
    if (attachMap.hasOwnProperty(data[mRow].id) || dataAttach.has(mRow)) {
      showMessage(t.fileAttached);
      return;
    }
    handleSave({ ...attachMap, [data[mRow].id]: pRow });
    setMCheck(-1);
    setPCheck(-1);
    setCheck([]);
  };

  const handleMCheck = (checks: Array<number>, visible?: boolean) => {
    if (visible || attachVisible) {
      const newCheck = checks[0] === mcheck ? checks[1] : checks[0];
      if (checks.length === 1 && pcheck >= 0) {
        doAttach(checks[0], pcheck);
        return;
      }
      setCheck([newCheck]);
      setMCheck(newCheck);
    } else {
      setCheck(checks);
    }
  };
  const handleFilter = () => setFilter(!filter);
  const handlePCheck = (checks: Array<number>) => {
    let mRow = mcheck;
    if (uploadMedia) {
      mRow = mediaRow(uploadMedia);
      setUploadMedia(undefined);
    }
    if (attachVisible && checks.length === 1 && mRow >= 0) {
      doAttach(mRow, checks[0]);
      setAttachVisible(false);
      return;
    }
    setPCheck(checks[0] === pcheck ? checks[1] : checks[0]);
  };
  const handleSelect = (id: string) => {
    if (id === playItem) setPlayItem('');
    else setPlayItem(id);
  };

  useEffect(() => {
    if (urlOpen) {
      setUploadVisible(true);
      setUrlOpen(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [urlOpen]);

  const noPlanFilt = ['duration', 'size', 'version', 'date', 'planName'];
  const noPlanNoFilt = ['planName'];
  const noPlayFilt = [
    { columnName: 'actions', filteringEnabled: false },
    { columnName: 'detach', filteringEnabled: false },
  ];
  const attachFilt = [
    { columnName: 'actions', filteringEnabled: false },
    { columnName: 'sectionDesc', filteringEnabled: false },
    { columnName: 'reference', filteringEnabled: false },
    { columnName: 'detach', filteringEnabled: false },
  ];
  const noPaging: number[] = [];
  const paging = [4, 10, 40];
  useEffect(() => {
    let newFilt = noPlayFilt;
    let newHide = attachVisible ? noPlanFilt : noPlanNoFilt;
    if (attachFilt) newFilt = attachFilt;

    const newPages =
      attachVisible && (data.length > 40 || pdata.length > 40)
        ? paging
        : noPaging;
    if (hiddenColumnNames !== newHide) setHiddenColumnNames(newHide);
    if (filteringEnabled !== newFilt) setFilteringEnabled(newFilt);
    if (pageSizes !== newPages) setPageSizes(newPages);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [plan, attachVisible]);

  const locale = localeDefault(isDeveloper);

  const getSection = (section: Section[]) => {
    if (section.length === 0) return '';
    return sectionDescription(section[0]);
  };

  const getReference = (passage: Passage[], bookData: BookName[] = []) => {
    if (passage.length === 0) return '';
    return passageReference(passage[0], bookData);
  };

  const onAttach = (checks: number[], attach: boolean) => {
    if (attach) {
      setAttachVisible(true);
      handleMCheck(checks, true);
    } else doDetach(data[checks[0]].id);
  };

  const getMedia = (
    planName: string,
    media: Array<MediaFile>,
    passages: Array<Passage>,
    sections: Array<Section>,
    playItem: string,
    allBookData: BookName[],
    attachMap: IAttachMap,
    pdata: IPRow[],
    locale: string,
    t: IMediaActionsStrings
  ) => {
    let rowData: IRow[] = [];

    let index = 0;
    media.forEach((f) => {
      const passageId = related(f, 'passage');
      const passage = passageId
        ? passages.filter((p) => p.id === passageId)
        : [];
      const sectionId = related(passage[0], 'section');
      const section = sections.filter((s) => s.id === sectionId);
      var updateddt = passageId
        ? passage[0]?.attributes?.dateUpdated || ''
        : f?.attributes?.dateUpdated || '';
      if (!updateddt.endsWith('Z')) updateddt += 'Z';
      const updated = moment(updateddt);
      const date = updated ? updated.format('YYYY-MM-DD') : '';
      const displayDate = updated ? updated.locale(locale).format('L') : '';
      const displayTime = updated ? updated.locale(locale).format('LT') : '';
      const today = moment().format('YYYY-MM-DD');
      rowData.push({
        index,
        planid: related(f, 'plan'),
        passId: passageId,
        planName,
        id: f.id,
        playIcon: playItem,
        fileName: f.attributes.originalFile,
        sectionId: sectionId,
        sectionDesc: getSection(section),
        reference: getReference(passage, allBookData),
        duration: f.attributes.duration ? f.attributes.duration.toString() : '',
        size: f.attributes.filesize,
        version: f.attributes.versionNumber
          ? f.attributes.versionNumber.toString()
          : '',
        date: date === today ? displayTime : displayDate,
      } as IRow);
      index += 1;
    });
    return rowData;
  };

  const isAttached = (p: Passage, media: MediaFile[]) => {
    return media.filter((m) => related(m, 'passage') === p.id).length > 0;
  };

  const pad = (text: number) => ('00' + text).slice(-2);

  const getPassages = (
    projectplans: Array<Plan>,
    media: MediaFile[],
    passages: Array<Passage>,
    sections: Array<Section>,
    allBookData: BookName[]
  ) => {
    const prowData: IPRow[] = [];
    projectplans.forEach((plan) => {
      const planId = plan.id;
      const selSects = sections.filter((s) => related(s, 'plan') === planId);
      selSects.forEach((section) => {
        const sectionId = section.id;
        passages
          .filter((p) => related(p, 'section') === sectionId)
          .forEach((passage) => {
            const refMat = refMatch(passage.attributes.reference);
            prowData.push({
              id: passage.id,
              sectionId: section.id,
              sectionDesc: getSection([section]),
              reference: getReference([passage], allBookData),
              attached: isAttached(passage, media) ? StatusL.Yes : StatusL.No,
              sort: `${pad(section.attributes.sequencenum)}.${pad(
                passage.attributes.sequencenum
              )}`,
              book: passage.attributes.book,
              chap: (refMat && parseInt(refMat[1])) || -1,
              beg: (refMat && refMat.length > 2 && parseInt(refMat[2])) || -1,
              end: (refMat && refMat.length > 3 && parseInt(refMat[3])) || -1,
              pasNum: passage.attributes.sequencenum,
              secNum: section.attributes.sequencenum,
            });
          });
      });
    });
    return prowData;
  };

  useEffect(() => {
    const playChange = data[0]?.playIcon !== playItem;
    const media: MediaFile[] = getMediaInPlans([planRec.id], mediaFiles);

    const newData = getMedia(
      planRec?.attributes?.name,
      media,
      passages,
      sections,
      playItem,
      allBookData,
      attachMap,
      pdata,
      locale,
      tma
    );
    const medAttach = new Set<number>();
    newData.forEach((r, i) => {
      if (r.sectionDesc !== '') medAttach.add(i);
    });
    if (
      medAttach.size !== dataAttach.size ||
      newData.length !== data.length ||
      playChange ||
      deleteFlag
    ) {
      setDataAttach(medAttach);
      setData(newData);
      setDeleteFlag(false);
    }
    const newPassData = getPassages(
      [planRec],
      media,
      passages,
      sections,
      allBookData
    );
    if (pdata.length !== newPassData.length || medAttach.size !== attachCount) {
      setPData(newPassData);
      setAttachCount(medAttach.size);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mediaFiles, passages, sections, playItem, allBookData, attachMap, pdata]);

  useEffect(() => {
    let dataChange = false;
    const newPData = pdata.map((r, i) => {
      const newRow = hasPassage(i)
        ? { ...r, attached: 'Y', isAttaching: true }
        : null;
      if (newRow) {
        dataChange = true;
        return newRow;
      }
      return { ...r };
    });
    if (dataChange) setPData(newPData);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [attachMap]);

  const afterUpload = (planId: string, mediaRemoteIds?: string[]) => {
    if (mediaRemoteIds && mediaRemoteIds.length === 1) {
      setUploadMedia(
        remoteIdGuid('mediafile', mediaRemoteIds[0], memory.keyMap) ||
          mediaRemoteIds[0]
      );
      setAttachVisible(true);
    }
  };

  const matchMap = (pat: string, terms?: string[]) => {
    if (pdata.length === 0 || data.length === 0) return;
    const rpat = new RegExp(pat);
    const newMap = { ...attachMap };
    const usedPass = new Set<number>();
    Object.keys(newMap).forEach((k) => usedPass.add(newMap[k]));
    let found = 0;
    data.forEach((dr, dn) => {
      if (dr.reference === '') {
        const m = rpat.exec(dr.fileName);
        if (m) {
          for (let i = 0; i < pdata.length; i++) {
            if (usedPass.has(i)) continue;
            const r = pdata[i];
            let fail = false;
            if (terms) {
              for (let j = 0; j < terms.length; j++) {
                const t = terms[j];
                const val = m[j + 1];
                if (t === 'SECT') {
                  if (parseInt(val) !== r.secNum) fail = true;
                } else if (t === 'PASS') {
                  if (parseInt(val) !== r.pasNum) fail = true;
                } else if (t === 'BOOK') {
                  if (val !== r.book) fail = true;
                } else if (t === 'CHAP') {
                  if (parseInt(val) !== r.chap) fail = true;
                } else if (t === 'BEG') {
                  if (parseInt(val) !== r.beg) fail = true;
                } else if (t === 'END') {
                  if (parseInt(val) !== r.end) fail = true;
                }
                if (fail) break;
              }
            }
            if (!fail) {
              newMap[dr.id] = i;
              usedPass.add(i);
              found += 1;
              break;
            }
          }
        }
      }
    });
    if (found) {
      setAttachMap(newMap);
      showMessage(t.matchAdded.replace('{0}', found.toString()));
      handleSave(newMap);
    } else {
      showMessage(t.noMatch);
    }
  };

  interface ICell {
    value: string;
    style?: React.CSSProperties;
    mediaId?: string;
    selected?: boolean;
    onToggle?: () => void;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
    children?: Array<any>;
  }

  const PlayCell = ({ value, style, row, mediaId, ...restProps }: ICell) => (
    <Table.Cell row={row} {...restProps} style={{ ...style }} value>
      <MediaActions
        t={t}
        rowIndex={row.index}
        mediaId={mediaId}
        online={connected || offlineOnly}
        readonly={readonly}
        attached={Boolean(row.passId)}
        onAttach={onAttach}
        onPlayStatus={handleSelect}
        isPlaying={mediaId !== '' && playItem === mediaId}
      />
    </Table.Cell>
  );

  const DetachCell = ({ mediaId, ...props }: ICell) => {
    const { row } = props;
    return (
      <Table.Cell {...props}>
        <MediaActions2
          t={t}
          rowIndex={row.index}
          mediaId={mediaId}
          auth={auth}
          online={connected || offlineOnly}
          readonly={readonly}
          canDelete={!readonly}
          onDelete={handleConfirmAction}
        />
      </Table.Cell>
    );
  };

  const Cell = (props: ICell) => {
    const { column, row } = props;
    if (column.name === 'actions') {
      const mediaId = remoteId('mediafile', row.id, memory.keyMap) || row.id;
      return <PlayCell {...props} mediaId={mediaId} />;
    }
    if (column.name === 'detach') {
      const mediaId = remoteId('mediafile', row.id, memory.keyMap) || row.id;
      return <DetachCell {...props} mediaId={mediaId} />;
    }
    return <Table.Cell {...props} />;
  };

  const PCell = (props: ICell) => {
    return <Table.Cell {...props} />;
  };

  const SelectCell = (props: ICell) => {
    const handleSelect = () => {
      props.onToggle && props.onToggle();
    };
    return projRole === 'admin' ? (
      <Table.Cell {...props}>
        {(!props.row.fileName || props.row.reference === '') && (
          <Radio checked={props.selected} onChange={handleSelect} />
        )}
      </Table.Cell>
    ) : (
      <Table.Cell {...props} />
    );
  };
  const handleAttachedFilterChange = (e: any) => {
    setAttachedFilter({
      columnName: 'attached',
      operation: 'equal',
      value: e.target.checked ? 'Y' : 'N',
    });
  };

  const playEnded = () => {
    setPlayItem('');
  };

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <AppBar
          position="fixed"
          className={clsx(classes.bar, {
            [classes.highBar]: false,
          })}
          color="default"
        >
          <div className={classes.actions}>
            {projRole === 'admin' && (!isOffline || offlineOnly) && (
              <>
                <Button
                  key="upload"
                  aria-label={ts.uploadMediaPlural}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  onClick={handleUpload}
                >
                  {ts.uploadMediaPlural}
                  <AddIcon className={classes.icon} />
                </Button>
                <Button
                  key={t.autoMatch}
                  aria-label={t.autoMatch}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  onClick={handleAutoMatch}
                >
                  {t.autoMatch}
                </Button>
              </>
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
          {autoMatch && (
            <div className={classes.template}>
              <Template matchMap={matchMap} />
            </div>
          )}
          <div className={classes.row}>
            <ShapingTable
              columns={columnDefs}
              columnWidths={columnWidths}
              columnFormatting={columnFormatting}
              columnSorting={columnSorting}
              sortingEnabled={sortingEnabled}
              pageSizes={pageSizes}
              filteringEnabled={filteringEnabled}
              dataCell={Cell}
              sorting={mSorting}
              numCols={numCols}
              rows={data}
              shaping={attachVisible || filter}
              hiddenColumnNames={hiddenColumnNames}
              expandedGroups={!filter ? [] : undefined} // shuts off toolbar row
              bandHeader={attachVisible ? mBandHead : null}
              summaryItems={mSummaryItems}
            />
            <BigDialog
              title={'Choose Passage'}
              isOpen={attachVisible || false}
              onOpen={setAttachVisible}
              onCancel={handleAttachCancel}
            >
              <span>
                <FormControlLabel
                  value="attached"
                  labelPlacement="end"
                  control={
                    <Switch
                      checked={attachedFilter.value === 'Y'}
                      onChange={handleAttachedFilterChange}
                    />
                  }
                  label={t.alreadyAssociated}
                />
                <ShapingTable
                  columns={pColumnDefs}
                  columnWidths={pColumnWidths}
                  columnFormatting={pColumnFormatting}
                  filters={[attachedFilter]}
                  dataCell={PCell}
                  sorting={pSorting}
                  pageSizes={pageSizes}
                  rows={pdata}
                  select={handlePCheck}
                  selectCell={SelectCell}
                  checks={pcheck >= 0 ? [pcheck] : []}
                  shaping={true}
                  hiddenColumnNames={pHiddenColumnNames}
                  expandedGroups={[]} // shuts off toolbar row
                  summaryItems={pSummaryItems}
                />
              </span>
            </BigDialog>
          </div>
        </div>
      </div>
      <Uploader
        recordAudio={false}
        auth={auth}
        isOpen={uploadVisible}
        onOpen={setUploadVisible}
        showMessage={showMessage}
        setComplete={setComplete}
        multiple={true}
        finish={afterUpload}
        status={status}
      />
      {confirmAction === '' || (
        <Confirm
          text={t.deleteConfirm.replace('{0}', data[check[0]].fileName)}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      )}
      <MediaPlayer auth={auth} srcMediaId={playItem} onEnded={playEnded} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaTab' }),
  tma: localStrings(state, { layout: 'mediaActions' }),
  ts: localStrings(state, { layout: 'shared' }),
  allBookData: state.books.bookData,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      doOrbitError: actions.doOrbitError,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  mediaFiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(MediaTab) as any
) as any;
