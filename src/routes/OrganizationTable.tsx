import React, { useState, useEffect } from "react";
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Organization, IOrganizationTableStrings, User } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, Record } from '@orbit/data';
import Paper from "@material-ui/core/Paper";
import { createStyles, withStyles, WithStyles, Theme } from "@material-ui/core/styles";
import {
  IntegratedSelection,
  IntegratedSorting,
  SelectionState,
  SortingState
} from "@devexpress/dx-react-grid";
import {
  Grid,
  Table,
  TableHeaderRow,
  TableSelection,
  Toolbar
} from "@devexpress/dx-react-grid-material-ui";
import TranscriberBar from '../components/TranscriberBar';
import SnackBar from "../components/SnackBar";
import Auth from "../auth/Auth";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
    },
    container: {
      display: "flex",
      justifyContent: "center"
    },
    paper: theme.mixins.gutters({
      paddingTop: 16,
      paddingBottom: 16,
      marginTop: theme.spacing.unit * 3,
      width: "30%",
      display: "flex",
      flexDirection: "column",
      alignContent: "center",
      [theme.breakpoints.down("md")]: {
        width: "100%"
      }
    }),
    dialogHeader: theme.mixins.gutters({
      display: "flex",
      flexDirection: "row",
      justifyContent: "center"
    }),
  });

interface IStateProps {
  t: IOrganizationTableStrings;
};

interface IRecordProps {
  organizations: Array<Organization>;
};

interface Row {
  type: string;
  id: number;
  name: string;
};

// see: https://devexpress.github.io/devextreme-reactive/react/grid/docs/guides/selection/
interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles>{
  auth: Auth;
};

export function OrganizationTable(props: IProps) {
  const { classes, organizations, auth, t } = props;
  const { isAuthenticated } = auth;
  const [columns, setColumns] = useState([{ name: "name", title: "Name" }]);
  const [rows, setRows] = useState([]);
  const [view, setView] = useState('');
  const [currentOrganization, setOrganization] = useGlobal('organization');
  const [message, setMessage] = useState('');

  const handleSelection = (s: any) => {
    const selectedRow: Row = rows[s[0]];
    setOrganization(selectedRow.id)
    setView('/welcome');
  };
  const handleMessageReset = () => { setMessage('') };
  const handleCancel = () => { setView('/admin') };

  useEffect(() => {
    setColumns([{ name: "name", title: t.name }]);
    setRows(
      organizations.map((o: Organization) => ({
        type: o.type,
        id: o.id,
        name: o.attributes.name
      })) as any
    );
  }, [organizations, t.name]);

  useEffect(() => {
    if (view === '/welcome' && currentOrganization === null) {
      alert('Please choose an organization')
      setView('')
    }
  }, [view, currentOrganization]);

  if (!isAuthenticated()) return <Redirect to='/' />;

  if (view !== '') return <Redirect to={view} />;

  return (
    <div className={classes.root}>
      <TranscriberBar {...props} close={handleCancel} />
      <div className={classes.container}>
        <Paper id="OrganizationTable" className={classes.paper}>
          <h2 className={classes.dialogHeader}>
            {t.chooseOrganization}
          </h2>
          <Grid rows={rows} columns={columns}>
            <SortingState
              defaultSorting={[{ columnName: "name", direction: "asc" }]}
            />
            <SelectionState onSelectionChange={handleSelection} />
            <IntegratedSorting />
            <IntegratedSelection />
            <Table />
            <TableSelection selectByRowClick={true} showSelectionColumn={false}/>
            <TableHeaderRow showSortingControls={true} />
            <Toolbar />
          </Grid>
        </Paper>
      </div>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "organizationTable"}),
});
  
const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization')
};

export default withStyles(styles, { withTheme: true })(
  withData(mapRecordsToProps)(
    connect(mapStateToProps)(OrganizationTable) as any
  ) as any
) as any;
  