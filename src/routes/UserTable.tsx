import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, User, IUsertableStrings } from '../model';
import localStrings from '../selector/localize';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import {
  FilteringState,
  IntegratedFiltering, IntegratedPaging, IntegratedSelection, IntegratedSorting,
  PagingState, SelectionState, SortingState,
} from '@devexpress/dx-react-grid';
import {
  DragDropProvider,
  Grid, PagingPanel,
  Table, TableColumnResizing, TableFilterRow,
  TableHeaderRow, TableSelection, Toolbar,
} from '@devexpress/dx-react-grid-material-ui';
import TranscriberBar from '../components/TranscriberBar';
import Auth from '../auth/Auth';

const styles = (theme: Theme) => createStyles({
  root: {
    width: '100%',
  },
  grow: {
    flexGrow: 1,
  },
  container: {
    display: 'flex',
    justifyContent: 'center'
  },
  paper: theme.mixins.gutters({
    paddingTop: 16,
    paddingBottom: 16,
    marginTop: theme.spacing.unit * 3,
    width: '80%',
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    [theme.breakpoints.down('md')]: {
      width: '100%',
    },
  }),
  dialogHeader: theme.mixins.gutters({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center'
  }),
  actions: theme.mixins.gutters({
    paddingBottom: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right'
  }),
  button: {
    marginRight: theme.spacing.unit
  },
});

interface IStateProps {
  t: IUsertableStrings;
};

interface IUserRow {
  type: string;
  id: string;
  name: string;
  email: string;
  locale: string;
  phone: string;
  timezone: string;
};

interface IProps extends IStateProps, WithStyles<typeof styles>{
  users: Array<User>;
  auth: Auth;
};

export function UserTable(props: IProps) {
  const { classes, users, auth, t } = props;
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
  const [view, setView] = useState('');

  const handleCancel = () => { setView('/admin') };
  const handleContinue = () => { setView('/admin') };

  useEffect(() => {
    setColumns([
      { name: 'name', title: t.name },
      { name: 'email', title: t.email },
      { name: 'locale', title: t.locale },
      { name: 'phone', title: t.phone },
      { name: 'timezone', title: t.timezone },
    ])
    setRows(users.map((o: User) => ({
      type: o.type,
      id: o.id,
      name: o.attributes.name,
      email: o.attributes.email,
      locale: o.attributes.locale,
      phone: o.attributes.phone,
      timezone: o.attributes.timezone,
    })))
  }, [users, t.name, t.email, t.locale, t.phone, t.timezone]);

  if (!isAuthenticated()) return <Redirect to='/' />;

  if (view !== '') return <Redirect to={view} />;

  return (
    <div className={classes.root}>
      <TranscriberBar {...props} close={handleCancel}/>
      <div className={classes.container}>
        <Paper id='user-table' className={classes.paper}>
          <h2 className={classes.dialogHeader}>
            {t.chooseUser}
          </h2>
          <Grid
            rows={rows}
            columns={columns}
          >
            <FilteringState />
            <SortingState
              defaultSorting={[
                { columnName: 'name', direction: 'asc' },
              ]}
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
            <TableColumnResizing minColumnWidth={50}
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
          <div className={classes.actions}>
            <Button
              onClick={handleCancel}
              variant="contained"
              className={classes.button}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleContinue}
              variant="contained"
              color="primary"
              className={classes.button}
            >
              {t.continue}
            </Button>
          </div>
        </Paper>
      </div>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "usertable"})
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user')
}

export default withStyles(styles, { withTheme: true })(
  withData(mapRecordsToProps)(
      connect(mapStateToProps)(UserTable) as any
      ) as any
  ) as any;
