import * as React from 'react';
import { Theme, withStyles, FormControl, InputLabel, Input, InputAdornment, Button, Icon } from '@material-ui/core';
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

interface ILoginProps extends IStateProps, IDispatchProps, IRecordProps {
    match?: any;
    location?: any;
    classes?: any;
}

class LoginPage extends React.Component<ILoginProps, ICredential> {
    public state: ICredential = {
        email: "",
        password: ""
    };

    private handleEmailAddressChange = (event: any) => {
        this.setState({ email: event.target.value })
    }

    private handlePasswordChange = (event: any) => {
        this.setState({ password: event.target.value })
    }

    private handleLogin = () => {
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
                Transcriber Signup
                </Typography>
            </Toolbar>
            </AppBar>
            <div className={classes.container}>
                <Paper className={classes.paper}>
                    <h2>{'Login'}</h2>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel htmlFor="email">Email Address</InputLabel>
                        <Input
                            value={this.state.email}
                            onChange={this.handleEmailAddressChange}
                            id="email"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Icon>email</Icon>
                                </InputAdornment>}
                        />
                    </FormControl>
                    <FormControl required={true} fullWidth={true} className={classes.field}>
                        <InputLabel htmlFor="password">Password</InputLabel>
                        <Input
                            value={this.state.password}
                            onChange={this.handlePasswordChange}
                            type="password"
                            id="password"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Icon>lock</Icon>
                                </InputAdornment>}
                        />
                    </FormControl>
                    <div className={classes.actions}>
                        <Button variant="raised" className={classes.button}>
                            Cancel
                        </Button>
                        <Button
                            onClick={this.handleLogin}
                            variant="raised"
                            color="primary"
                            className={classes.button}>
                            Submit
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
    actions: theme.mixins.gutters({
        paddingTop: 16,
        paddingBottom: 16,
        marginTop: theme.spacing.unit * 3,
        display: 'flex',
        flexDirection: 'row',
        alignContent: 'center'
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

export default withStyles(styles, { withTheme: true })(withData(mapRecordsToProps)(connect(mapStateToProps, mapDispatchToProps)(LoginPage) as any)  as any) as any;

