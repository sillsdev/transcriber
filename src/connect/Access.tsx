import * as React from 'react';
import { Theme, withStyles, Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withData } from 'react-orbitjs';
import { QueryBuilder, Record } from '@orbit/data';
import { IState, ICredential } from '../model/state';
import * as action from '../action/userActions';
import * as querystring from 'querystring';
import { Redirect } from 'react-router';

interface IAccessProps extends IStateProps, IDispatchProps, IRecordProps {
    match?: any;
    location?: any;
    classes?: any;
}

class AccessPage extends React.Component<IAccessProps, ICredential> {
    public state: ICredential = {
        email: "Admin",
        password: ""
    };

    private handleAccess = () => {
        const selectedUser = this.props.validUsers.filter((u: Record) => u.attributes && u.attributes.fullName &&  u.attributes.fullName === this.state.email);
        if (selectedUser.length === 1) {
            this.props.loginUser(this.state);
        }
    }

    public render(): JSX.Element {
        const classes = this.props.classes;

        if (this.props.user) {
            const path: string = querystring.
                parse((this.props.location.search as string).substr(1)).redirect as any || '/main';
            return <Redirect to={path} />
        }

        return (
            <div className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        SIL Transcriber Access
                    </Typography>
                </Toolbar>
            </AppBar>
            <div className={classes.container}>
                <Paper className={classes.paper}>
                    <h2 className={classes.dialogHeader}>
                        {'Access SIL Transcriber'}
                    </h2>
                    <div className={classes.actions}>
                        <Button variant="raised" className={classes.button}>
                            Create an Account
                        </Button>
                    </div>
                    <div className={classes.actions}>
                        <Button
                            onClick={this.handleAccess}
                            variant="raised"
                            color="primary"
                            className={classes.button}>
                            Access with existing Account
                        </Button>
                    </div>
                </Paper>
            </div>
        </div>

        );
    }
}

const styles = (theme: Theme) => ({
    container: {
        display: 'flex',
        justifyContent: 'center'
    },
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
    user: string;
};

const mapStateToProps = (state: IState): IStateProps => ({
    user: state.user.email,
});

interface IDispatchProps {
    loginUser: typeof action.loginUser;
};

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
    ...bindActionCreators({
        loginUser: action.loginUser,
    }, dispatch),
});

interface IRecordProps {
    validUsers: Array<Record>;
}

const mapRecordsToProps = {
    validUsers: (q: QueryBuilder) => q.findRecords("user")
}

export default withStyles(styles, { withTheme: true })(withData(mapRecordsToProps)(connect(mapStateToProps, mapDispatchToProps)(AccessPage) as any)  as any) as any;

