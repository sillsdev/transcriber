import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import busyImage from '../assets/progress.gif';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    busy: {
      display: 'flex',
      height: `calc(100vh - 120px)`,
    },
    img: {
      width: '120px',
      margin: 'auto',
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
