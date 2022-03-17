import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import {
  createStyles,
  Grid,
  Typography,
  makeStyles,
  Theme,
} from '@material-ui/core';
import { passageReference, sectionDescription } from '../crud';
import { BookName, Passage, Section, Plan } from '../model';
import { QueryBuilder } from '@orbit/data';

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
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');

  const isFlat = useMemo(() => {
    const plans = (
      memory.cache.query((q: QueryBuilder) => q.findRecords('plan')) as Plan[]
    ).filter((p) => p.id === plan);
    return plans.length === 0 || plans[0].attributes?.flat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const passNum = !isFlat ? passage : undefined;
  const ref = passageReference(passage, allBookData);
  const refText = ref !== '' ? ` - ${ref}` : '';

  return (
    <Grid container direction="row" className={classes.root}>
      <Grid item xs={12}>
        <Typography
          variant="h6"
          id="sectionpassagetitle"
          className={classes.description}
        >
          {sectionDescription(section, passNum) + refText}
        </Typography>
      </Grid>
    </Grid>
  );
};
