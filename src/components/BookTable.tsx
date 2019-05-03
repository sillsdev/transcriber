import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Book, BookType, IBookTableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
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
import SnackBar from "./SnackBar";
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
  actionIcon: {},
  button: {},
  icon: {},
});

const getBookType = (bookType: number, bookTypes: Array<BookType>) => {
  const findId = bookType.toString();
  const bookTypeRec = bookTypes.filter((t: BookType) => t.id === findId || (t.keys && t.keys.remoteId === findId));
  return bookTypeRec.length === 1? bookTypeRec[0].attributes.name: ' --';
};

const getSetCount = (bookType: number) => {return 0};

const getBookRows = (books: Array<Book>, bookTypes: Array<BookType>) =>{
  return (
    books.map((o: Book) => ({
      type: o.type,
      id: o.id,
      name: o.attributes.name,
      bookType: getBookType(o.attributes.bookTypeId, bookTypes),
      sets: getSetCount(o.attributes.bookTypeId).toString(),
      delete: o.id,
    })));
}

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
  displaySet: (id: string) => any;
  auth: Auth;
};

export function BookTable(props: IProps) {
  const { classes, books, bookTypes, updateStore, auth, t, displaySet } = props;
  const { isAuthenticated } = auth;
  const [columns, setColumns] = useState([
    { name: 'name', title: 'Name' },
    { name: 'bookType', title: 'Type' },
    { name: 'sets', title: 'Sets' },
    { name: 'action', title: 'Action' },
  ]);
  const [columnWidth] = useState([
    { columnName: "name", width: 300 },
    { columnName: "bookType", width: 100 },
    { columnName: "sets", width: 100 },
    { columnName: "action", width: 150 },
  ]);
  const [rows, setRows] = useState(getBookRows(books, bookTypes));
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [view, setView] = useState('');
  const [deleteItem, setDeleteItem] = useState('');
  const [_book, setBook] = useGlobal('book');
  const [message, setMessage] = useState(<></>);

  const handleMessageReset = () => { setMessage(<></>) };
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
    setMessage(<span>Add New Book dialog</span>);
    // setView('/projectstatus?addBook')
  };
  const handleEdit = () => { setMessage(<span>Edit Book Dialog</span>) }
  const handleSelect = (e:any) => {
    const planId = books.filter((p: Book) => p.attributes.name.toLowerCase() === e.target.innerText.toLowerCase())[0].id;
    setBook(planId);
    displaySet(planId);
  };

  useEffect(() => {
    setColumns([
      { name: 'name', title: t.name },
      { name: 'bookType', title: t.type },
      { name: 'sets', title: t.sets },
      { name: 'action', title: t.action },
    ])
    setRows(getBookRows(books, bookTypes));
  }, [books, bookTypes, t.name, t.type, t.sets, t.action]);

  if (!isAuthenticated()) return <Redirect to='/' />;

  const LinkCell = ({ value, style, ...restProps }: {value: string, style: object, row: any, column: any, tableRow: any, tableColumn: any}) => (
    <Table.Cell {...restProps} style={{...style}} value >
      <Button
        key={value}
        aria-label={value}
        color="primary"
        className={classes.link}
        onClick={handleSelect}
      >
        {value}
        <EditIcon className={classes.editIcon} />
      </Button>
    </Table.Cell>
  );

  const ActionCell = ({ value, style, ...restProps }: {value: string, style: object, row: any, column: any, tableRow: any, tableColumn: any}) => (
    <Table.Cell {...restProps} style={{...style}} value >
      <IconButton
        id={value}
        key={value}
        aria-label={value}
        color="default"
        className={classes.actionIcon}
        onClick={handleEdit}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        id={value}
        key={value}
        aria-label={value}
        color="default"
        className={classes.actionIcon}
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
    }
    if (column.name === 'action') {
      return <ActionCell {...props} />
    }
    return <Table.Cell {...props} />
  };

  if (view !== '') return <Redirect to={view} />;

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <Paper id="BookTable" className={classes.paper}>
        <div className={classes.dialogHeader}>
        <div className={classes.grow} />
        <h2>{t.choosePlan}</h2>
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
                defaultColumnWidths={columnWidth}
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
        <SnackBar {...props} message={message} reset={handleMessageReset} />
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
