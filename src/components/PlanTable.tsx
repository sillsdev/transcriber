import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Plan, PlanType, IPlanTableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import Store from '@orbit/store';
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
import { Typography } from '@material-ui/core';

const styles = (theme: Theme) => createStyles({
  root: {
    width: '100%',
  },
  container: {
    display: 'flex',
    justifyContent: 'center'
  },
  paper: theme.mixins.gutters({
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
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

const getPlanRows = (plans: Array<Plan>, typeColumn: Array<string>, countColumn: Array<number>) =>{
  return (
    plans.map((p, i) => ({
      type: p.type,
      id: p.id,
      name: p.attributes.name,
      planType: typeColumn[i],
      sets: (countColumn[i] || '-').toString(),
      delete: p.id,
    })));
}

interface Row {
  type: string;
  id: string;
  name: string;
  planType: string;
  sets: string;
  delete: string;
};

interface IStateProps {
  t: IPlanTableStrings;
};

interface IRecordProps {
  plans: Array<Plan>;
}

interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles>{
  updateStore: any;
  displaySet: (id: string, type: string) => any;
  auth: Auth;
};

export function PlanTable(props: IProps) {
  const { classes, plans, updateStore, auth, t, displaySet } = props;
  const { isAuthenticated } = auth;
  const [dataStore] = useGlobal('dataStore');
  const [columns, setColumns] = useState([
    { name: 'name', title: 'Name' },
    { name: 'planType', title: 'Type' },
    { name: 'sets', title: 'Sets' },
    { name: 'action', title: 'Action' },
  ]);
  const [columnWidth] = useState([
    { columnName: "name", width: 300 },
    { columnName: "planType", width: 100 },
    { columnName: "sets", width: 100 },
    { columnName: "action", width: 150 },
  ]);
  const [typeColumn, setTypeColumn] = useState(Array<string>());
  const [countColumn, setCountColumn] = useState(Array<number>());
  const [rows, setRows] = useState(getPlanRows(plans, typeColumn, countColumn));
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [view, setView] = useState('');
  const [deleteItem, setDeleteItem] = useState('');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_plan, setPlan] = useGlobal('plan');
  const [message, setMessage] = useState(<></>);

  const handleMessageReset = () => { setMessage(<></>) };
  const handleDelete = (e: any) => { setDeleteItem(e.currentTarget.id) };
  const handleDeleteConfirmed = () => {
    updateStore((t: TransformBuilder) => t.removeRecord({
      type: 'plan',
      id: deleteItem,
    }))
  };
  const handleDeleteRefused = () => { setDeleteItem('') };
  const handleAdd = () => {
    setPlan(null);
    setMessage(<span>Add New Plan dialog</span>);
    // setView('/projectstatus?addPlan')
  };
  const handleEdit = () => { setMessage(<span>Edit Plan Dialog</span>) }
  const handleSelect = (e:any) => {
    const plan = plans.filter((p: Plan) => p.attributes.name.toLowerCase() === e.target.innerText.toLowerCase())[0];
    const planId = plan.id;
    setPlan(planId);
    const setDisplayType = async (p: Plan) => {
      let planType = await (dataStore as Store).query(q => q.findRelatedRecord({type: 'plan', id: p.id}, 'plantype')) as PlanType;
      displaySet(planId, planType.attributes.name.toLowerCase() || 'default');
    }
    setDisplayType(plan);
  };

  useEffect(() => {
    const getTypeColumn = async (p: Plan, i: number) => {
      let planType = await (dataStore as Store).query(q => q.findRelatedRecord({type: 'plan', id: p.id}, 'plantype')) as PlanType;
      if (planType != null) {
        typeColumn[i] = planType.attributes.name;
      }
    };
    const getCountColumn = async(p: Plan, i: number) => {
      let sections = await (dataStore as Store).query(q => q.findRelatedRecords({type: 'plan', id: p.id}, 'sections'));
      if (sections != null) {
        countColumn[i] = sections.length;
      }
    };
    for (let i = 0; i < plans.length; i += 1) {
      getTypeColumn(plans[i], i);
      getCountColumn(plans[i], i);
    }
    setTypeColumn(typeColumn);
    setCountColumn(countColumn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setColumns([
      { name: 'name', title: t.name },
      { name: 'planType', title: t.type },
      { name: 'sets', title: t.sections },
      { name: 'action', title: t.action },
    ]);
    setRows(getPlanRows(plans, typeColumn, countColumn));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

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
        <div className={classes.paper}>
          <div className={classes.dialogHeader}>
          <div className={classes.grow} />
          <Typography variant='h5'>
            {t.choosePlan}
          </Typography>
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
        </div>
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
  t: localStrings(state, {layout: "planTable"})
});

const mapRecordsToProps = {
  plans: (q: QueryBuilder) => q.findRecords('plan'),
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps)(PlanTable) as any
        ) as any
    ) as any;
