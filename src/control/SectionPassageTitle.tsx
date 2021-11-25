import {
  createStyles,
  Grid,
  Typography,
  makeStyles,
  Theme,
} from '@material-ui/core';
import { passageDescription, sectionDescription } from '../crud';
import { BookName, Passage, Section } from '../model';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      margin: theme.spacing(1),
    },
    description: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    passage: {
      justifyContent: 'end',
    },
    row: {
      alignItems: 'center',
      whiteSpace: 'nowrap',
    },
  })
);
interface IProps {
  section: Section;
  passage: Passage;
  allBookData: BookName[];
}
export const SectionPassageTitle = (props: IProps) => {
  const { section, passage, allBookData } = props;
  const classes = useStyles();
  return (
    <Grid container direction="row" className={classes.root}>
      <Grid item xs={8}>
        <Typography variant="h6" className={classes.description}>
          {sectionDescription(section) + '\u00A0\u00A0'}
        </Typography>
      </Grid>
      <Grid item xs={4} className={classes.passage}>
        <Typography variant="h6" className={classes.description}>
          {passageDescription(passage, allBookData)}
        </Typography>
      </Grid>
    </Grid>
  );
};
