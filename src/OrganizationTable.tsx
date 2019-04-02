import React, { useState, useEffect } from "react";
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import axios from "axios";
import dataSource from "./dataSource";
import AppBar from "@material-ui/core/AppBar";
import MuiToolbar from "@material-ui/core/Toolbar";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { createStyles, withStyles, Theme } from "@material-ui/core/styles";
import {
  FilteringState,
  IntegratedFiltering,
  IntegratedPaging,
  IntegratedSelection,
  IntegratedSorting,
  PagingState,
  SelectionState,
  SortingState
} from "@devexpress/dx-react-grid";
import {
  DragDropProvider,
  Grid,
  PagingPanel,
  Table,
  TableColumnResizing,
  TableFilterRow,
  TableHeaderRow,
  TableSelection,
  Toolbar
} from "@devexpress/dx-react-grid-material-ui";
import { NONAME } from "dns";

interface TableRelationship {
  links: { self: string; related: string };
  data: { type: string; id: string };
}

interface Organization {
  type: string;
  id: string;
  attributes: {
    name: string;
    "website-url": string;
    "logo-url": string;
    "public-by-default": string;
  };
  relationships: {
    owner: TableRelationship;
  };
}

interface Row {
  type: string;
  id: number;
  name: string;
}

// see: https://devexpress.github.io/devextreme-reactive/react/grid/docs/guides/selection/

export function OrganizationTable(props: any) {
  const { classes } = props;
  const [columns, setColumns] = useState([{ name: "name", title: "Name" }]);
  const [pageSizes, setPageSizes] = useState([5, 10, 15]);
  const [rows, setRows] = useState([]);
  const [view, setView] = useState('');
  const [currentOrganization, setOrganization] = useGlobal('organization');


  const handleCancel = () => {setView('/access')};
  const handleContinue = () => {setView('/welcome')};
  const handleSelection = (s: any) => {
    if (s.length !== 1) {
      alert('One organization should be selected');
    } else {
      const selectedRow: Row = rows[s[0]];
      setOrganization(selectedRow.name)
    }
  };

  useEffect(() => {
    const [url, doc] = dataSource();
    axios(url + "/organizations" + doc).then(result =>
      setRows(
        result.data.data.map((o: Organization) => ({
          type: o.type,
          id: o.id,
          name: o.attributes.name
        }))
      )
    );
  }, []);

  useEffect(() => {
    if (view === '/welcome' && currentOrganization === null) {
      alert('Please choose an organization')
      setView('')
    }
  }, [view]);

  return view === '' || (view === '/welcome' && currentOrganization === null)? (
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
              defaultColumnWidths={[{ columnName: "name", width: 200 }]}
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
                className={classes.button}
              >
                {'Cancel'}
              </Button>
              <Button
                onClick={handleContinue}
                variant="raised"
                color="primary"
                className={classes.button}
              >
                {'Continue'}
              </Button>
          </div>
        </Paper>
      </div>
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
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: "flex",
      flexDirection: "row",
      justifyContent: "right"
    }),
    button: {
      marginRight: theme.spacing.unit
    }
  });

export default withStyles(styles, { withTheme: true })(
  OrganizationTable
) as any;
