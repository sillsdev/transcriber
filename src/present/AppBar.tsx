import React from 'react';
import { Redirect } from 'react-router-dom';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';

const styles = createStyles({
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
});

const initialState = {
  login: false,
}

export interface Props extends WithStyles<typeof styles> {
  history: {
    location: {
        pathname: string;
    }
  }
}

export class ButtonAppBar extends React.Component<Props, typeof initialState>{
  public state = {...initialState};

  private handleLogin = () => {
    this.setState({login: true});
  }

  public render(): JSX.Element {
    const { classes } = this.props;

    if (this.state.login && this.props.history.location.pathname.length === 1) {
      return (<Redirect to='/login' />)
    }

    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <IconButton className={classes.menuButton} color="inherit" aria-label="Menu">
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              Transcriber Admin
            </Typography>
            <Button color="inherit" onClick={this.handleLogin}>Login</Button>
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

export default withStyles(styles)(ButtonAppBar);