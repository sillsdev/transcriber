import React, { memo, useEffect, useMemo, useState } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { shallowEqual, useSelector } from 'react-redux';
import {
  IState,
  IMediaTabStrings,
  MediaFileD,
  UserD,
  ISharedStrings,
} from '../../model';
import { Button, IconButton } from '@mui/material';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import BigDialog from '../../hoc/BigDialog';
import VersionDlg from './VersionDlg';
import ShapingTable from '../ShapingTable';
import TranscriptionShow from '../TranscriptionShow';
import MediaPlayer from '../MediaPlayer';
import MediaActions from './MediaActions';
import MediaActions2 from './MediaActions2';
import Confirm from '../AlertDialog';
import {
  findRecord,
  PublishDestinationEnum,
  remoteId,
  useBible,
  useOrganizedBy,
  usePublishDestination,
} from '../../crud';
import {
  numCompare,
  dateCompare,
  dateOrTime,
  useDataChanges,
  useWaitForRemoteQueue,
} from '../../utils';
import { IRow } from '.';
import { Sorting } from '@devexpress/dx-react-grid';
import { UpdateRecord } from '../../model/baseModel';
import { mediaTabSelector, sharedSelector } from '../../selector';
import { RecordKeyMap } from '@orbit/records';
import UserAvatar from '../UserAvatar';
import ConfirmPublishDialog from '../ConfirmPublishDialog';

