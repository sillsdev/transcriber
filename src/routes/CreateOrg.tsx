import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, ICreateorgStrings } from '../model';
import localStrings from '../selector/localize';
import { Theme,
    withStyles,
    WithStyles,
    FormControl,
    InputLabel,
    Input,
    Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

const styles = (theme: Theme) => ({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
    },
    container: {
        display: 'flex',
        justifyContent: 'center'
    },
    appBar: theme.mixins.gutters({
        // background: '#FFE599',
        // color: 'black'
    }),
    paper: theme.mixins.gutters({
        paddingTop: 16,
        paddingBottom: 16,
        marginTop: theme.spacing.unit * 3,
        width: '30%',
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'center',
        [theme.breakpoints.down('md')]: {
            width: '100%',
        },
    }),
    field: {
        marginTop: theme.spacing.unit * 3
    },
    dialogHeader: theme.mixins.gutters({
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
    }),
    actions: theme.mixins.gutters({
        paddingTop: 16,
        paddingBottom: 16,
        marginTop: theme.spacing.unit * 3,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
    }),
    button: {
        marginRight: theme.spacing.unit
    },
});

interface IStateProps {
    t: ICreateorgStrings;
};

interface IProps extends IStateProps, WithStyles<typeof styles>{ };

export function CreateOrg(props: IProps) {
    const { classes, t } = props;
    const [findOrganization, setFindOrganization] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [view, setView] = useState('');

    const handleFindOrganizationChange = (e: any) => { setFindOrganization(e.target.value) };
    const handleOrganizationNameChange = (e: any) => { setOrganizationName(e.target.value) };
    const handleCancel = () => { setView('/access') };
    const handleContinue = () => { setView('/admin') };

    if (view !== '') return <Redirect to={view} />;

    return (
        <div className={classes.root}>
            <AppBar className={classes.appBar} position="static">
                <Toolbar>
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        {t.silTranscriberAdmin}
              </Typography>
                </Toolbar>
            </AppBar>
            <div className={classes.container}>
                <Paper className={classes.paper}>
                    <Typography variant='h5' className={classes.dialogHeader}>
                        {t.createOrganization}
                    </Typography>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel>{t.findExistingOrganization}</InputLabel>
                        <Input
                            value={findOrganization}
                            onChange={handleFindOrganizationChange}
                            id="find-organization"
                        />
                    </FormControl>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel>{t.organizationName}</InputLabel>
                        <Input
                            value={organizationName}
                            onChange={handleOrganizationNameChange}
                            id="organization-name"
                        />
                    </FormControl>
                    <div className={classes.actions}>
                        <Button
                            onClick={handleCancel}
                            variant="contained"
                            className={classes.button}>
                            {t.cancel}
                        </Button>
                        <Button
                            onClick={handleContinue}
                            variant="contained"
                            color="primary"
                            className={classes.button}>
                            {t.continue}
                        </Button>
                    </div>
                </Paper>
            </div>
        </div>
    );
}

const mapStateToProps = (state: IState): IStateProps => ({
    t: localStrings(state, {layout: "createorg"})
});

export default withStyles(styles, { withTheme: true })(
    connect(mapStateToProps)(CreateOrg) as any
) as any;
  