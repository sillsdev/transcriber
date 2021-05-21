import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import audacityLogo from '../assets/audacity.png';

const useStyles = makeStyles({
  logo: {
    width: '24px',
    height: '24px',
  },
});

export const AudacityLogo = () => {
  const classes = useStyles();

  return (
    <img src={audacityLogo} alt="Audacity Logo" className={classes.logo} />
  );
};
export default AudacityLogo;
