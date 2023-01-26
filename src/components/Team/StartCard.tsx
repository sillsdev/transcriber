import React from 'react';
import {
  Card,
  CardActions,
  CardContent,
  CardContentProps,
  CardProps,
  styled,
  Typography,
} from '@mui/material';
import { TeamContext } from '../../context/TeamContext';
import { AltButton, PriButton } from '../StepEditor';

const StyledCard = styled(Card)<CardProps>(({ theme }) => ({
  width: 375,
  height: 310,
  margin: theme.spacing(1),
  marginTop: theme.spacing(4),
}));

const StyledCardContent = styled(CardContent)<CardContentProps>(
  ({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: 200,
  })
);

interface IProps {
  id: string;
  title: string;
  description: string;
  factors: string[];
  primary: string;
  onPrimary: (e: React.MouseEvent) => void;
  secondary?: string;
  onSecondary?: (e: React.MouseEvent) => void;
}

const StartCard = (props: IProps) => {
  const {
    id,
    title,
    description,
    factors,
    primary,
    onPrimary,
    secondary,
    onSecondary,
  } = props;
  const ctx = React.useContext(TeamContext);
  const { newProjectStrings } = ctx.state;
  const t = newProjectStrings;

  return (
    <StyledCard id={id}>
      <StyledCardContent>
        <>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <Typography sx={{ mb: 2, color: 'grey' }}>{description}</Typography>
          <Typography variant="h6" component="p" sx={{ fontSize: '1rem' }}>
            {t.keyFactors}
          </Typography>
          {factors.map((factor) => (
            <Typography
              variant="body2"
              component="p"
              sx={{ color: 'grey', ml: 2, mb: 1, textIndent: '-6px' }}
            >{`\u2022 ${factor}`}</Typography>
          ))}
        </>
      </StyledCardContent>
      <CardActions sx={{ justifyContent: 'center' }}>
        <>
          <PriButton onClick={onPrimary}>{primary}</PriButton>
          {secondary && (
            <AltButton onClick={onSecondary}>{secondary}</AltButton>
          )}
        </>
      </CardActions>
    </StyledCard>
  );
};

export default StartCard;
