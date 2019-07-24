import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Passage,
  PassageSection,
  Section,
  User,
  IAssignmentTableStrings,
  Role,
} from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import ViewIcon from '@material-ui/icons/RemoveRedEye';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import SnackBar from './SnackBar';
import TreeGrid from './TreeGrid';
import TranscriptionShow from './TranscriptionShow';
import related from '../utils/related';
import Auth from '../auth/Auth';
import UserPassage from '../model/userPassage';
import {
  sectionNumber,
  sectionReviewerName,
  sectionTranscriberName,
  sectionCompare,
} from '../utils/section';
import { passageNumber, passageCompare } from '../utils/passage';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      marginLeft: theme.spacing(4),
      marginRight: theme.spacing(4),
      marginBottom: theme.spacing(4),
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
      variant: 'outlined',
      color: 'primary',
    },
    icon: {
      marginLeft: theme.spacing(1),
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
  transcriber: string;
  reviewer: string;
  passages: string;
  parentId: string;
}
const getChildRows = (row: any, rootRows: any[]) => {
  const childRows = rootRows.filter(r => r.parentId === (row ? row.id : ''));
  return childRows.length ? childRows : null;
};

/* build the section name = sequence + name */
const getSection = (section: Section) => {
  return sectionNumber(section) + ' ' + section.attributes.name;
};

/* build the passage name = sequence + book + reference */
const getReference = (passage: Passage[]) => {
  if (passage.length === 0) return '';
  return (
    passageNumber(passage[0]) +
    ' ' +
    passage[0].attributes.book +
    ' ' +
    passage[0].attributes.reference
  );
};

const getAssignments = (
  plan: string,
  passages: Array<Passage>,
  passageSections: Array<PassageSection>,
  sections: Array<Section>,
  users: Array<User>
) => {
  function passageSectionCompare(a: PassageSection, b: PassageSection) {
    const pa = passages.filter(p => p.id === related(a, 'passage'));
    const pb = passages.filter(p => p.id === related(b, 'passage'));
    return passageCompare(pa[0], pb[0]);
  }
  var sectionRow: IRow;
  const rowData: IRow[] = [];
  const plansections = sections
    .filter(s => related(s, 'plan') === plan)
    .sort(sectionCompare);

  plansections.forEach(function(section) {
    sectionRow = {
      id: section.id,
      name: getSection(section),
      state: section.attributes.state,
      reviewer: sectionReviewerName(section, users),
      transcriber: sectionTranscriberName(section, users),
      passages: '0', //string so we can have blank, alternatively we could format in the tree to not show on passage rows
      parentId: '',
    };
    rowData.push(sectionRow);
    //const passageSections: PassageSection[] = related(section, 'passages');
    const sectionps = passageSections
      .filter(ps => related(ps, 'section') === section.id)
      .sort(passageSectionCompare);
    sectionRow.passages = sectionps.length.toString();
    sectionps.forEach(function(ps: PassageSection, psindex: number) {
      const passageId = related(ps, 'passage');
      const passage = passages.filter(p => p.id === passageId);
      rowData.push({
        id: passageId,
        name: getReference(passage),
        state: passage[0].attributes.state,
        reviewer: '',
        transcriber: '',
        passages: '',
        parentId: section.id,
      } as IRow);
    });
  });
  return rowData as Array<IRow>;
};

interface IStateProps {
  t: IAssignmentTableStrings;
}

interface IRecordProps {
  userPassages: Array<UserPassage>;
  passages: Array<Passage>;
  passageSections: Array<PassageSection>;
  sections: Array<Section>;
  users: Array<User>;
  roles: Array<Role>;
}

interface IProps extends IStateProps, IRecordProps, WithDataProps {
  action?: (what: string, where: number[]) => boolean;
  auth: Auth;
}

export function TranscriptionTab(props: IProps) {
  const {
    t,
    passages,
    passageSections,
    sections,
    userPassages,
    users,
    roles,
  } = props;
  const classes = useStyles();
  const [plan] = useGlobal('plan');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  const [passageId, setPassageId] = useState('');

  const columnDefs = [
    { name: 'name', title: t.section },
    { name: 'state', title: t.sectionstate },
    { name: 'passages', title: t.passages },
    { name: 'transcriber', title: t.transcriber },
    { name: 'reviewer', title: t.reviewer },
  ];
  const columnWidths = [
    { columnName: 'name', width: 300 },
    { columnName: 'state', width: 150 },
    { columnName: 'passages', width: 100 },
    { columnName: 'transcriber', width: 200 },
    { columnName: 'reviewer', width: 200 },
  ];

  const [filter, setFilter] = useState(false);
  const [group, setGroup] = useState(false);

  const handleMessageReset = () => {
    setMessage(<></>);
  };

  const handleFilter = () => setFilter(!filter);
  const handleGroup = () => setGroup(!group);

  const handleSelect = (passageId: string) => () => {
    setPassageId(passageId);
  };
  const handleCloseTranscription = () => {
    setPassageId('');
  };

  useEffect(() => {
    setData(
      getAssignments(plan as string, passages, passageSections, sections, users)
    );
  }, [plan, userPassages, passages, passageSections, sections, users, roles]);

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

  const Cell = (props: any) => {
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

  return (
    <div id="TranscriptionTab" className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
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
          <Button
            key="group"
            aria-label={t.group}
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleGroup}
            title={'Show/Hide group panel'}
          >
            {t.group}
            {group ? (
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
          cellComponent={Cell}
          pageSizes={[5, 10, 20]}
          tableColumnExtensions={[
            { columnName: 'passages', align: 'right' },
            { columnName: 'name', wordWrapEnabled: true },
          ]}
          groupingStateColumnExtensions={[
            { columnName: 'name', groupingEnabled: false },
            { columnName: 'passages', groupingEnabled: false },
          ]}
          sorting={[{ columnName: 'name', direction: 'asc' }]}
          treeColumn={'name'}
          showfilters={filter}
          showgroups={group}
          showSelection={false}
        />{' '}
      </div>
      {passageId !== '' ? (
        <TranscriptionShow
          passageId={passageId}
          visible={passageId !== ''}
          closeMethod={handleCloseTranscription}
        />
      ) : (
        ''
      )}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'transcriptionTab' }),
});

const mapRecordsToProps = {
  userPassages: (q: QueryBuilder) => q.findRecords('userpassage'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  TranscriptionTab
) as any) as any;
