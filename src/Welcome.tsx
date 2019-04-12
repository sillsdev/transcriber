import React from 'react';
import { Link } from 'react-router-dom';
import { Theme, withStyles, Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

export function Welcome(props: any) {
    const { classes } = props;

    return (
        <div className={classes.root}>
            <AppBar className={classes.appBar} position="static">
                <Toolbar>
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        {'SIL Transcriber Admin'}
                    </Typography>
                </Toolbar>
            </AppBar>
            <div className={classes.container}>
                <Paper className={classes.paper}>
                    <Typography variant="h4" className={classes.dialogHeader}>
                        {'Thanks for signing up!'}
                    </Typography>
                    <Typography variant="h5" className={classes.text}>
                        {'Do you want to start transcribing immediately?'}
                    </Typography>
                    <div className={classes.actions}>
                        <Button variant="contained" className={classes.button}>
                            {'Transcriber Web'}
                        </Button>
                        <Button variant="contained" className={classes.button}>
                            {'Transcriber Desktop'}
                        </Button>
                    </div>
                    <Typography variant="h5" className={classes.text}>
                        {'Do you want to configure a transcription project?'}
                    </Typography>
                    <div className={classes.actions}>
                        <Link to="/admin">
                            <Button variant="contained" className={classes.button}>
                                {'Transcriber Admin'}
                            </Button>
                        </Link>
                    </div>
                </Paper>
            </div>
        </div>
    );
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

export default withStyles(styles, { withTheme: true })(Welcome);
