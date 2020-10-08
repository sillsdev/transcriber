import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import paratextLogo from '../assets/p9logo312o-150x150.png';

const useStyles = makeStyles({
  logo: {
    width: '16px',
    height: '16px',
  },
});

export const ParatextLogo = () => {
  const classes = useStyles();

  return (
    <img src={paratextLogo} alt="Paratext Logo" className={classes.logo} />
  );
};
export default ParatextLogo;
