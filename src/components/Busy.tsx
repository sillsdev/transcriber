import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import busyImage from '../assets/busy.gif';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    busy: {
      width: '100%',
      margin: 'auto',
    },
    img: {
      width: '100%',
    },
  })
);

export default () => {
  const classes = useStyles();
  return (
    <div className={classes.busy}>
      <img className={classes.img} src={busyImage} alt="busy" />
    </div>
  );
};
