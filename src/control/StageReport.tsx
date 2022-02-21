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

interface IProps {
  step: string;
  onClick?: any;
}

export const StageReport = ({ step, onClick }: IProps) => {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <div id="stage-report" className={classes.step}>
      <Stage
        id=""
        label={step}
        color={theme.palette.grey[300]}
        select={onClick}
      />
    </div>
  );
};
