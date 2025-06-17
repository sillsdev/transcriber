import { useState, useEffect, useRef, useMemo, CSSProperties } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Typography, Box, BoxProps, styled, TableCell } from '@mui/material';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import useTodo from '../context/useTodo';
import ShapingTable from './ShapingTable';
import TaskItem from './TaskItem';
import {
  useOrganizedBy,
  usePlan,
  // useOfflineAvailToggle,
  // useRole,
} from '../crud';
import { numCompare } from '../utils';
import { debounce } from 'lodash';
import { GridColumnExtension } from '@devexpress/dx-react-grid';
import usePassageDetailContext from '../context/usePassageDetailContext';

export const TaskItemWidth = 240;
export const TaskTableWidth = 265;

const TaskTableDiv = styled('div')(() => ({
  td: {
    padding: 0,
  },
  '&[data-list="true"] table': {
    minWidth: `${TaskItemWidth}px !important`,
  },
  '&[data-list="true"] thead': {
    display: 'none',
  },
  '& .MuiListItem-root': {
    padding: '0 16px',
  },
  '& .MuiListItem-root .item-desc': {
    width: `${TaskItemWidth - 80}px!important`,
    whiteSpace: 'normal',
    overflow: 'hidden',
  },
  '& .MuiList-root': {
    padding: 0,
  },
  '& colgroup col:first-of-type': {
    width: '1px !important',
  },
  '&[data-list="true"] colgroup col:nth-of-type(2)': {
    width: `${TaskItemWidth}px !important`,
  },
  '& tbody > tr:first-of-type': {
    display: 'none',
  },
}));

const StyledPaper = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignContent: 'center',
  [theme.breakpoints.up('sm')]: {
    paddingLeft: 0,
    paddingRight: 0,
  },
}));

// see: https://mui.com/material-ui/customization/how-to-customize/
export interface HeaderProps extends BoxProps {
  filter?: boolean;
}
export const Header = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'filter',
})<HeaderProps>(({ filter, theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingTop: theme.spacing(1),
  paddingBottom: '8px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  ...(filter
    ? {
        width: 'auto',
      }
    : {
        width: `${TaskItemWidth - 30}px`,
      }),
}));

interface IRow {
  composite: JSX.Element | null;
  play: string;
  plan: string;
  section: number;
  sectPass: string;
  title: string;
  description: string;
  topic: string;
  speaker: string;
  length: string;
  state: string;
  assigned: string;
  mediaId: string;
  rowKey: string;
}

interface IProps {
  onFilter?: (top: boolean) => void;
  isDetail?: boolean;
}

