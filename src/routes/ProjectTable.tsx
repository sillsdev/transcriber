import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Project, Group, IProjectTableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { Paper, Fab, Button, IconButton, Typography } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme,
} from '@material-ui/core/styles';
import { IntegratedSorting, SortingState } from '@devexpress/dx-react-grid';
import {
  Grid,
  Table,
  TableColumnResizing,
  TableHeaderRow,
  Toolbar,
} from '@devexpress/dx-react-grid-material-ui';
import TranscriberBar from '../components/TranscriberBar';
import Confirm from '../components/AlertDialog';
import Auth from '../auth/Auth';
import Related from '../utils/related';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
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
    grow: {
      flexGrow: 1,
    },
    dialogHeader: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }),
    editIcon: {
      fontSize: 16,
    },
    link: {},
    deleteIcon: {},
    button: {},
    icon: {},
  });

interface Row {
  type: string;
  id: number;
  name: string;
  description: string;
  language: string;
  delete: string;
}

interface IRecordProps {
  projects: Array<Project>;
  groups: Array<Group>;
}

interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles> {
  projects: any;
  updateStore: any;
  auth: Auth;
}

export function ProjectTable(props: IProps) {
  const { classes, projects, groups, updateStore, auth, t } = props;
  const { isAuthenticated } = auth;
  const [organization] = useGlobal('organization');
  const [columns, setColumns] = useState([
    { name: 'name', title: 'Name' },
    { name: 'description', title: 'Description' },
    { name: 'language', title: 'Language' },
    { name: 'delete', title: 'Delete' },
  ]);
  const [rows, setRows] = useState(Array<Row>());
  const [view, setView] = useState('');
  const [deleteItem, setDeleteItem] = useState('');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_project, setProject] = useGlobal('project');

  const handleDelete = (e: any) => {
    setDeleteItem(e.currentTarget.id);
  };
  const handleDeleteConfirmed = () => {
    updateStore((t: TransformBuilder) =>
      t.removeRecord({
        type: 'project',
        id: deleteItem,
      })
    );
  };
  const handleDeleteRefused = () => {
    setDeleteItem('');
  };
  const handleAdd = () => {
    setProject(null);
    setView('/projectstatus?add');
  };
  const handleCancel = () => {
    setView('/main');
  };
  const handleEdit = (e: any) => {
    if (projects && projects.length > 0)
      setProject(
        projects.filter(
          (p: Project) =>
            (p.attributes &&
              p.attributes.name &&
              p.attributes.name.toLowerCase()) ===
            e.currentTarget.innerText.trim().toLowerCase()
        )[0].id
      );
    setView('/projectstatus');
  };

  useEffect(() => {
    const orgProjects = projects.filter((p: Project) => {
      const groupId = Related(p, 'group');
      const group = groups.filter(g => g.id === groupId);
      const g = group.length === 1 ? group[0] : false;
      return Related(g, 'owner') === organization;
    });
    setColumns([
      { name: 'name', title: t.name },
      { name: 'description', title: t.description },
      { name: 'language', title: t.language },
      { name: 'delete', title: t.delete },
    ]);
    setRows(
      orgProjects.map((o: Project) => ({
        type: o.type,
        id: o.id,
        name: o.attributes.name,
        description: o.attributes.description,
        language: o.attributes.language,
        delete: o.id,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, organization]);

  if (!isAuthenticated()) return <Redirect to="/" />;

  const LinkCell = ({
    value,
    style,
    ...restProps
  }: {
    value: string;
    style: object;
    row: any;
    column: any;
    tableRow: any;
    tableColumn: any;
  }) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
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

  const DeleteCell = ({
    value,
    style,
    ...restProps
  }: {
    value: string;
    style: object;
    row: any;
    column: any;
    tableRow: any;
    tableColumn: any;
  }) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
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
      return <LinkCell {...props} />;
    } else if (column.name === 'delete') {
      return <DeleteCell {...props} />;
    }
    return <Table.Cell {...props} />;
  };

  if (view !== '') return <Redirect to={view} />;

  return (
    <div className={classes.root}>
      <TranscriberBar {...props} close={handleCancel} />
      <div className={classes.container}>
        <Paper id="ProjectTable" className={classes.paper}>
          <div className={classes.dialogHeader}>
            <div className={classes.grow} />
            <Typography variant="h5">{t.chooseProject}</Typography>
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
              defaultSorting={[{ columnName: 'name', direction: 'asc' }]}
            />
            <IntegratedSorting />
            <Table cellComponent={Cell} />
            <TableColumnResizing
              minColumnWidth={50}
              defaultColumnWidths={[
                { columnName: 'name', width: 200 },
                { columnName: 'description', width: 400 },
                { columnName: 'language', width: 100 },
                { columnName: 'delete', width: 100 },
              ]}
            />
            <TableHeaderRow showSortingControls={true} />
            <Toolbar />
          </Grid>
        </Paper>
      </div>
      {deleteItem !== '' ? (
        <Confirm
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      ) : (
        <></>
      )}
    </div>
  );
}

interface IStateProps {
  t: IProjectTableStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'projectTable' }),
});

const mapRecordsToProps = {
  projects: (q: QueryBuilder) => q.findRecords('project'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withStyles(styles, { withTheme: true })(withData(
  mapRecordsToProps
)(connect(mapStateToProps)(ProjectTable) as any) as any) as any;
