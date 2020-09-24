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
} from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  Menu,
  MenuItem,
  IconButton,
  LinearProgress,
  AppBar,
  Typography,
  Radio,
  Slider,
  TableCell,
} from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import PlayIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import ClearIcon from '@material-ui/icons/Clear';
import { Table, TableFilterRow } from '@devexpress/dx-react-grid-material-ui';
import { tabs } from './PlanTabs';
import MediaUpload, { UploadType } from './MediaUpload';
import { useSnackBar } from '../hoc/SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import Busy from './Busy';
import Template from '../control/template';
import Auth from '../auth/Auth';
import { isElectron } from '../api-variable';
import moment from 'moment';

import {
  related,
  remoteIdNum,
  remoteId,
  passageReference,
  sectionDescription,
  getMediaInPlans,
  usePlan,
  useOrganizedBy,
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
import { TabHeight } from './PlanTabs';
import MediaPlayer from './MediaPlayer';
import { useMediaAttach } from '../crud/useMediaAttach';

const ActionHeight = 52;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    bar: {
      top: `calc(${HeadHeight}px + ${TabHeight}px)`,
      height: `${ActionHeight}px`,
      left: 0,
      width: '100%',
    },
    highBar: {
      top: `${HeadHeight}px`,
    },
    content: {
      paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)}px)`,
    },
    progress: {
      width: '100%',
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
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    link: {},
    playIcon: {
      fontSize: 16,
    },
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

enum StatusN {
  No = 0,
  Proposed = 1,
  Yes = 2,
}

interface IRow {
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
  isAttaching?: boolean;
  status: StatusL.No | StatusL.Proposed | StatusL.Yes;
}

interface IPRow {
  id: string;
  sectionId: string;
  sectionDesc: string;
  reference: string;
  attached: string;
  isAttaching?: boolean;
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

const getSection = (section: Section[]) => {
  if (section.length === 0) return '';
  return sectionDescription(section[0]);
};

const getReference = (passage: Passage[], bookData: BookName[] = []) => {
  if (passage.length === 0) return '';
  return passageReference(passage[0], bookData);
};

const getMedia = (
  planName: string,
  media: Array<MediaFile>,
  passages: Array<Passage>,
  sections: Array<Section>,
  playItem: string,
  allBookData: BookName[],
  slider: StatusN,
  attachMap: IAttachMap,
  pdata: IPRow[]
) => {
  let rowData: IRow[] = [];

  media.forEach((f) => {
    let status = attachMap.hasOwnProperty(f.id) ? StatusN.Proposed : -1;
    const passageId =
      status > 0 ? pdata[attachMap[f.id]].id : related(f, 'passage');
    const passage = passageId ? passages.filter((p) => p.id === passageId) : [];
    if (status < 0) status = passage.length > 0 ? StatusN.Yes : StatusN.No;
    if (status <= slider) {
      const sectionId = related(passage[0], 'section');
      const section = sections.filter((s) => s.id === sectionId);
      var updateddt = passageId
        ? passage[0].attributes.dateUpdated
        : f.attributes.dateUpdated;
      if (!updateddt.endsWith('Z')) updateddt += 'Z';
      const updated = moment(updateddt);
      const date = updated ? updated.format('YYYY-MM-DD') : '';
      const displayDate = updated
        ? updated.locale(localeDefault()).format('L')
        : '';
      const displayTime = updated
        ? updated.locale(localeDefault()).format('LT')
        : '';
      const today = moment().format('YYYY-MM-DD');
      rowData.push({
        planid: related(f, 'plan'),
        passId: passageId,
        planName,
        id: f.id,
        playIcon: playItem,
        fileName: f.attributes.originalFile,
        sectionId: sectionId,
        sectionDesc: getSection(section),
        reference: getReference(passage, allBookData),
        status:
          status === StatusN.Yes
            ? StatusL.Yes
            : status === StatusN.Proposed
            ? StatusL.Proposed
            : StatusL.No,
        isAttaching: status === StatusN.Proposed,
        duration: f.attributes.duration ? f.attributes.duration.toString() : '',
        size: f.attributes.filesize,
        version: f.attributes.versionNumber
          ? f.attributes.versionNumber.toString()
          : '',
        date: date === today ? displayTime : displayDate,
      } as IRow);
    }
  });
  return rowData;
};

const isAttached = (p: Passage, media: MediaFile[]) => {
  const mediaRecs = related(p, 'mediafiles') as MediaFile[];
  const mediaId = mediaRecs && mediaRecs.length > 0 && mediaRecs[0].id;
  return media.filter((m) => m.id === mediaId).length > 0;
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

interface IStateProps {
  t: IMediaTabStrings;
  ts: ISharedStrings;
  uploadList: FileList;
  loaded: boolean;
  currentlyLoading: number;
  uploadError: string;
  uploadSuccess: boolean[];
  allBookData: BookName[];
}

interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
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
  action?: (what: string, where: number[]) => boolean;
  auth: Auth;
  attachTool?: boolean;
}

export function MediaTab(props: IProps) {
  const {
    t,
    ts,
    doOrbitError,
    uploadList,
    loaded,
    currentlyLoading,
    uploadError,
    uploadSuccess,
    action,
    uploadFiles,
    nextUpload,
    uploadComplete,
    mediaFiles,
    passages,
    sections,
    auth,
    allBookData,
    attachTool,
  } = props;
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [remote] = useGlobal('remote');
  const { getPlan } = usePlan();
  const [planRec] = useState(getPlan(plan) || ({} as Plan));
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [, setTab] = useGlobal('tab');
  const [, setChanged] = useGlobal('changed');
  const [doSave] = useGlobal('doSave');
  const [, saveCompleted] = useRemoteSave();
  const [urlOpen, setUrlOpen] = useGlobal('autoOpenAddMedia');
  const [errorReporter] = useGlobal('errorReporter');
  const { showMessage } = useSnackBar();
  const [data, setData] = useState(Array<IRow>());
  const [pdata, setPData] = useState(Array<IPRow>());
  const [attachVisible, setAttachVisible] = useState(attachTool);
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [mcheck, setMCheck] = useState(-1);
  const [pcheck, setPCheck] = useState(-1);
  const [confirmAction, setConfirmAction] = useState('');
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));

  const columnDefs = [
    { name: 'planName', title: t.planName },
    { name: 'playIcon', title: '\u00A0' },
    { name: 'fileName', title: t.fileName },
    { name: 'section', title: organizedBy },
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
    { columnName: 'playIcon', width: 50 },
    { columnName: 'fileName', width: 220 },
    { columnName: 'section', width: 150 },
    { columnName: 'reference', width: attachVisible ? 165 : 150 },
    { columnName: 'duration', width: 100 },
    { columnName: 'size', width: 100 },
    { columnName: 'version', width: 100 },
    { columnName: 'date', width: 100 },
    { columnName: 'detach', width: 50 },
  ];
  const columnFormatting = [
    { columnName: 'section', aligh: 'left', wordWrapEnabled: true },
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
    { columnName: 'playIcon', sortingEnabled: false },
    { columnName: 'detach', sortingEnabled: false },
  ];
  const numCols = ['duration', 'size', 'version'];
  const [filter, setFilter] = useState(false);
  const mBandHead = [
    {
      title: <Typography variant="h6">{t.mediaAssociations}</Typography>,
      children: [
        { columnName: 'fileName' },
        { columnName: 'section' },
        { columnName: 'reference' },
        { columnName: 'detach' },
      ],
    },
  ];
  const mSummaryItems = [{ columnName: 'fileName', type: 'count' }];
  const pColumnDefs = [
    { name: 'section', title: organizedBy },
    { name: 'reference', title: t.reference },
    { name: 'attached', title: 'Attached' },
    { name: 'sort', title: '\u00A0' },
  ];
  const pColumnWidths = [
    { columnName: 'section', width: 150 },
    { columnName: 'reference', width: 150 },
    { columnName: 'attached', width: 105 },
  ];
  const pColumnFormatting = [
    { columnName: 'section', aligh: 'left', wordWrapEnabled: true },
    { columnName: 'reference', aligh: 'left', wordWrapEnabled: true },
  ];
  const pFilters = [{ columnName: 'attached', operation: 'equal', value: 'N' }];
  const pSorting = [{ columnName: 'sort', direction: 'asc' }];
  const pHiddenColumnNames = ['sort'];
  const pBandHead = [
    {
      title: <Typography variant="h6">{t.availablePassages}</Typography>,
      children: [
        { columnName: 'section' },
        { columnName: 'reference' },
        { columnName: 'attached' },
      ],
    },
  ];
  const pSummaryItems = [{ columnName: 'reference', type: 'count' }];
  const [hiddenColumnNames, setHiddenColumnNames] = useState<string[]>([]);
  const [filteringEnabled, setFilteringEnabled] = useState([
    { columnName: 'playIcon', filteringEnabled: false },
  ]);
  const [slider, setSlider] = useState<StatusN>(
    attachTool ? StatusN.Proposed : StatusN.Yes
  );
  const [pageSizes, setPageSizes] = useState<number[]>([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [complete, setComplete] = useState(0);
  const [autoMatch, setAutoMatch] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [attachMap, setAttachMap] = useState<IAttachMap>({});
  const [dataAttach, setDataAttach] = useState(new Set<number>());
  const [passAttach, setPassAttach] = useState(new Set<number>());
  const inProcess = React.useRef<boolean>(false);
  const [attachPassage, detachPassage] = useMediaAttach({
    ...props,
    ts,
    doOrbitError,
  });
  const hasPassage = (pRow: number) => {
    for (let mediaId of Object.keys(attachMap)) {
      if (attachMap[mediaId] === pRow) return true;
    }
    return false;
  };

  const handleUpload = () => {
    setUploadVisible(true);
  };
  const uploadMedia = (files: FileList) => {
    if (!files) {
      showMessage(t.selectFiles);
      return;
    }
    uploadFiles(files);
    setUploadVisible(false);
  };
  const uploadCancel = () => {
    setUploadVisible(false);
  };
  const handleMenu = (e: any) => setActionMenuItem(e.currentTarget);
  const handleConfirmAction = (what: string) => (e: any) => {
    setActionMenuItem(null);
    if (!/Close/i.test(what)) {
      if (check.length === 0) {
        showMessage(t.selectRows.replace('{0}', what));
      } else {
        setConfirmAction(what);
      }
    }
  };
  const handleActionConfirmed = () => {
    if (action != null) {
      if (action(confirmAction, check)) {
        setCheck(Array<number>());
      }
    }
    if (confirmAction === 'Delete') {
      check.forEach((i) => {
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
      });
      setCheck(Array<number>());
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };
  // const handleAttach = () => setAttachVisible(!attachVisible);
  const handleAutoMatch = () => setAutoMatch(!autoMatch);

  const handleSave = async () => {
    inProcess.current = true;
    showMessage(t.saving);
    const handleRow = async (mediaId: string) => {
      const pRow = attachMap[mediaId];
      await attachPassage(pdata[pRow].id, pdata[pRow].sectionId, plan, mediaId);
    };
    for (let mediaId of Object.keys(attachMap)) {
      await handleRow(mediaId);
    }
    setAttachMap({});
    showMessage(t.savingComplete);
    inProcess.current = false;
    saveCompleted('');
  };

  const handleDetach = (mediaId: string) => () => {
    const mRow = data.reduce((m, r, j) => {
      return r.id === mediaId ? j : m;
    }, -1);
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
    } else if (hasPassage(pRow) || passAttach.has(pRow)) {
      showMessage(t.passageAttached);
      return;
    }
    setAttachMap({ ...attachMap, [data[mRow].id]: pRow });
    setMCheck(-1);
    setPCheck(-1);
    setCheck([]);
    setChanged(true);
  };

  const handleMCheck = (checks: Array<number>) => {
    if (attachVisible) {
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
    if (attachVisible && checks.length === 1 && mcheck >= 0) {
      doAttach(mcheck, checks[0]);
      return;
    }
    setPCheck(checks[0] === pcheck ? checks[1] : checks[0]);
  };
  const handleSelect = (id: string) => () => {
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

  React.useEffect(() => {
    if (doSave && !inProcess.current) {
      handleSave();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [doSave]);

  const noPlanFilt = ['duration', 'size', 'version', 'date', 'planName'];
  const noPlanNoFilt = ['planName', 'detach'];
  const noPlayFilt = [
    { columnName: 'playIcon', filteringEnabled: false },
    { columnName: 'detach', filteringEnabled: false },
  ];
  const attachFilt = [
    { columnName: 'playIcon', filteringEnabled: false },
    { columnName: 'section', filteringEnabled: false },
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

  useEffect(() => {
    const playChange = data[0]?.playIcon !== playItem;
    const media: MediaFile[] = getMediaInPlans([planRec], mediaFiles);
    const newData = getMedia(
      planRec?.attributes?.name,
      media,
      passages,
      sections,
      playItem,
      allBookData,
      slider,
      attachMap,
      pdata
    );
    const medAttach = new Set<number>();
    newData.forEach((r, i) => {
      if (r.sectionDesc !== '') medAttach.add(i);
    });
    if (
      medAttach.size !== dataAttach.size ||
      newData.length !== data.length ||
      playChange
    ) {
      setDataAttach(medAttach);
      setData(newData);
    }
    const newPassData = getPassages(
      [planRec],
      media,
      passages,
      sections,
      allBookData
    );
    const pasAttach = new Set<number>();
    newPassData.forEach((r, i) => {
      if (r.attached === 'Y') pasAttach.add(i);
    });
    if (
      pasAttach.size !== passAttach.size ||
      pdata.length !== newPassData.length
    ) {
      setPassAttach(pasAttach);
      setPData(newPassData);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [
    mediaFiles,
    passages,
    sections,
    playItem,
    allBookData,
    slider,
    attachMap,
    pdata,
  ]);

  useEffect(() => {
    let dataChange = false;
    const newPData = pdata.map((r, i) => {
      const newRow = hasPassage(i)
        ? { ...r, attached: 'Y', isAttaching: true }
        : r.isAttaching
        ? { ...r, attached: 'N', isAttaching: false }
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

  useEffect(() => {
    if (loaded && currentlyLoading + 1 === uploadList.length) {
      // wait to do this to give time for duration calc
      setTimeout(() => {
        let numsuccess = uploadSuccess.filter((x) => x === true).length;
        showMessage(
          t.uploadComplete
            .replace('{0}', numsuccess.toString())
            .replace('{1}', uploadSuccess.length.toString())
        );
        uploadComplete();
        setComplete(0);
        if (numsuccess > 0) {
          setAttachVisible(true);
          setTab(tabs.associate);
        }
      }, 10000);
    } else if (loaded || currentlyLoading < 0) {
      if (uploadList.length > 0 && currentlyLoading + 1 < uploadList.length) {
        setComplete(
          Math.min((currentlyLoading * 100) / uploadList.length, 100)
        );
        const planId = remoteIdNum('plan', plan, memory.keyMap);
        const mediaFile = {
          planId: planId,
          originalFile: uploadList[currentlyLoading + 1].name,
          contentType: uploadList[currentlyLoading + 1].type,
        } as any;
        nextUpload(
          mediaFile,
          uploadList,
          currentlyLoading + 1,
          auth,
          errorReporter
        );
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [uploadList, loaded, currentlyLoading, uploadSuccess, planRec, auth]);

  useEffect(() => {
    if (currentlyLoading === -2 /* all are done */) {
      var remoteid = remoteId('plan', plan, memory.keyMap);

      if (remoteid !== undefined) {
        var filterrec = {
          attribute: 'plan-id',
          value: remoteid,
        };
        remote
          .pull((q) => q.findRecords('mediafile').filter(filterrec))
          .then((transform) => memory.sync(transform));
      }
      uploadFiles([] as any); //set current back to -1
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [currentlyLoading]);

  useEffect(() => {
    if (uploadError !== '') {
      if (uploadError.indexOf('unsupported') > 0)
        showMessage(
          t.unsupported.replace(
            '{0}',
            uploadError.substr(0, uploadError.indexOf(':unsupported'))
          )
        );
      else showMessage(uploadError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadError]);

  const matchMap = (pat: string, terms?: string[]) => {
    if (pdata.length === 0 || data.length === 0) return;
    const rpat = new RegExp(pat);
    const newMap = { ...attachMap };
    const usedPass = new Set<number>();
    Object.keys(newMap).forEach((k) => usedPass.add(newMap[k]));
    let found = 0;
    data.forEach((dr, dn) => {
      if (!dr.isAttaching && dr.reference === '') {
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

  const PlayCell = ({ value, style, mediaId, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <IconButton
        key={'audio-' + mediaId}
        aria-label={'audio-' + mediaId}
        color="primary"
        className={classes.link}
        onClick={handleSelect(mediaId ? mediaId : '')}
      >
        {value === mediaId ? (
          <StopIcon className={classes.playIcon} />
        ) : (
          <PlayIcon className={classes.playIcon} />
        )}
      </IconButton>
    </Table.Cell>
  );

  const DetachCell = (props: ICell) => {
    const { row } = props;
    return (
      <Table.Cell {...props}>
        {row.reference !== '' || row.isAttaching ? (
          <IconButton
            key={'detach-' + row.id}
            aria-label={'detach-' + row.id}
            color="primary"
            className={classes.link}
            onClick={handleDetach(row.id)}
            title={t.detach}
          >
            <ClearIcon />
          </IconButton>
        ) : (
          <></>
        )}
      </Table.Cell>
    );
  };

  const HighlightCell = (props: Table.DataCellProps) => {
    return (
      <Table.Cell {...props}>
        <strong>{props.value}</strong>
      </Table.Cell>
    );
  };

  const Cell = (props: ICell) => {
    const { column, row } = props;
    if (column.name === 'playIcon') {
      const mediaId = remoteId('mediafile', row.id, memory.keyMap);
      return <PlayCell {...props} mediaId={mediaId} />;
    }
    if (column.name === 'detach' && projRole === 'admin') {
      return <DetachCell {...props} />;
    }
    if (['reference', 'section'].includes(column.name) && row.isAttaching) {
      return <HighlightCell {...props} />;
    }
    return <Table.Cell {...props} />;
  };

  const PCell = (props: ICell) => {
    const { column, row } = props;
    if (column.name === 'attached' && row.isAttaching) {
      return <HighlightCell {...props} />;
    }
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

  const marks = [
    {
      value: 0,
      label: t.none,
    },
    {
      value: 1,
      label: t.proposed,
    },
    {
      value: 2,
      label: t.all,
    },
  ];

  const handleSlider = (e: any, val: number | number[]) => {
    const newVal =
      val === StatusN.No || val === StatusN.Proposed || val === StatusN.Yes
        ? val
        : 1;
    setSlider(newVal);
  };

  // see https://devexpress.github.io/devextreme-reactive/react/grid/docs/guides/filtering/#customize-filter-row-appearance
  const FilterCell = (props: TableFilterRow.CellProps) => {
    const { column } = props;
    let filtered = filteringEnabled.reduce((v, i) => {
      return i.columnName === column.name || v;
    }, false);
    return !filtered ? (
      <TableFilterRow.Cell {...props} />
    ) : column.name === 'reference' ? (
      <TableCell className={classes.cell}>
        <Slider
          className={classes.slider}
          value={slider}
          onChange={handleSlider}
          valueLabelDisplay="off"
          max={2}
          marks={marks}
        />
      </TableCell>
    ) : (
      <TableCell className={classes.cell} />
    );
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
            {projRole === 'admin' && (
              <>
                {!attachVisible && !isElectron && (
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
                )}
                {!attachVisible && !isElectron && (
                  <>
                    <Button
                      key="action"
                      aria-owns={
                        actionMenuItem !== '' ? 'action-menu' : undefined
                      }
                      aria-label={t.action}
                      variant="outlined"
                      color="primary"
                      className={classes.button}
                      onClick={handleMenu}
                    >
                      {t.action}
                      <DropDownIcon className={classes.icon} />
                    </Button>
                    <Menu
                      id="action-menu"
                      anchorEl={actionMenuItem}
                      open={Boolean(actionMenuItem)}
                      onClose={handleConfirmAction('Close')}
                    >
                      <MenuItem onClick={handleConfirmAction('Delete')}>
                        {t.delete}
                      </MenuItem>
                    </Menu>
                  </>
                )}
                {attachVisible && (
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
                )}
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
            {attachVisible && (
              <>
                <Button
                  key="save"
                  aria-label={t.save}
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleSave}
                  disabled={
                    check.length > 1 ||
                    Object.keys(attachMap).length === 0 ||
                    inProcess.current
                  }
                >
                  {t.save}
                </Button>
              </>
            )}
          </div>
        </AppBar>
        <div className={classes.content}>
          {complete === 0 || (
            <>
              <div className={classes.progress}>
                <LinearProgress variant="determinate" value={complete} />
              </div>
              <Busy />
            </>
          )}

          {attachVisible && autoMatch && (
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
              filterCell={FilterCell}
              dataCell={Cell}
              sorting={mSorting}
              numCols={numCols}
              rows={data}
              select={handleMCheck}
              selectCell={attachVisible ? SelectCell : undefined}
              checks={check}
              shaping={attachVisible || filter}
              hiddenColumnNames={hiddenColumnNames}
              expandedGroups={!filter ? [] : undefined} // shuts off toolbar row
              bandHeader={attachVisible ? mBandHead : null}
              summaryItems={mSummaryItems}
            />
            {attachVisible && mcheck !== -1 && (
              <ShapingTable
                columns={pColumnDefs}
                columnWidths={pColumnWidths}
                columnFormatting={pColumnFormatting}
                filters={pFilters}
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
                bandHeader={pBandHead}
                summaryItems={pSummaryItems}
              />
            )}
          </div>
        </div>
      </div>
      <MediaUpload
        visible={uploadVisible}
        uploadType={UploadType.Media}
        uploadMethod={uploadMedia}
        cancelMethod={uploadCancel}
        multiple={true}
      />
      {confirmAction === '' || (
        <Confirm
          text={confirmAction + ' ' + check.length + ' Item(s). Are you sure?'}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      )}
      <MediaPlayer auth={auth} srcMediaId={playItem} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaTab' }),
  ts: localStrings(state, { layout: 'shared' }),
  uploadList: state.upload.files,
  currentlyLoading: state.upload.current,
  uploadError: state.upload.errmsg,
  uploadSuccess: state.upload.success,
  loaded: state.upload.loaded,
  allBookData: state.books.bookData,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      uploadFiles: actions.uploadFiles,
      nextUpload: actions.nextUpload,
      uploadComplete: actions.uploadComplete,
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
