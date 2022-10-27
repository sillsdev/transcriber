import { styled, Typography, TypographyProps } from '@mui/material';

export const StyledHeading = styled(Typography)<TypographyProps>(
  ({ theme }) => ({
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  })
);
