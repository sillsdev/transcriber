import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Auth from './auth/Auth';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState } from './model/state'
import { IWelcomeStrings } from './model/localizeModel';
import localStrings from './selector/localize';
import { withData } from 'react-orbitjs';
import { Schema, KeyMap } from '@orbit/data';
import Store from '@orbit/store';
import { Theme, withStyles, WithStyles, Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import * as action from './actions';

interface IProps extends IStateProps, IDispatchProps, WithStyles<typeof styles>{
    auth: Auth
};

export function Welcome(props: IProps) {
    const { classes, orbitLoaded, auth, t } = props;
    const { fetchOrbitData, fetchLocalization, setLanguage } = props;
    const { isAuthenticated } = auth;
    const [view, setView] = useState('');
    const [dataStore] = useGlobal('dataStore');
    const [schema] = useGlobal('schema');
    const [keyMap] = useGlobal('keyMap');

    if (!isAuthenticated()) return <Redirect to="/" />;

    useEffect(() => {
        setLanguage(navigator.language.split('-')[0]);
        fetchLocalization();
    }, [])

    if (!orbitLoaded) {
        fetchOrbitData(schema as Schema, dataStore as Store, keyMap as KeyMap, auth);
    };

    return view === ''? (
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
                    <Typography variant="h4" className={classes.dialogHeader}>
                        {t.thanksSigningUp}
                    </Typography>
                    <Typography variant="h5" className={classes.text}>
                        {t.StartTranscribingImmediately}
                    </Typography>
                    <div className={classes.actions}>
                        <Button variant="contained" className={classes.button}>
                            {t.transcriberWeb}
                        </Button>
                        <Button variant="contained" className={classes.button}>
                            {t.transcriberDesktop}
                        </Button>
                    </div>
                    <Typography variant="h5" className={classes.text}>
                        {t.ConfigureTranscriptionProject}
                    </Typography>
                    <div className={classes.actions}>
                        <Link to="/admin">
                            <Button variant="contained" className={classes.button}>
                                {t.transcriberAdmin}
                            </Button>
                        </Link>
                    </div>
                </Paper>
            </div>
        </div>
    ): <Redirect to={view} />;
}

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
        background: '#D9EAD3',
        [theme.breakpoints.down('md')]: {
            width: '100%',
        },
    }),
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
    text: theme.mixins.gutters({
        paddingTop: theme.spacing.unit * 2,
        textAlign: 'center',
    }),
    button: theme.mixins.gutters({
        marginRight: theme.spacing.unit
    }),
});

interface IStateProps {
    t: IWelcomeStrings;
    orbitLoaded: boolean;
};
const mapStateToProps = (state: IState): IStateProps => ({
    t: localStrings(state, {layout: "welcome"}),
    orbitLoaded: state.orbit.loaded,
});

interface IDispatchProps {
    fetchLocalization: typeof action.fetchLocalization;
    setLanguage: typeof action.setLanguage;
    fetchOrbitData: typeof action.fetchOrbitData;
};
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
    ...bindActionCreators({
        fetchLocalization: action.fetchLocalization,
        setLanguage: action.setLanguage,
        fetchOrbitData: action.fetchOrbitData,
    }, dispatch),
});
  
const mapRecordsToProps = { };

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps, mapDispatchToProps)(Welcome) as any
        ) as any
    ) as any;