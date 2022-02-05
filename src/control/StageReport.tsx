import { makeStyles, useTheme } from '@material-ui/core';
import { Stage } from '.';

const useStyles = makeStyles({
  step: {
    display: 'flex',
    flexDirection: 'column',
    '& svg': {
      height: '20px',
      width: '120px',
    },
  },
});

export const StageReport = ({ step }: { step: string }) => {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <div className={classes.step}>
      <Stage id="" label={step} color={theme.palette.grey[300]} />
    </div>
  );
};
