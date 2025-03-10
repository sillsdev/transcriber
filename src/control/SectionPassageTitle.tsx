import { useContext, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Grid, GridProps, styled, Typography } from '@mui/material';
import {
  passageRefText,
  PassageReference,
  sectionDescription,
  usePlanType,
} from '../crud';
import { BookName, Passage, Section, SharedResourceD } from '../model';
import { PassageDetailContext } from '../context/PassageDetailContext';

const GridRoot = styled(Grid)<GridProps>(({ theme }) => ({
  display: 'flex',
  margin: theme.spacing(1),
}));

interface IProps {
  section: Section;
  passage: Passage;
  allBookData: BookName[];
  sharedResource: SharedResourceD | undefined;
}
export const SectionPassageTitle = (props: IProps) => {
  const { section, passage, allBookData, sharedResource } = props;
  const [plan] = useGlobal('plan'); //will be constant here
  const { sectionArr } = useContext(PassageDetailContext).state;
  const sectionMap = new Map<number, string>(sectionArr);
  const planType = usePlanType();

  const isFlat = useMemo(
    () => planType(plan)?.flat,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan]
  );

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
          {sectionDescription(section, sectionMap, passNum)}
          {refDelim}
          <PassageReference
            passage={passage}
            bookData={allBookData}
            flat={isFlat}
            sharedResource={sharedResource}
          />
        </Typography>
      </Grid>
    </GridRoot>
  );
};
