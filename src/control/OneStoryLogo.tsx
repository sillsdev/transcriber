import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import oneStoryLogo from '../assets/oneStory.png';

const useStyles = makeStyles({
  logo: {
    width: '16px',
    height: '16px',
  },
});

export const OneStoryLogo = () => {
  const classes = useStyles();

  return (
    <img src={oneStoryLogo} alt="OneStory Logo" className={classes.logo} />
  );
};
export default OneStoryLogo;
