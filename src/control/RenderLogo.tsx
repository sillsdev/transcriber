import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import renderLogo from '../assets/renderIcon.png';

const useStyles = makeStyles({
  logo: {
    width: '16px',
    height: '16px',
  },
});

export const RenderLogo = () => {
  const classes = useStyles();

  return <img src={renderLogo} alt="Render Logo" className={classes.logo} />;
};
export default RenderLogo;
