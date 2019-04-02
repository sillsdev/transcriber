import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import dataSource from './dataSource';
import AppBar from '@material-ui/core/AppBar';
import MuiToolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { createStyles, withStyles, Theme } from '@material-ui/core/styles';
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

interface TableRelationship {
  links: { self: string; related: string; };
  data: { type: string; id: string; };
};

interface Project {
  type: string;
  id: string;
  attributes: {
    name: string;
    description: string;
    language: string;
    ispublic: boolean;
  };
  relationships: {
    projecttypes: TableRelationship;
    sets: TableRelationship;
    projectusers: TableRelationship;
    usertasks: TableRelationship;
    owner: TableRelationship;
    projectintegrations: TableRelationship;
    Organizations: TableRelationship;
  };
};

export function ProjectTable(props: any) {
  const { classes } = props;
  const [columns, setColumns] = useState([
    { name: 'name', title: 'Name' },
    { name: 'description', title: 'Description' },
    { name: 'language', title: 'Language' },
    { name: 'public', title: 'Public' },
  ]);
  const [pageSizes, setPageSizes] = useState([5, 10, 15]);
  const [rows, setRows] = useState([]);
  const [view, setView] = useState('');

  const handleCancel = () => { setView('/admin') };
  const handleContinue = () => { setView('/projectstatus') };

  useEffect(() => {
    const [url, doc] = dataSource();
    axios(url + '/projects' + doc)
      .then(result => setRows(result.data.data.map((o: Project) => ({
        type: o.type,
        id: o.id,
        name: o.attributes.name,
        description: o.attributes.description,
        language: o.attributes.language,
        public: o.attributes.ispublic,
      }))))
  }, []);

  return view === ''? (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <MuiToolbar>
          <Typography variant="h6" color="inherit" className={classes.grow}>
            {'SIL Transcriber Admin'}
          </Typography>
        </MuiToolbar>
      </AppBar>
      <div className={classes.container}>
        <Paper id='ProjectTable' className={classes.paper}>
          <h2 className={classes.dialogHeader}>
            {'Choose Project'}
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
                { columnName: 'description', width: 400 },
                { columnName: 'language', width: 100 },
                { columnName: 'public', width: 100 },
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
              variant="raised"
              className={classes.button}>
              Cancel
                        </Button>
            <Button
              onClick={handleContinue}
              variant="raised"
              color="primary"
              className={classes.button}>
              Continue
                        </Button>
          </div>
        </Paper>
      </div>
    </div>
  ): <Redirect to={view}/>;
}

const styles = (theme: Theme) => createStyles({
  container: {
    display: 'flex',
    justifyContent: 'center'
  },
  appBar: theme.mixins.gutters({
    background: '#FFE599',
    color: 'black'
  }),
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

export default withStyles(styles, { withTheme: true })(ProjectTable) as any;