interface IProps {
  data: IRow[];
  setRefresh: () => void;
  playItem: string;
  readonly: boolean;
  shared: boolean;
  canSetDestination: boolean;
  hasPublishing: boolean;
  sectionArr: [number, string][];
  setPlayItem: (item: string) => void;
  onAttach?: (checks: number[], attach: boolean) => void;
}
export const AudioTable = (props: IProps) => {
  const { data, setRefresh } = props;
  const {
    playItem,
    setPlayItem,
    onAttach,
    readonly,
    shared,
    canSetDestination,
    hasPublishing,
    sectionArr,
  } = props;
  const t: IMediaTabStrings = useSelector(mediaTabSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const lang = useSelector((state: IState) => state.strings.lang);
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [memory] = useGlobal('memory');
  const [org] = useGlobal('organization');
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [, setBusy] = useGlobal('remoteBusy');
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [confirmAction, setConfirmAction] = useState('');
  const [deleteItem, setDeleteItem] = useState(-1);
  const [showId, setShowId] = useState('');
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [publishItem, setPublishItem] = useState(-1);
  const [hasBible, setHasBible] = useState(false);
  const { getOrgBible } = useBible();
  const columnDefs =
    shared || hasPublishing
      ? [
          { name: 'planName', title: t.planName },
          { name: 'actions', title: '\u00A0' },
          { name: 'version', title: t.version },
          { name: 'publishTo', title: t.published },
          { name: 'fileName', title: t.fileName },
          { name: 'sectionDesc', title: organizedBy },
          { name: 'reference', title: t.reference },
          { name: 'user', title: t.user },
          { name: 'duration', title: t.duration },
          { name: 'size', title: t.size },
          { name: 'date', title: t.date },
          { name: 'detach', title: '\u00A0' },
        ]
      : [
          { name: 'planName', title: t.planName },
          { name: 'actions', title: '\u00A0' },
          { name: 'version', title: t.version },
          { name: 'fileName', title: t.fileName },
          { name: 'sectionDesc', title: organizedBy },
          { name: 'reference', title: t.reference },
          { name: 'user', title: t.user },
          { name: 'duration', title: t.duration },
          { name: 'size', title: t.size },
          { name: 'date', title: t.date },
          { name: 'detach', title: '\u00A0' },
        ];
  const columnWidths =
    shared || sectionArr.length > 0
      ? [
          { columnName: 'planName', width: 150 },
          { columnName: 'actions', width: onAttach ? 120 : 60 },
          { columnName: 'version', width: 30 },
          { columnName: 'publishTo', width: 100 },
          { columnName: 'fileName', width: 220 },
          { columnName: 'sectionDesc', width: 150 },
          { columnName: 'reference', width: 150 },
          { columnName: 'user', width: 30 },
          { columnName: 'duration', width: 50 },
          { columnName: 'size', width: 50 },
          { columnName: 'date', width: 80 },
          { columnName: 'detach', width: 50 },
        ]
      : [
          { columnName: 'planName', width: 150 },
          { columnName: 'actions', width: onAttach ? 120 : 60 },
          { columnName: 'version', width: 30 },
          { columnName: 'fileName', width: 220 },
          { columnName: 'sectionDesc', width: 150 },
          { columnName: 'reference', width: 150 },
          { columnName: 'user', width: 30 },
          { columnName: 'duration', width: 50 },
          { columnName: 'size', width: 50 },
          { columnName: 'date', width: 80 },
          { columnName: 'detach', width: 50 },
        ];

  const columnFormatting = [
    { columnName: 'actions', aligh: 'center', wordWrapEnabled: false },
    { columnName: 'sectionDesc', aligh: 'left', wordWrapEnabled: true },
  ];
  const sorting = [
    { columnName: 'planName', direction: 'asc' },
    {
      columnName: onAttach ? 'fileName' : 'version',
      direction: onAttach ? 'asc' : 'desc',
    },
    { columnName: 'date', direction: 'desc' },
  ] as Sorting[];
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
  const mSummaryItems = [{ columnName: 'fileName', type: 'count' }];
  const [pageSizes] = useState<number[]>([]);
  const [hiddenColumnNames] = useState<string[]>(['planName']);
  const [verHist, setVerHist] = useState('');
  const [verValue, setVerValue] = useState<number>();
  const { getPublishTo, setPublishTo, isPublished, publishStatus } =
    usePublishDestination();
  const forceDataChanges = useDataChanges();
  const waitForRemoteQueue = useWaitForRemoteQueue();

  const handleShowTranscription = (id: string) => () => {
    const row = data.find((r) => r.id === id);
    const rowVer = row?.version;
    if (rowVer) setVerValue(parseInt(rowVer));
    setShowId(id);
  };
  const updateMediaRec = async (
    id: string,
    publishTo: PublishDestinationEnum[]
  ) => {
    var mediaRec = memory.cache.query((q) =>
      q.findRecord({ type: 'mediafile', id: id })
    ) as MediaFileD;
    mediaRec.attributes.publishTo = setPublishTo(publishTo);
    mediaRec.attributes.readyToShare = isPublished(publishTo);
    await memory.update((t) => UpdateRecord(t, mediaRec, user));
    await waitForRemoteQueue('publishTo');
    await forceDataChanges();
    setRefresh();
  };

  const publishConfirm = async (destinations: PublishDestinationEnum[]) => {
    await updateMediaRec(data[publishItem].id, destinations);
    setPublishItem(-1);
  };
  const publishRefused = () => {
    setPublishItem(-1);
  };

  const handleChangeReadyToShare = (i: number) => () => {
    setPublishItem(i);
  };

  const handleCloseTranscription = () => {
    setShowId('');
  };

  const handleConfirmAction = (i: number) => {
    setDeleteItem(i);
    setConfirmAction('Delete');
  };

  const handleDelete = async (i: number) => {
    await memory.update((t) =>
      t.removeRecord({
        type: 'mediafile',
        id: data[i].id,
      })
    );
    setBusy(false); // forces refresh of plan tabs
  };

  const handleActionConfirmed = () => {
    if (confirmAction === 'Delete') {
      handleDelete(deleteItem).then(() => {
        setDeleteItem(-1);
        setRefresh();
      });
    }
    setConfirmAction('');
  };

  const handleActionRefused = () => {
    setConfirmAction('');
    setDeleteItem(-1);
  };

  const handleSelect = (id: string) => {
    if (id === playItem) {
      setMediaPlaying(!mediaPlaying);
    } else {
      setPlayItem(id);
    }
  };
  useEffect(() => {
    if (org) {
      var bible = getOrgBible(org);
      setHasBible((bible?.attributes.bibleName ?? '') !== '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  useEffect(() => {
    //if I set playing when I set the mediaId, it plays a bit of the old
    if (playItem) setMediaPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playItem]);

  const handleVerHistOpen = (passId: string) => () => {
    setVerHist(passId);
  };
  const handleVerHistClose = () => {
    setVerHist('');
  };

  const playEnded = () => {
    setPlayItem('');
    setMediaPlaying(false);
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
  const canCreate = useMemo(
    () => !offline || offlineOnly,
    [offline, offlineOnly]
  );

  const PlayCell = ({ value, style, row, mediaId, ...restProps }: ICell) => (
    <Table.Cell row={row} {...restProps} style={{ ...style }} value>
      <MediaActions
        rowIndex={row.index}
        mediaId={row.id}
        online={canCreate}
        readonly={onAttach ? readonly : true}
        attached={Boolean(row.passId)}
        onAttach={onAttach}
        onPlayStatus={handleSelect}
        isPlaying={playItem === row.id && mediaPlaying}
      />
    </Table.Cell>
  );

  const DetachCell = ({ mediaId, ...props }: ICell) => {
    const { row } = props;
    return (
      <Table.Cell {...props}>
        <MediaActions2
          rowIndex={row.index}
          mediaId={mediaId || ''}
          online={canCreate}
          readonly={readonly}
          canDelete={!readonly && !row.readyToShare}
          onDelete={handleConfirmAction}
        />
      </Table.Cell>
    );
  };

  const VersionCell = ({ value, row, ...restProps }: ICell) => (
    <Table.Cell row={row} {...restProps} value>
      <Button color="primary" onClick={handleVerHistOpen(row.passId)}>
        {value}
      </Button>
    </Table.Cell>
  );

  const ReferenceCell = ({ row, value, ...props }: ICell) => (
    <Table.Cell row {...props} value>
      <Button color="primary" onClick={handleShowTranscription(row.id)}>
        {value}
      </Button>
    </Table.Cell>
  );

  const DateCell = ({ row, value, ...props }: ICell) => (
    <Table.Cell row {...props} value>
      {dateOrTime(value, lang)}
    </Table.Cell>
  );
  const ReadyToShareCell = ({ row, value, ...props }: ICell) => (
    <Table.Cell row {...props} value>
      <IconButton
        onClick={handleChangeReadyToShare(row.index)}
        disabled={(row.passId || '') === '' || !canSetDestination}
      >
        {publishStatus(getPublishTo(value, hasPublishing, shared, true))}
      </IconButton>
    </Table.Cell>
  );
  const getUser = (id: string) => {
    return findRecord(memory, 'user', id) as UserD;
  };
  const MemoAvatar = memo(({ value }: { value: string }) => (
    <UserAvatar userRec={getUser(value)} />
  ));
  const UserCell = ({ row, value, ...props }: ICell) => (
    <Table.Cell row {...props} value>
      <MemoAvatar value={value} />
    </Table.Cell>
  );
  const Cell = (props: ICell) => {
    const { column, row } = props;
    if (column.name === 'actions') {
      const mediaId =
        remoteId('mediafile', row.id, memory?.keyMap as RecordKeyMap) || row.id;
      return <PlayCell {...props} mediaId={mediaId} />;
    }
    if (column.name === 'detach') {
      const mediaId =
        remoteId('mediafile', row.id, memory?.keyMap as RecordKeyMap) || row.id;
      return <DetachCell {...props} mediaId={mediaId} />;
    }
    if (column.name === 'version' && onAttach) {
      return <VersionCell {...props} />;
    }
    if (column.name === 'reference') {
      return <ReferenceCell {...props} />;
    }
    if (column.name === 'date') {
      return <DateCell {...props} />;
    }
    if (column.name === 'publishTo') {
      return <ReadyToShareCell {...props} />;
    }
    if (column.name === 'user') {
      return <UserCell {...props} />;
    }
    return <Table.Cell {...props} />;
  };

  return (
    <div>
      <ShapingTable
        columns={columnDefs}
        columnWidths={columnWidths}
        columnFormatting={columnFormatting}
        columnSorting={columnSorting}
        sortingEnabled={sortingEnabled}
        pageSizes={pageSizes}
        // filteringEnabled={filteringEnabled}
        dataCell={Cell}
        sorting={sorting}
        numCols={numCols}
        rows={data}
        // shaping={attachVisible || filter}
        hiddenColumnNames={hiddenColumnNames}
        expandedGroups={[]}
        bandHeader={undefined}
        summaryItems={mSummaryItems}
      />
      {verHist && (
        <BigDialog
          title={ts.versionHistory}
          isOpen={Boolean(verHist)}
          onOpen={handleVerHistClose}
        >
          <VersionDlg
            passId={verHist}
            canSetDestination={canSetDestination}
            hasPublishing={hasPublishing}
          />
        </BigDialog>
      )}
      {publishItem !== -1 && (
        <ConfirmPublishDialog
          title={t.publish}
          propagateLabel={''}
          description={''}
          noPropagateDescription={''}
          yesResponse={publishConfirm}
          noResponse={publishRefused}
          current={getPublishTo(
            data[publishItem].publishTo,
            hasPublishing,
            shared,
            true
          )}
          sharedProject={shared}
          hasPublishing={hasPublishing}
          hasBible={hasBible}
          noDefaults={true}
          passageType={data[publishItem]?.passageType}
        />
      )}
      {showId !== '' && (
        <TranscriptionShow
          id={showId}
          isMediaId={true}
          visible={showId !== ''}
          closeMethod={handleCloseTranscription}
          version={verValue}
        />
      )}
      {confirmAction === '' || (
        <Confirm
          text={t.deleteConfirm.replace('{0}', data[deleteItem].fileName)}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      )}
      <MediaPlayer
        srcMediaId={playItem}
        requestPlay={mediaPlaying}
        onEnded={playEnded}
      />
    </div>
  );
};

export default AudioTable;