export function TaskTable(props: IProps) {
  const { onFilter } = props;
  const { rowData, todoStr, expandedGroups, filter, flat } = useTodo();
  const { playerMediafile, loading, pdBusy, discussionSize } =
    usePassageDetailContext();
  const filterRef = useRef(filter);
  const t = todoStr;
  const [width, setWidth] = useState(TaskTableWidth);
  const { getPlan } = usePlan();
  const [planId] = useGlobal('plan'); //will be constant here
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const isInline = useRef(false);
  const [columns] = useState([
    { name: 'composite', title: '\u00A0' },
    { name: 'play', title: '\u00A0' },
    { name: 'plan', title: t.project },
    { name: 'section', title: organizedBy },
    { name: 'title', title: t.title },
    { name: 'sectPass', title: t.passage },
    { name: 'description', title: t.description },
    { name: 'topic', title: t.topic },
    { name: 'speaker', title: t.speaker },
    { name: 'length', title: t.length },
    { name: 'state', title: t.state },
    { name: 'assigned', title: t.assigned },
  ]);
  const [columnFormatting, setColumnFormatting] = useState<
    GridColumnExtension[]
  >([
    { columnName: 'composite', width: TaskItemWidth, align: 'left' },
    { columnName: 'play', width: 65, align: 'left' },
    { columnName: 'plan', width: 100, align: 'left', wordWrapEnabled: true },
    { columnName: 'section', width: 65, align: 'right' },
    { columnName: 'title', width: 150, align: 'left', wordWrapEnabled: true },
    { columnName: 'sectPass', width: 65, align: 'left' },
    {
      columnName: 'description',
      width: 150,
      align: 'left',
      wordWrapEnabled: true,
    },
    { columnName: 'topic', width: 100, align: 'left' },
    { columnName: 'speaker', width: 100, align: 'left' },
    { columnName: 'length', width: 100, align: 'left' },
    { columnName: 'state', width: 150, align: 'left' },
    { columnName: 'assigned', width: 150, align: 'left' },
  ]);
  const columnSorting = [{ columnName: 'section', compare: numCompare }];
  const numCols = ['section', 'duration'];
  const sortingEnabled = [
    { columnName: 'composite', sortingEnabled: false },
    { columnName: 'play', sortingEnabled: false },
  ];
  const filteringEnabled = [
    { columnName: 'composite', filteringEnabled: false },
    { columnName: 'play', filteringEnabled: false },
  ];
  const defaultGrouping = [{ columnName: 'plan' }];

  const [rows, setRows] = useState(Array<IRow>());
  const extraHeight = 86;
  const [style, setStyle] = useState<CSSProperties>({
    height: discussionSize.height + extraHeight,
    overflowY: 'auto',
    cursor: 'default',
  });
  const formRef = useRef<any>();
  const selectedRef = useRef<any>();
  const notSelectedRef = useRef<any>();
  const busyRef = useRef(false);
  // const { userIsAdmin } = useRole();
  const hiddenColumnNames = useMemo(() => (flat ? ['sectPass'] : []), [flat]);

  const setDimensions = () => {
    const newWidth = filterRef.current
      ? window.innerWidth - 40
      : TaskTableWidth;
    if (width !== newWidth) setWidth(newWidth);
    setStyle((style) => ({
      ...style,
      cursor: busyRef.current ? 'progress' : 'default',
      width: newWidth,
    }));
  };

  useEffect(() => {
    if (onFilter) onFilter(false);
    setDimensions();
    const handleResize = debounce(() => {
      setDimensions();
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    filterRef.current = filter;
    setDimensions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    busyRef.current = pdBusy || loading;
    setStyle((style) => ({
      ...style,
      height: discussionSize.height + extraHeight,
      cursor: busyRef.current ? 'progress' : 'default',
    }));
  }, [pdBusy, loading, discussionSize]);

  useEffect(() => {
    if (formRef.current && selectedRef.current) {
      formRef.current.scrollTo(0, selectedRef.current.offsetTop);
    }
  });

  useEffect(() => {
    const planRec = getPlan(planId);
    isInline.current = Boolean(planRec?.attributes?.flat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  useEffect(() => {
    if (!filter) {
      setColumnFormatting([
        { columnName: 'composite', width: TaskItemWidth, align: 'left' },
        { columnName: 'play', width: 0, align: 'left' },
        { columnName: 'plan', width: 0, align: 'left' },
        { columnName: 'section', width: 0, align: 'right' },
        { columnName: 'title', width: 0, align: 'left' },
        { columnName: 'sectPass', width: 0, align: 'left' },
        {
          columnName: 'description',
          width: 0,
          align: 'left',
          wordWrapEnabled: true,
        },
        { columnName: 'length', width: 0, align: 'left' },
        { columnName: 'duration', width: 0, align: 'right' },
        { columnName: 'state', width: 0, align: 'left' },
        { columnName: 'assigned', width: 0, align: 'left' },
      ]);
    }
  }, [filter, width]);

  useEffect(() => {
    const newRows = rowData.map((r, i) => ({
      composite: (
        <TaskItem item={i} organizedBy={organizedBy} flat={isInline.current} />
      ),
    }));
    setRows(newRows as IRow[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData]);

  interface ICell {
    key: string;
    value: any;
    style?: CSSProperties;
    mediaId?: string;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
  }

  const selBacking: CSSProperties = { background: 'lightgrey' };
  const noSelBacking: CSSProperties = { background: 'transparent' };

  const Cell = (props: ICell) => {
    const { row, column, value, key } = props;
    if (!filter) {
      if (column.name === 'composite') {
        let curId = '';
        if (typeof value?.props?.item === 'number')
          if (row.mediaId !== '')
            curId = rowData[value.props.item]?.mediafile.id;
        return (
          <TableCell
            key={key}
            ref={curId === playerMediafile?.id ? selectedRef : notSelectedRef}
            style={curId === playerMediafile?.id ? selBacking : noSelBacking}
          >
            {value}
          </TableCell>
        );
      }
      return <td>{'\u200B'}</td>; // Zero width space
    } else {
      if (column.name === 'composite') {
        return <td key={key}>{'\u00a0'}</td>;
      }
      return <Table.Cell {...props} />;
    }
  };
  return (
    <TaskTableDiv
      id="TaskTable"
      ref={formRef}
      style={style}
      data-list={!filter ? 'true' : ''}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <StyledPaper>
          <Header filter={filter}>
            <Typography variant="h6">{t.tasks}</Typography>
          </Header>
          <ShapingTable
            columns={columns}
            columnFormatting={filter ? columnFormatting : []}
            dataCell={Cell}
            sorting={[
              { columnName: 'plan', direction: 'asc' },
              { columnName: 'rowKey', direction: 'asc' },
            ]}
            sortingEnabled={sortingEnabled}
            defaultGrouping={defaultGrouping}
            expandedGroups={expandedGroups}
            filteringEnabled={filteringEnabled}
            columnSorting={columnSorting}
            hiddenColumnNames={hiddenColumnNames}
            numCols={numCols}
            shaping={filter}
            rows={rows}
          />
        </StyledPaper>
      </Box>
    </TaskTableDiv>
  );
}

export default TaskTable;
