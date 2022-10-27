import {
  Paper,
  PaperProps,
  styled,
  Typography,
  TypographyProps,
} from '@mui/material';

export const TeamPaper = styled(Paper)<PaperProps>(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.default,
  marginBottom: theme.spacing(2),
  '& .MuiPaper-rounded': {
    borderRadius: '8px',
  },
}));

export const TeamHeadDiv = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
}));

export const TeamName = styled(Typography)<TypographyProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
}));
