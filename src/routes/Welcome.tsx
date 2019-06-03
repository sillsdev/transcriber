import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IWelcomeStrings, User, Organization } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { Schema, KeyMap, QueryBuilder } from '@orbit/data';
import Store from '@orbit/store';
import { Theme, withStyles, WithStyles, Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TranscriberBar from '../components/TranscriberBar';
import * as action from '../actions';

const styles = (theme: Theme) => ({ 
    root: {
        width: '100%',
      },
      container: {
        display: 'flex',
        justifyContent: 'center'
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
    dialogHeader: theme.mixins.gutters({
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
    }),
    actions: theme.mixins.gutters({
        paddingTop: 16,
        paddingBottom: 16,
        marginTop: theme.spacing(3),
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
    }),
    text: theme.mixins.gutters({
        paddingTop: theme.spacing(2),
        textAlign: 'center',
    }),
    button: theme.mixins.gutters({
        marginRight: theme.spacing(1),
    }),
});

interface IStateProps {
    t: IWelcomeStrings;
    orbitLoaded: boolean;
};

interface IDispatchProps {
    fetchLocalization: typeof action.fetchLocalization;
    setLanguage: typeof action.setLanguage;
    fetchOrbitData: typeof action.fetchOrbitData;
};

interface IRecordProps {
    users: Array<User>;
}

interface IProps extends IStateProps, IRecordProps, IDispatchProps, WithStyles<typeof styles>{
    auth: Auth
};

export function Welcome(props: IProps) {
    const { classes, orbitLoaded, auth, t, users } = props;
    const { fetchOrbitData, fetchLocalization, setLanguage } = props;
    const { isAuthenticated } = auth;
    const [dataStore] = useGlobal('dataStore');
    const [schema] = useGlobal('schema');
    const [keyMap] = useGlobal('keyMap');
    const [user, setUser] = useGlobal('user');
    const [organization] = useGlobal('organization');
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [initials, setInitials] = useGlobal('initials');
    const [orgName, setOrgName] = useState('');
    /* eslint-enable @typescript-eslint/no-unused-vars */

    useEffect(() => {
        setLanguage(navigator.language.split('-')[0]);
        fetchLocalization();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [])

    useEffect(() => {
        if (user === null) {
            if (users.length === 1) {
                setUser(users[0].id)
                setInitials(users[0].attributes.name.trim().split(' ').map((s: string) => s.slice(0,1).toLocaleUpperCase()).join(''))
            }
        }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [user, users])

    useEffect(() => {
        if (organization !== null) {
            (dataStore as Store).query(q => q.findRecord({type: 'organization', id: organization as string}))
                .then((organizationRec: Organization) => {
                    setOrgName(organizationRec.attributes.name);
                })
        }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [organization])

    if (!isAuthenticated()) return <Redirect to="/" />;

    if (!orbitLoaded) {
        fetchOrbitData(schema as Schema, dataStore as Store, keyMap as KeyMap, auth);
    };

    if (organization === null) return <Redirect to="/organization" />;

    if (orbitLoaded) {
        return <Redirect to="/admin" />;
    }

    return (
        <div className={classes.root}>
            <TranscriberBar {...props} search={false} />
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
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
    ...bindActionCreators({
        fetchLocalization: action.fetchLocalization,
        setLanguage: action.setLanguage,
        fetchOrbitData: action.fetchOrbitData,
    }, dispatch),
});
  
const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user')
};

export default withStyles(styles, { withTheme: true })(
  withData(mapRecordsToProps)(
    connect(mapStateToProps, mapDispatchToProps)(Welcome) as any
  ) as any
) as any;
