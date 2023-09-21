import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { Grid, GridProps, styled, Typography } from '@mui/material';
import { passageRefText, PassageReference, sectionDescription } from '../crud';
import { BookName, Passage, Section, Plan } from '../model';
import { QueryBuilder } from '@orbit/data';

const GridRoot = styled(Grid)<GridProps>(({ theme }) => ({
  display: 'flex',
  margin: theme.spacing(1),
}));

interface IProps {
  section: Section;
  passage: Passage;
  allBookData: BookName[];
}
export const SectionPassageTitle = (props: IProps) => {
  const { section, passage, allBookData } = props;
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
  const ref = passageRefText(passage, allBookData);
  const refDelim = ref !== '' ? `\u00A0-\u00A0` : '';

  return (
    <GridRoot container direction="row">
      <Grid item xs={12}>
        <Typography
          variant="h6"
          id="sectionpassagetitle"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {sectionDescription(section, passNum)}
          {refDelim}
          <PassageReference
            passage={passage}
            bookData={allBookData}
            flat={isFlat}
          />
        </Typography>
      </Grid>
    </GridRoot>
  );
};
