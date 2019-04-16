import React, { useState, useEffect } from "react";
import { useGlobal } from 'reactn';
import Organization from './model/organization';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withData } from 'react-orbitjs';
import { QueryBuilder, Record } from '@orbit/data';
import AppBar from "@material-ui/core/AppBar";
import MuiToolbar from "@material-ui/core/Toolbar";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { createStyles, withStyles, Theme } from "@material-ui/core/styles";
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
import SnackBar from "./SnackBar";

class OrganizationData extends React.Component<IRecordProps, object> {
  public render(): JSX.Element {
      return <OrganizationTable {...this.props} />
  }
}

interface Row {
  type: string;
  id: number;
  name: string;
}

// see: https://devexpress.github.io/devextreme-reactive/react/grid/docs/guides/selection/

export function OrganizationTable(props: any) {
  const { classes, organizations } = props;
  const [columns, setColumns] = useState([{ name: "name", title: "Name" }]);
  const [rows, setRows] = useState([]);
  const [view, setView] = useState('');
  const [currentOrganization, setOrganization] = useGlobal('organization');
  const [entryOrganization, setEntryOrganization] = useState(0);
  const [message, setMessage] = useState('');

  const handleSelection = (s: any) => {
    const selectedRow: Row = rows[s[0]];
    setOrganization(selectedRow.id)
    setView('/welcome');
  };
  const handleMessageReset = () => { setMessage('') };

  useEffect(() => {
    setRows(
      organizations.map((o: Organization) => ({
        type: o.type,
        id: (o.keys && o.keys.remoteId) || o.id,
        name: o.attributes.name
      }))
    );
    setEntryOrganization(currentOrganization);
  }, []);

  useEffect(() => {
    if (view === '/welcome' && currentOrganization === null) {
      alert('Please choose an organization')
      setView('')
    }
  }, [view]);

  return view === ''? (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <MuiToolbar>
          <Typography variant="h6" color="inherit" className={classes.grow}>
            {"SIL Transcriber Admin"}
          </Typography>
        </MuiToolbar>
      </AppBar>
      <div className={classes.container}>
        <Paper id="OrganizationTable" className={classes.paper}>
          <h2 className={classes.dialogHeader}>{"Choose Organization"}</h2>
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
  ): <Redirect to={view}/>;
}

const styles = (theme: Theme) =>
  createStyles({
    container: {
      display: "flex",
      justifyContent: "center"
    },
    appBar: theme.mixins.gutters({
      background: "#FFE599",
      color: "black"
    }),
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

  const mapStateToProps = () => ({});
  const mapDispatchToProps = (dispatch: any) => ({
      ...bindActionCreators({
      }, dispatch),
  });
  
  interface IRecordProps {
      organizations: () => Array<Record>;
  }
  
  const mapRecordsToProps = {
      organizations: (q: QueryBuilder) => q.findRecords('organization')
  }
  
  export default withStyles(styles, { withTheme: true })(
      withData(mapRecordsToProps)(
          connect(mapStateToProps, mapDispatchToProps)(OrganizationData) as any
          ) as any
      ) as any;
  