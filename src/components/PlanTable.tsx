import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Plan, PlanType, Section, IPlanTableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { Schema, QueryBuilder, TransformBuilder } from '@orbit/data';
import Store from '@orbit/store';
import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import { Fab, Button, Typography } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import IconButton from '@material-ui/core/IconButton';
import { IntegratedSorting, SortingState } from '@devexpress/dx-react-grid';
import { Grid,
  Table,
  TableColumnResizing,
  TableHeaderRow,
  Toolbar } from '@devexpress/dx-react-grid-material-ui';
import PlanAdd from './PlanAdd';
import SnackBar from "./SnackBar";
import Confirm from './AlertDialog';
import Related from '../utils/related';

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

interface ICell {
  name: string;
  planType: string;
  sections: string;
  action: string;
}

interface IStateProps {
  t: IPlanTableStrings;
};

interface IRecordProps {
  plans: Array<Plan>;
  planTypes: Array<PlanType>;
  sections: Array<Section>;
}

interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles>{
  updateStore: any;
  displaySet: (type: string) => any;
};

export function PlanTable(props: IProps) {
  const { classes, plans, planTypes, sections, updateStore, t, displaySet } = props;
  const [dataStore] = useGlobal('dataStore');
  const [schema] = useGlobal('schema');
  const [project] = useGlobal('project');
  const [columns] = useState([
    { name: 'name', title: t.name },
    { name: 'planType', title: t.type },
    { name: 'sections', title: t.sections },
    { name: 'action', title: t.action },
  ]);
  const [columnWidth] = useState([
    { columnName: "name", width: 300 },
    { columnName: "planType", width: 100 },
    { columnName: "sections", width: 100 },
    { columnName: "action", width: 150 },
  ]);
  const [rows, setRows] = useState(Array<ICell>());
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [view, setView] = useState('');
  const [deleteItem, setDeleteItem] = useState('');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_plan, setPlan] = useGlobal('plan');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogData, setDialogData] = useState(null as Plan|null)
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
    setDialogData(null);
    setDialogVisible(true);
  };
  const handleAddMethod = async (plan: any) => {
    setDialogVisible(false);
    (schema as Schema).initializeRecord(plan)
    await (dataStore as Store).update(t => t.addRecord(plan))
    await (dataStore as Store).update(t => t.replaceRelatedRecord(
      {type: 'plan', id: plan.id},
      'plantype',
      {type: 'plantype', id: plan.attributes.planType}
    ));
    await (dataStore as Store).update(t => t.replaceRelatedRecord(
      {type: 'plan', id: plan.id},
      'project',
      {type: 'project', id: project}
    ));
  }
  const handleAddCancel = () => {
    setDialogVisible(false);
  }
  const handleEdit = (planId: string) => (e:any) => {
    const planRec = plans.filter(p => p.id === planId)
    setDialogData((planRec && planRec.length === 1)? planRec[0]: null)
    setDialogVisible(true)
  }
  const handleEditMethod = async (plan: any) => {
    setDialogVisible(false);
    delete plan.relationships;
    await (dataStore as Store).update(t => t.replaceRecord(plan))
    await (dataStore as Store).update(t => t.replaceRelatedRecord(
      {type: 'plan', id: plan.id},
      'plantype',
      {type: 'plantype', id: plan.attributes.planType}
    ));
  }
  const handleSelect = (planId:string, type:string) => (e:any) => {
    setPlan(planId);
    displaySet(type.toLocaleLowerCase());
  };
  const getType = (p: Plan) => {
    const typeId = Related(p, 'plantype');
    const typeRec = planTypes.filter(pt => pt.id === typeId);
    return typeRec && typeRec.length === 1? typeRec[0].attributes.name: '--';
  }
  const sectionCount = (p: Plan) => {
    return sections.filter(s => Related(s, 'plan') === p.id).length.toString();
  }

  useEffect(() => {
    const projectPlans = plans.filter(p => Related(p, 'project') === project)
    setRows(projectPlans.map((p: Plan) => { return {
      name: p.attributes.name,
      planType: getType(p),
      sections: sectionCount(p),
      action: p.id
    } as ICell }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  const LinkCell = ({ value, style, ...restProps }: {value: string, style: object, row: any, column: any, tableRow: any, tableColumn: any}) => (
    <Table.Cell {...restProps} style={{...style}} value >
      <Button
        key={value}
        aria-label={value}
        color="primary"
        className={classes.link}
        onClick={handleSelect(restProps.row.action, restProps.row.planType)}
      >
        {value}
        <EditIcon className={classes.editIcon} />
      </Button>
    </Table.Cell>
  );

  const ActionCell = ({ value, style, ...restProps }: {value: string, style: object, row: any, column: any, tableRow: any, tableColumn: any}) => (
    <Table.Cell {...restProps} style={{...style}} value >
      <IconButton
        id={'edit-' + value}
        key={'edit-' + value}
        aria-label={'edit-' + value}
        color="default"
        className={classes.actionIcon}
        onClick={handleEdit(restProps.row.action)}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        id={'del-' + value}
        key={'del-' + value}
        aria-label={'del-' + value}
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
              data-testid="addButton"
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
      <PlanAdd
        visible={dialogVisible}
        planIn={dialogData}
        addMethod={handleAddMethod}
        editMethod={handleEditMethod}
        cancelMethod={handleAddCancel} />
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
  planTypes: (q: QueryBuilder) => q.findRecords('plantype'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps)(PlanTable) as any
        ) as any
    ) as any;
