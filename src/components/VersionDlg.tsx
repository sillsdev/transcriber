import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import moment from 'moment';
import { connect } from 'react-redux';
import { withData } from '../mods/react-orbitjs';
import { PlanContext } from '../context/PlanContext';
import {
  IState,
  MediaFile,
  Passage,
  Section,
  Plan,
  BookName,
  IMediaTabStrings,
} from '../model';
import localStrings from '../selector/localize';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import ShapingTable from './ShapingTable';
import MediaPlayer from './MediaPlayer';
import MediaActions from './MediaActions';
import MediaActions2 from './MediaActions2';
import Confirm from './AlertDialog';
import Auth from '../auth/Auth';
import {
  related,
  remoteId,
  useOrganizedBy,
  usePlan,
  passageReference,
  sectionDescription,
} from '../crud';
import { numCompare, dateCompare, localeDefault } from '../utils';

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

interface IStateProps {
  t: IMediaTabStrings;
  allBookData: BookName[];
}

interface IRecordProps {
  mediaFiles: Array<MediaFile>;
  passages: Array<Passage>;
  sections: Array<Section>;
}

interface IProps extends IStateProps, IRecordProps {
  auth: Auth;
  passId: string;
}
export const VersionDlg = (props: IProps) => {
  const { passId, auth, t, allBookData } = props;
  const { mediaFiles, passages, sections } = props;
  const ctx = React.useContext(PlanContext);
  const { connected, readonly } = ctx.state;
  const [plan] = useGlobal('plan');
  const { getPlan } = usePlan();
  const [planRec] = useState(getPlan(plan) || ({} as Plan));
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [isDeveloper] = useGlobal('developer');
  const [playItem, setPlayItem] = useState('');
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [confirmAction, setConfirmAction] = useState('');
  const [deleteItem, setDeleteItem] = useState(-1);
  const [data, setData] = useState<IRow[]>([]);
  const [refresh, setRefresh] = useState(false);
  const locale = localeDefault(isDeveloper);

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
    { columnName: 'actions', width: 50 },
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
  const mSummaryItems = [{ columnName: 'fileName', type: 'count' }];
  const [pageSizes] = useState<number[]>([]);
  const [hiddenColumnNames] = useState<string[]>(['planName']);

  const handleConfirmAction = (i: number) => {
    setDeleteItem(i);
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

  const playEnded = () => {
    setPlayItem('');
  };

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
    locale: string
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

  useEffect(() => {
    const playChange = data[0]?.playIcon !== playItem;
    const media: MediaFile[] = mediaFiles.filter(
      (m) => related(m, 'passage') === passId
    );

    const newData = getMedia(
      planRec?.attributes?.name,
      media,
      passages,
      sections,
      playItem,
      allBookData,
      locale
    );
    if (newData.length !== data.length || playChange || refresh)
      setData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaFiles, sections, passages, planRec, passId, playItem, locale]);

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
        readonly={true}
        attached={Boolean(row.passId)}
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
        sorting={mSorting}
        numCols={numCols}
        rows={data}
        // shaping={attachVisible || filter}
        hiddenColumnNames={hiddenColumnNames}
        expandedGroups={[]}
        bandHeader={null}
        summaryItems={mSummaryItems}
      />
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
  allBookData: state.books.bookData,
});

const mapRecordsToProps = {
  mediaFiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(VersionDlg) as any
) as any;
