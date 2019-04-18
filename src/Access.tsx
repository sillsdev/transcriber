import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState } from './model/state'
import { IAccessStrings } from './model/localizeModel';
import localStrings from './selector/localize';
import * as action from './actions/localizationActions';
import { Theme, withStyles, Button, WithStyles } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

interface IProps extends IStateProps, IDispatchProps, WithStyles<typeof styles>{
    history: any;
    auth: any;
};

export function Access(props: IProps) {
    const { classes, auth, t } = props;
    const { fetchLocalization, setLanguage } = props;

    useEffect(() => {
        const qLang = queryString.parse(props.history.location.search).lang;
        if (qLang) { setLanguage(qLang.toString()) };
        fetchLocalization();
    }, [])

    return (
        <div className={classes.root}>
            <AppBar className={classes.appBar} position="static">
                <Toolbar>
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        {t.silTranscriberAccess}
                    </Typography>
                </Toolbar>
            </AppBar>
            <div className={classes.container}>
                <Paper className={classes.paper}>
                    <h2 className={classes.dialogHeader}>
                        {t.accessSilTranscriber}
                    </h2>

                    <div className={classes.actions}>
                        <Link to='/neworg' className={classes.link}>
                            <Button
                                variant="raised"
                                className={classes.button}>
                                {t.createAccount}
                            </Button>
                        </Link>
                    </div>
                    <div className={classes.actions}>
                            <Button
                                variant="raised"
                                color="primary"
                                className={classes.button}
                                onClick= {() => auth.login()}
                            >
                                {t.accessExistingAccount}
                            </Button>
                    </div>
                </Paper>
            </div>
        </div>
    );
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
    link: {
        textDecoration: 'none',
    },
    button: {
        marginRight: theme.spacing.unit
    },
});

interface IStateProps {
    t: IAccessStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
    t: localStrings(state, {layout: "access"})
});

interface IDispatchProps {
    fetchLocalization: typeof action.fetchLocalization;
    setLanguage: typeof action.setLanguage;
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
    ...bindActionCreators({
        fetchLocalization: action.fetchLocalization,
        setLanguage: action.setLanguage,
    }, dispatch),
});

export default withStyles(styles, { withTheme: true })(
        connect(mapStateToProps, mapDispatchToProps)(Access) as any
    ) as any;
