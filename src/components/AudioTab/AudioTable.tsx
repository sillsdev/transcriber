import React, { useState } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { PlanContext } from '../../context/PlanContext';
import { IState, IMediaTabStrings } from '../../model';
import { Button } from '@material-ui/core';
import localStrings from '../../selector/localize';
import { TransformBuilder } from '@orbit/data';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import BigDialog from '../../hoc/BigDialog';
import VersionDlg from './VersionDlg';
import ShapingTable from '../ShapingTable';
import TranscriptionShow from '../TranscriptionShow';
import MediaPlayer from '../MediaPlayer';
import MediaActions from './MediaActions';
import MediaActions2 from './MediaActions2';
import Confirm from '../AlertDialog';
import Auth from '../../auth/Auth';
import { remoteId, useOrganizedBy } from '../../crud';
import { numCompare, dateCompare } from '../../utils';
import { IRow } from '.';
import { Sorting } from '@devexpress/dx-react-grid';

interface IStateProps {
  t: IMediaTabStrings;
}

interface IProps extends IStateProps {
  auth: Auth;
  data: IRow[];
  setRefresh: (refresh: boolean) => void;
  playItem: string;
  setPlayItem: (item: string) => void;
  onAttach?: (checks: number[], attach: boolean) => void;
}
export const AudioTable = (props: IProps) => {
  const { data, setRefresh, auth, t } = props;
  const { playItem, setPlayItem, onAttach } = props;
  const ctx = React.useContext(PlanContext);
  const { connected, readonly } = ctx.state;
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [confirmAction, setConfirmAction] = useState('');
  const [deleteItem, setDeleteItem] = useState(-1);
  const [showId, setShowId] = useState('');

  const columnDefs = [
    { name: 'planName', title: t.planName },
    { name: 'actions', title: '\u00A0' },
    { name: 'fileName', title: t.fileName },
    { name: 'sectionDesc', title: organizedBy },
    { name: 'reference', title: t.reference },
    { name: 'duration', title: t.duration },
    { name: 'size', title: t.size },
    { name: 'version', title: t.version },
    { name: 'date', title: t.date },
    { name: 'detach', title: '\u00A0' },
  ];
  const columnWidths = [
    { columnName: 'planName', width: 150 },
    { columnName: 'actions', width: onAttach ? 120 : 50 },
    { columnName: 'fileName', width: 220 },
    { columnName: 'sectionDesc', width: 150 },
    { columnName: 'reference', width: 150 },
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
  const sorting = [
    { columnName: 'planName', direction: 'asc' },
    {
      columnName: onAttach ? 'fileName' : 'version',
      direction: onAttach ? 'asc' : 'desc',
    },
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

  const handleShowTranscription = (id: string) => () => {
    setShowId(id);
  };

  const handleCloseTranscription = () => {
    setShowId('');
  };

  const handleConfirmAction = (i: number) => {
    setDeleteItem(i);
    setConfirmAction('Delete');
  };

  const handleDelete = (i: number) => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({
        type: 'mediafile',
        id: data[i].id,
      })
    );
  };

  const handleActionConfirmed = () => {
    if (confirmAction === 'Delete') {
      handleDelete(deleteItem);
      setDeleteItem(-1);
      setRefresh(true);
    }
    setConfirmAction('');
  };

  const handleActionRefused = () => {
    setConfirmAction('');
    setDeleteItem(-1);
  };

  const handleSelect = (id: string) => {
    if (id === playItem) setPlayItem('');
    else setPlayItem(id);
  };

  const handleVerHistOpen = (passId: string) => () => {
    setVerHist(passId);
  };
  const handleVerHistClose = () => {
    setVerHist('');
  };

  const playEnded = () => {
    setPlayItem('');
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
        readonly={onAttach ? readonly : true}
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
    if (column.name === 'version' && row.version !== '1' && onAttach) {
      return <VersionCell {...props} />;
    }
    if (column.name === 'reference') {
      return <ReferenceCell {...props} />;
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
          title={t.versionHistory}
          isOpen={Boolean(verHist)}
          onOpen={handleVerHistClose}
        >
          <VersionDlg auth={auth} passId={verHist} />
        </BigDialog>
      )}

      {showId !== '' && (
        <TranscriptionShow
          id={showId}
          isMediaId={true}
          visible={showId !== ''}
          closeMethod={handleCloseTranscription}
        />
      )}
      {confirmAction === '' || (
        <Confirm
          text={t.deleteConfirm.replace('{0}', data[deleteItem].fileName)}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      )}
      <MediaPlayer auth={auth} srcMediaId={playItem} onEnded={playEnded} />
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaTab' }),
});

export default connect(mapStateToProps)(AudioTable) as any;
