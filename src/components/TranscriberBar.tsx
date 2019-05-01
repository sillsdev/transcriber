import React, { useState, useEffect } from "react";
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Organization, IAdminpanelStrings } from '../model';
import localStrings from '../selector/localize';
import Store from '@orbit/store';
import classNames from 'classnames';
import { createStyles, withStyles, WithStyles, Theme } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import BackIcon from '@material-ui/icons/ArrowBack';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
import SearchIcon from '@material-ui/icons/Search';
import Avatar from '@material-ui/core/Avatar';
import { fade } from '@material-ui/core/styles/colorManipulator';

const styles = (theme: Theme) => createStyles({
  grow: {
    flexGrow: 1,
  },
  appBar: theme.mixins.gutters({
    background: '#FFE599',
    color: 'black'
  }),
  menuButton: {
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
  },
  hide: {
    display: 'none',
  },
  title: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing.unit,
      width: 'auto',
    },
  },
  searchIcon: {
    width: theme.spacing.unit * 9,
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 10,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 120,
      '&:focus': {
        width: 200,
      },
    },
  },
  button: theme.mixins.gutters({
    marginRight: theme.spacing.unit
  }),
  avatar: {
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit,
  },
  close: {
    padding: theme.spacing.unit / 2
  },
});

interface IStateProps {
  t: IAdminpanelStrings;
};

interface IProps extends IStateProps, WithStyles<typeof styles>{
  close: () => {};
  search: boolean
  appClass: any;
  appFixed: boolean;
};

function TranscriberBar(props: IProps) {
  const { classes, close = null, search = null, t } = props;
  const { appClass=classes.appBar, appFixed=false } = props;
  const [initials] = useGlobal('initials');
  const [dataStore] = useGlobal('dataStore');
  const [organization] = useGlobal('organization');
  const [noClose, setNoClose] = useState(true);
  const [noSearch, setNoSearch] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [view, setView] = useState('');

  const handleOrganizationChange = () => { setView('/organization')}
  const handleClose = () => {
    if (close !== null) {
      close();
   }
  };

  useEffect(() => {
    setNoClose(close === null);
    if (search != null) {
      setNoSearch(!search);
    }
  }, []);

  useEffect(() => {
    if (organization !== null) {
        (dataStore as Store).query(q => q.findRecord({type: 'organization', id: organization as string})).
            then((organizationRec: Organization) => {
                setOrgName(organizationRec.attributes.name);
            })
    }
  }, [organization])

  if (view !== '') return <Redirect to={view} />;

  return (
    <AppBar className={appClass} position={appFixed? "fixed": "static"}>
    <Toolbar>
      <IconButton
        className={classNames(classes.menuButton, {
          [classes.hide]: noClose,
        })}>
        <BackIcon onClick={handleClose} />
      </IconButton>
      <Button className={classes.button} onClick={handleOrganizationChange}>
        <Typography variant="h6" color="inherit">
            {orgName}
        </Typography>
      </Button>
      <Typography variant="h6" color="inherit" className={classes.grow}>
          {t.transcriberAdmin}
      </Typography>
      <div className={classes.grow} />
      <div className={classNames(classes.search, {
          [classes.hide]: noSearch,
        })}>
        <div className={classes.searchIcon}>
          <SearchIcon />
        </div>
        <InputBase
          placeholder={t.search}
          classes={{
            root: classes.inputRoot,
            input: classes.inputInput,
          }}
        />
      </div>
      <Avatar className={classes.avatar}>
          {initials}
      </Avatar>
    </Toolbar>
  </AppBar>
)
  
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "adminpanel"})
});

export default withStyles(styles, { withTheme: true })(
      connect(mapStateToProps)(TranscriberBar) as any
  ) as any;
