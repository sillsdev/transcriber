import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, User, IUsertableStrings } from '../model';
import localStrings from '../selector/localize';
import { Paper } from '@material-ui/core';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  FilteringState,
  IntegratedFiltering,
  IntegratedPaging,
  IntegratedSelection,
  IntegratedSorting,
  PagingState,
  SelectionState,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  DragDropProvider,
  Grid,
  PagingPanel,
  Table,
  TableColumnResizing,
  TableFilterRow,
  TableHeaderRow,
  TableSelection,
  Toolbar,
} from '@devexpress/dx-react-grid-material-ui';
import Auth from '../auth/Auth';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
    },
    container: {
      display: 'flex',
      justifyContent: 'center',
    },
    paper: theme.mixins.gutters({
      paddingTop: 16,
      paddingBottom: 16,
      marginTop: theme.spacing(3),
      width: '80%',
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      [theme.breakpoints.down('md')]: {
        width: '100%',
      },
    }),
    fullPaper: theme.mixins.gutters({
      padding: 0,
      margin: 0,
    }),
    dialogHeader: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }),
  })
);

interface IStateProps {
  t: IUsertableStrings;
}

interface IRecordProps {
  users: Array<User>;
}

interface IUserRow {
  type: string;
  id: string;
  name: string;
  email: string;
  locale: string;
  phone: string;
  timezone: string;
}

interface IProps extends IStateProps, IRecordProps {
  auth: Auth;
}

export function UserTable(props: IProps) {
  const { users, auth, t } = props;
  const classes = useStyles();
  const { isAuthenticated } = auth;

  const [columns, setColumns] = useState([
    { name: 'name', title: 'Name' },
    { name: 'email', title: 'Email' },
    { name: 'locale', title: 'Locale' },
    { name: 'phone', title: 'Phone' },
    { name: 'timezone', title: 'Timezone' },
  ]);
  const [pageSizes] = useState([5, 10, 15]);
  const [rows, setRows] = useState(Array<IUserRow>());

  useEffect(() => {
    setColumns([
      { name: 'name', title: t.name },
      { name: 'email', title: t.email },
      { name: 'locale', title: t.locale },
      { name: 'phone', title: t.phone },
      { name: 'timezone', title: t.timezone },
    ]);
    if (users && users !== undefined) {
      setRows(
        users
          .filter(u => u.attributes)
          .map((o: User) => ({
            type: o.type,
            id: o.id,
            name: o.attributes.name,
            email: o.attributes.email ? o.attributes.email : '',
            locale: o.attributes.locale ? o.attributes.locale : '',
            phone: o.attributes.phone ? o.attributes.phone : '',
            timezone: o.attributes.timezone ? o.attributes.timezone : '',
          }))
      );
    }
  }, [users, t.name, t.email, t.locale, t.phone, t.timezone]);

  if (!isAuthenticated()) return <Redirect to="/" />;

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <Paper
          id="user-table"
          className={clsx(classes.paper, {
            [classes.fullPaper]: true,
          })}
        >
          {/* <Typography variant="h5" className={classes.dialogHeader}>
            {t.chooseUser}
          </Typography> */}
          <Grid rows={rows} columns={columns}>
            <FilteringState />
            <SortingState
              defaultSorting={[{ columnName: 'name', direction: 'asc' }]}
            />

            <SelectionState />

            <PagingState />

            <IntegratedFiltering />
            <IntegratedSorting />
            <IntegratedPaging />
            <IntegratedSelection />

            <DragDropProvider />

            <Table />
            <TableSelection showSelectAll={true} />
            <TableColumnResizing
              minColumnWidth={50}
              defaultColumnWidths={[
                { columnName: 'name', width: 200 },
                { columnName: 'email', width: 200 },
                { columnName: 'locale', width: 100 },
                { columnName: 'phone', width: 100 },
                { columnName: 'timezone', width: 100 },
              ]}
            />

            <TableHeaderRow showSortingControls={true} />
            <TableFilterRow showFilterSelector={true} />
            <PagingPanel pageSizes={pageSizes} />

            <Toolbar />
          </Grid>
        </Paper>
      </div>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'usertable' }),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  UserTable
) as any) as any;
