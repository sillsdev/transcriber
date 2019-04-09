import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Project from './model/project';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withData } from 'react-orbitjs';
import { QueryBuilder, Record } from '@orbit/data';
import AppBar from '@material-ui/core/AppBar';
import MuiToolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import BackIcon from '@material-ui/icons/ArrowBack';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';
import SnackBar from './SnackBar';
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

export class ProjectTableData extends React.Component<IRecordProps, object> {
  public render(): JSX.Element {
      return <ProjectTable {...this.props} />
  }
}

interface Row {
  type: string;
  id: number;
  name: string;
  description: string;
  language: string;
  ispublic: string;
}

export function ProjectTable(props: any) {
  const { classes, projects } = props;
  const [columns, setColumns] = useState([
    { name: 'name', title: 'Name' },
    { name: 'description', title: 'Description' },
    { name: 'language', title: 'Language' },
    { name: 'public', title: 'Public' },
  ]);
  const [pageSizes, setPageSizes] = useState([5, 10, 15]);
  const [rows, setRows] = useState([]);
  const [view, setView] = useState('');
  const [project, setProject] = useGlobal('project');
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');

  const handleDelete = () => { alert('Delete') };
  const handleAdd = () => { alert('Add') };
  const handleCancel = () => { setView('/admin') };
  const handleEdit = () => {
    if (selected.length === 1) {
      setView('/projectstatus')
    } else {
      setMessage('Please select a single project')
    }
  };
  const handleSelection = (s: any) => {
    setSelected(s);
    if (s.length === 1) {
      const selectedRow: Row = rows[s[0]];
      setProject(selectedRow.id)
    }
  };
  const handleMessageReset = () => { setMessage('') }

  useEffect(() => {
    setRows(projects.map((o: Project) => ({
      type: o.type,
      id: o.id,
      name: o.attributes.name,
      description: o.attributes.description,
      language: o.attributes.language,
      public: o.attributes.ispublic,
    })))
  }, []);

  return view === "" ? (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <MuiToolbar>
          <IconButton >
            <BackIcon onClick={handleCancel} />
          </IconButton>
          <Typography variant="h6" color="inherit" className={classes.grow}>
            {"SIL Transcriber Admin"}
          </Typography>
        </MuiToolbar>
      </AppBar>
      <div className={classes.container}>
        <Paper id="ProjectTable" className={classes.paper}>
          <h2 className={classes.dialogHeader}>{"Choose Project"}</h2>
          <Grid rows={rows} columns={columns}>
            <FilteringState />
            <SortingState
              defaultSorting={[{ columnName: "name", direction: "asc" }]}
            />

            <SelectionState onSelectionChange={handleSelection} />

            <PagingState />

            <IntegratedFiltering />
            <IntegratedSorting />
            <IntegratedPaging />
            <IntegratedSelection />

            <DragDropProvider />

            <Table />
            <TableSelection selectByRowClick={true} />
            <TableColumnResizing
              minColumnWidth={50}
              defaultColumnWidths={[
                { columnName: "name", width: 200 },
                { columnName: "description", width: 400 },
                { columnName: "language", width: 100 },
                { columnName: "public", width: 100 }
              ]}
            />

            <TableHeaderRow showSortingControls={true} />
            <TableFilterRow showFilterSelector={true} />
            <PagingPanel pageSizes={pageSizes} />

            <Toolbar />
          </Grid>
          <div className={classes.actions}>
            <Button
              key="delete"
              aria-label="Delete"
              variant="contained"
              color="secondary"
              className={classes.button}
              onClick={handleDelete}
            >
              {'Delete'}
              <DeleteIcon className={classes.icon} />
            </Button>
            <Button
              key="add"
              aria-label="Add"
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleAdd}
            >
              {'Add'}
              <AddIcon className={classes.icon} />
            </Button>
          </div>
        </Paper>
      </div>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  ) : (
    <Redirect to={view} />
  );
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
    margin: theme.spacing.unit
  },
  icon: {
    marginLeft: theme.spacing.unit
  },
});

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: any) => ({
    ...bindActionCreators({
    }, dispatch),
});

interface IRecordProps {
    projects: () => Array<Record>;
}

const mapRecordsToProps = {
    projects: (q: QueryBuilder) => q.findRecords('project'),
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps, mapDispatchToProps)(ProjectTable) as any
        ) as any
    ) as any;
