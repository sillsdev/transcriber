import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Theme, withStyles, FormControl, InputLabel, Input, Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

export function CreateOrg(props: any) {
    const { classes } = props;
    const [findOrganization, setFindOrganization] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [view, setView] = useState('');

    const handleFindOrganizationChange = (e: any) => { setFindOrganization(e.target.value) };
    const handleOrganizationNameChange = (e: any) => { setOrganizationName(e.target.value) };
    const handleCancel = () => { setView('/access') };
    const handleContinue = () => { setView('/admin') };

    return view === ''? (
        <div className={classes.root}>
            <AppBar className={classes.appBar} position="static">
                <Toolbar>
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        SIL Transcriber Admin
              </Typography>
                </Toolbar>
            </AppBar>
            <div className={classes.container}>
                <Paper className={classes.paper}>
                    <h2 className={classes.dialogHeader}>
                        {'Create Organization'}
                    </h2>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel>Find an existing Organization</InputLabel>
                        <Input
                            value={findOrganization}
                            onChange={handleFindOrganizationChange}
                            id="findOrganization"
                        />
                    </FormControl>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel>Organization Name</InputLabel>
                        <Input
                            value={organizationName}
                            onChange={handleOrganizationNameChange}
                            id="findOrganization"
                        />
                    </FormControl>
                    <div className={classes.actions}>
                        <Button
                            onClick={handleCancel}
                            variant="raised"
                            className={classes.button}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleContinue}
                            variant="raised"
                            color="primary"
                            className={classes.button}>
                            Continue
                        </Button>
                    </div>
                </Paper>
            </div>
        </div>
    ): <Redirect to={view}/>;
}

const styles = (theme: Theme) => ({
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

export default withStyles(styles, { withTheme: true })(CreateOrg);
