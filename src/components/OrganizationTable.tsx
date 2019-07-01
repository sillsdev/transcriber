import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Organization, IOrganizationTableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { Paper, Typography } from '@material-ui/core';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme,
} from '@material-ui/core/styles';
import {
  IntegratedSelection,
  IntegratedSorting,
  SelectionState,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid,
  Table,
  TableHeaderRow,
  TableSelection,
  Toolbar,
} from '@devexpress/dx-react-grid-material-ui';
import SnackBar from './SnackBar';
import Auth from '../auth/Auth';
import hasRelated from '../utils/hasRelated';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
    },
    container: {
      display: 'flex',
      justifyContent: 'center',
    },
    paper: theme.mixins.gutters({
      paddingTop: 16,
      paddingBottom: 16,
      marginTop: theme.spacing(3),
      width: '30%',
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      [theme.breakpoints.down('md')]: {
        width: '100%',
      },
    }),
    fullPaper: {
      padding: 0,
      margin: 0,
    },
    dialogHeader: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }),
  });

interface IStateProps {
  t: IOrganizationTableStrings;
}

interface IRecordProps {
  organizations: Array<Organization>;
}

interface Row {
  type: string;
  id: number;
  name: string;
}

// see: https://devexpress.github.io/devextreme-reactive/react/grid/docs/guides/selection/
interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles> {
  auth: Auth;
}

export function OrganizationTable(props: IProps) {
  const { classes, organizations, auth, t } = props;
  const [user] = useGlobal('user');
  const { isAuthenticated } = auth;
  const [columns, setColumns] = useState([{ name: 'name', title: 'Name' }]);
  const [rows, setRows] = useState([]);
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_Organization, setOrganization] = useGlobal('organization');
  const [message, setMessage] = useState(<></>);

  const handleSelection = (s: any) => {
    const selectedRow: Row = rows[s[0]];
    setOrganization(selectedRow.id);
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };

  useEffect(() => {
    // since find related records doesn't work...
    const orgs = organizations.filter(o =>
      hasRelated(o, 'users', user as string)
    );
    setColumns([{ name: 'name', title: t.name }]);
    setRows(orgs.map((o: Organization) => ({
      type: o.type,
      id: o.id,
      name: o.attributes.name,
    })) as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations, user]);

  if (!isAuthenticated()) return <Redirect to="/" />;

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <Paper
          id="OrganizationTable"
          className={clsx(classes.paper, {
            [classes.fullPaper]: true,
          })}
        >
          <Typography variant="h5" className={classes.dialogHeader}>
            {t.chooseOrganization}
          </Typography>
          <Grid rows={rows} columns={columns}>
            <SortingState
              defaultSorting={[{ columnName: 'name', direction: 'asc' }]}
            />
            <SelectionState onSelectionChange={handleSelection} />
            <IntegratedSorting />
            <IntegratedSelection />
            <Table />
            <TableSelection
              selectByRowClick={true}
              showSelectionColumn={false}
            />
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
  t: localStrings(state, { layout: 'organizationTable' }),
});

const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
};

export default withStyles(styles, { withTheme: true })(withData(
  mapRecordsToProps
)(connect(mapStateToProps)(OrganizationTable) as any) as any) as any;
