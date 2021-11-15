import { createStyles, Grid, makeStyles, Theme } from '@material-ui/core';
import { passageDescription, sectionDescription } from '../crud';
import { BookName, Passage, Section } from '../model';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    description: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
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
    <Grid container direction="row" className={classes.row}>
      <Grid item xs={9} className={classes.description}>
        {sectionDescription(section)}
      </Grid>
      <Grid item>{passageDescription(passage, allBookData)}</Grid>
    </Grid>
  );
};
