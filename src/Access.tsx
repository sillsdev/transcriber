import React from 'react';
import { Link } from 'react-router-dom';
import { Theme, withStyles, Button } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

export function Access(props: any) {
    const { classes } = props;

    return (
        <div className={classes.root}>
            <AppBar className={classes.appBar} position="static">
                <Toolbar>
                    <Typography variant="h6" color="inherit" className={classes.grow}>
                        {'SIL Transcriber Access'}
              </Typography>
                </Toolbar>
            </AppBar>
            <div className={classes.container}>
                <Paper className={classes.paper}>
                    <h2 className={classes.dialogHeader}>
                        {'Access SIL Transcriber'}
                    </h2>

                    <div className={classes.actions}>
                        <Link to='/neworg' className={classes.link}>
                            <Button
                                variant="raised"
                                className={classes.button}>
                                {'Create an Account'}
                            </Button>
                        </Link>
                    </div>
                    <div className={classes.actions}>
                        <Link to='/organization' className={classes.link}>
                            <Button
                                variant="raised"
                                color="primary"
                                className={classes.button}>
                                {'Access with existing Account'}
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

export default withStyles(styles, { withTheme: true })(Access);
