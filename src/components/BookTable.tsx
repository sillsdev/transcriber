import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Book, BookType, IBookTableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, Record, TransformBuilder } from '@orbit/data';
// import AppBar from '@material-ui/core/AppBar';
// import MuiToolbar from '@material-ui/core/Toolbar';
// import BackIcon from '@material-ui/icons/ArrowBack';
// import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import { IntegratedSorting, SortingState } from '@devexpress/dx-react-grid';
import { Grid,
  Table,
  TableColumnResizing,
  TableHeaderRow,
  Toolbar } from '@devexpress/dx-react-grid-material-ui';
import Confirm from './AlertDialog';
import Auth from '../auth/Auth';

const styles = (theme: Theme) => createStyles({
  root: {
    width: '100%',
  },
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
  link: {},
  deleteIcon: {},
  button: {},
  icon: {},
});

interface Row {
  type: string;
  id: string;
  name: string;
  bookType: string;
  sets: string;
  delete: string;
};

interface IStateProps {
  t: IBookTableStrings;
};

interface IRecordProps {
  books: Array<Book>;
  bookTypes: Array<BookType>;
}

interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles>{
  updateStore: any;
  auth: Auth;
};

export function BookTable(props: IProps) {
  const { classes, books, bookTypes, updateStore, auth, t } = props;
  const { isAuthenticated } = auth;
  const [columns, setColumns] = useState([
    { name: 'name', title: 'Name' },
    { name: 'bookType', title: 'Type' },
    { name: 'sets', title: 'Sets' },
    { name: 'delete', title: 'Delete' },
  ]);
  const [rows, setRows] = useState(Array<Row>());
  const [view, setView] = useState('');
  const [deleteItem, setDeleteItem] = useState('');
  const [book, setBook] = useGlobal('book');

  const handleDelete = (e: any) => { setDeleteItem(e.currentTarget.id) };
  const handleDeleteConfirmed = () => {
    updateStore((t: TransformBuilder) => t.removeRecord({
      type: 'book',
      id: deleteItem,
    }))
  };
  const handleDeleteRefused = () => { setDeleteItem('') };
  const handleAdd = () => {
    setBook(null);
    setView('/projectstatus?addBook')
  };
  // const handleCancel = () => { setView('/admin') };
  const handleEdit = (e:any) => {
    setBook(books.filter((p: Book) => p.attributes.name.toLowerCase() === e.target.innerText.toLowerCase())[0].id);
  };

  const getBookType = (bookType: number) => {
    const findId = bookType.toString();
    const bookTypeRec = bookTypes.filter((t: BookType) => t.id === findId || (t.keys && t.keys.remoteId === findId));
    return bookTypeRec.length === 1? bookTypeRec[0].attributes.name: ' --';
  };

  const getSetCount = (bookType: number) => {return 0};

  useEffect(() => {
    setColumns([
      { name: 'name', title: t.name },
      { name: 'bookType', title: t.type },
      { name: 'sets', title: t.sets },
      { name: 'delete', title: t.delete },
    ])
    setRows(books.map((o: Book) => ({
      type: o.type,
      id: o.id,
      name: o.attributes.name,
      bookType: getBookType(o.attributes.bookTypeId),
      sets: getSetCount(o.attributes.bookTypeId).toString(),
      delete: o.id,
    })))
  }, [books, t.name, t.type, t.sets, t.delete]);

  if (!isAuthenticated()) return <Redirect to='/' />;

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

  if (view !== '') return <Redirect to={view} />;

  return (
    <div className={classes.root}>
      {/* <AppBar className={classes.appBar} position="static">
        <MuiToolbar>
          <IconButton >
            <BackIcon onClick={handleCancel} />
          </IconButton>
          <Typography variant="h6" color="inherit" className={classes.grow}>
            {t.silTranscriberAdmin}
          </Typography>
        </MuiToolbar>
      </AppBar> */}
      <div className={classes.container}>
        <Paper id="BookTable" className={classes.paper}>
        <div className={classes.dialogHeader}>
        <div className={classes.grow} />
        <h2>{t.chooseBook}</h2>
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
                  { columnName: "name", width: 300 },
                  { columnName: "bookType", width: 100 },
                  { columnName: "sets", width: 100 },
                  { columnName: "delete", width: 100 }
                ]}
              />
            <TableHeaderRow showSortingControls={true} />
            <Toolbar />
          </Grid>
        </Paper>
      </div>
      {deleteItem !== ''
        ? <Confirm
            yesResponse={handleDeleteConfirmed}
            noResponse={handleDeleteRefused}
          />
        : <></>}
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "bookTable"})
});

const mapRecordsToProps = {
  books: (q: QueryBuilder) => q.findRecords('book'),
  bookTypes: (q: QueryBuilder) => q.findRecords('booktype'),
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps)(BookTable) as any
        ) as any
    ) as any;
