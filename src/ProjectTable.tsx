import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Project from './model/project';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withData } from 'react-orbitjs';
import { QueryBuilder, Record, TransformBuilder } from '@orbit/data';
import AppBar from '@material-ui/core/AppBar';
import MuiToolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import BackIcon from '@material-ui/icons/ArrowBack';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, withStyles, Theme } from '@material-ui/core/styles';
import { IntegratedSorting, SortingState } from '@devexpress/dx-react-grid';
import { Grid, Table, TableColumnResizing,
  TableHeaderRow, Toolbar } from '@devexpress/dx-react-grid-material-ui';

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
  delete: string;
}

export function ProjectTable(props: any) {
  const { classes, projects, updateStore } = props;
  const [columns, setColumns] = useState([
    { name: 'name', title: 'Name' },
    { name: 'description', title: 'Description' },
    { name: 'language', title: 'Language' },
    { name: 'delete', title: 'Delete' },
  ]);
  const [rows, setRows] = useState([]);
  const [view, setView] = useState('');
  const [project, setProject] = useGlobal('project');

  const handleDelete = (e:any) => {
    updateStore((t: TransformBuilder) => t.removeRecord({
      type: 'project',
      id: e.currentTarget.id
    }))
  };
  const handleAdd = () => { alert('Add') };
  const handleCancel = () => { setView('/admin') };
  const handleEdit = (e:any) => {
    setProject(projects.filter((p: Project) => p.attributes.name.toLowerCase() === e.target.innerText.toLowerCase())[0].id);
    setView('/projectstatus')
  };

  useEffect(() => {
    setRows(projects.map((o: Project) => ({
      type: o.type,
      id: o.id,
      name: o.attributes.name,
      description: o.attributes.description,
      language: o.attributes.language,
      delete: o.id,
    })))
  }, []);

  const LinkCell = ({ value, style, ...restProps }: {value: string, style: object, row: any, column: any, tableRow: any, tableColumn: any}) => (
    <Table.Cell {...restProps} style={{...style}} value >
      <Button
        key={value}
        aria-label={value}
        color="primary"
        className={classes.link}
        onClick={handleEdit}
      >
        {value}
        <EditIcon className={classes.editIcon} />
      </Button>
    </Table.Cell>
  );

  const DeleteCell = ({ value, style, ...restProps }: {value: string, style: object, row: any, column: any, tableRow: any, tableColumn: any}) => (
    <Table.Cell {...restProps} style={{...style}} value >
      <IconButton
        id={value}
        key={value}
        aria-label={value}
        color="default"
        className={classes.deleteIcon}
        onClick={handleDelete}
      >
        <DeleteIcon />
      </IconButton>
    </Table.Cell>
  );

  const Cell = (props: any) => {
    const { column } = props;
    if (column.name === 'name') {
      return <LinkCell {...props} />
    } else if (column.name === 'delete') {
      return <DeleteCell {...props} />
    }
    return <Table.Cell {...props} />
  };

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
        <div className={classes.dialogHeader}>
        <div className={classes.grow} />
        <h2>{"Choose Project"}</h2>
        <div className={classes.grow} />
          <Fab
            key="add"
            aria-label="Add"
            color="primary"
            className={classes.button}
            onClick={handleAdd}
          >
            <AddIcon className={classes.icon} />
          </Fab>
        </div>
        <Grid rows={rows} columns={columns}>
          <SortingState
            defaultSorting={[{ columnName: "name", direction: "asc" }]}
          />
            <IntegratedSorting />
            <Table cellComponent={Cell} />
              <TableColumnResizing
                minColumnWidth={50}
                defaultColumnWidths={[
                  { columnName: "name", width: 200 },
                  { columnName: "description", width: 400 },
                  { columnName: "language", width: 100 },
                  { columnName: "delete", width: 100 }
                ]}
              />
            <TableHeaderRow showSortingControls={true} />
            <Toolbar />
          </Grid>
        </Paper>
      </div>
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
  grow: {
    flexGrow: 1,
  },
  dialogHeader: theme.mixins.gutters({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center'
  }),
  editIcon: {
    fontSize: 16,
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
