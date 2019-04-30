import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IWelcomeStrings, User, Organization } from '../model';
import localStrings from '../selector/localize';
import { Schema, KeyMap, QueryBuilder, FilterSpecifier } from '@orbit/data';
import Store from '@orbit/store';
import { Theme, withStyles, WithStyles, Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Avatar from '@material-ui/core/Avatar';
import * as action from '../actions';
import { userInfo } from 'os';

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
    avatar: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
    },
});

interface IStateProps {
    t: IWelcomeStrings;
    orbitLoaded: boolean;
    initials: string;
    user: User;
};

interface IDispatchProps {
    fetchLocalization: typeof action.fetchLocalization;
    setLanguage: typeof action.setLanguage;
    fetchAuthUser: typeof action.fetchAuthUser;
    fetchOrbitData: typeof action.fetchOrbitData;
};

interface IProps extends IStateProps, IDispatchProps, WithStyles<typeof styles>{
    auth: Auth
};

export function Welcome(props: IProps) {
    const { classes, orbitLoaded, auth, t, initials, user } = props;
    const { fetchOrbitData, fetchAuthUser, fetchLocalization, setLanguage } = props;
    const { isAuthenticated } = auth;
    const [dataStore] = useGlobal('dataStore');
    const [schema] = useGlobal('schema');
    const [keyMap] = useGlobal('keyMap');
    const [organization] = useGlobal('organization');
    const [orgName, setOrgName] = useState('');
    const [view, setView] = useState('');

    const handleOrganizationChange = () => { setView('/organization')}

    useEffect(() => {
        setLanguage(navigator.language.split('-')[0]);
        fetchLocalization();
        fetchAuthUser(auth);
    }, [])

    useEffect(() => {
        if (organization !== null) {
            (dataStore as Store).query(q => q.findRecord({type: 'organization', id: organization as string})).
                then((organizationRec: Organization) => {
                    setOrgName(organizationRec.attributes.name);
                })
        }
    }, [organization])

    if (!isAuthenticated()) return <Redirect to="/" />;

    if (!orbitLoaded) {
        fetchOrbitData(schema as Schema, dataStore as Store, keyMap as KeyMap, auth);
    };

    if (view !== '') return <Redirect to={view} />;

    if (organization === null) return <Redirect to="/organization" />;

    return (
        <div className={classes.root}>
            <AppBar className={classes.appBar} position="static">
                <Toolbar>
                    <Button className={classes.button} onClick={handleOrganizationChange}>
                        <Typography variant="h6" color="inherit">
                            {orgName}
                        </Typography>
                    </Button>
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        {t.transcriberAdmin}
                    </Typography>
                    <div className={classes.grow} />
                    <Avatar className={classes.avatar} >
                        {initials}
                    </Avatar>
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
    );
};

const mapStateToProps = (state: IState): IStateProps => ({
    t: localStrings(state, {layout: "welcome"}),
    orbitLoaded: state.orbit.loaded,
    initials: state.who.initials,
    user: state.who.user,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
    ...bindActionCreators({
        fetchLocalization: action.fetchLocalization,
        setLanguage: action.setLanguage,
        fetchAuthUser: action.fetchAuthUser,
        fetchOrbitData: action.fetchOrbitData,
    }, dispatch),
});
  
  export default withStyles(styles, { withTheme: true })(
        connect(mapStateToProps, mapDispatchToProps)(Welcome) as any
    ) as any;
  