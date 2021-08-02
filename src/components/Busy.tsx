import { makeStyles } from '@material-ui/core/styles';
import busyImage from '../assets/progress.gif';

const useStyles = makeStyles({
  busy: {
    display: 'flex',
    height: '100vh',
  },
  img: {
    width: '120px',
    margin: 'auto',
  },
});

const Busy = () => {
  const classes = useStyles();
  return (
    <div className={classes.busy}>
      <img className={classes.img} src={busyImage} alt="busy" />
    </div>
  );
};

export default Busy;
