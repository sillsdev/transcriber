import {
  List,
  ListItem,
  ListSubheader,
  ListItemIcon,
  Typography,
  Grid,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ReactElement } from 'react';

export interface FactorDecorate {
  [key: string]: ReactElement;
}

interface IProps {
  title: string;
  decorate?: ReactElement;
  prose: string;
  keyFactorTitle: string;
  factors: string[];
  factorDecorate?: FactorDecorate;
}

const KindHead = (props: { text: string; decorate?: ReactElement }) => (
  <Typography variant="h6">
    {props.text}
    {props.decorate}
  </Typography>
);

const Prose = ({ text }: { text: string }) => {
  return <Typography sx={{ fontSize: 'small' }}>{text}</Typography>;
};

const KeyFactorsHead = ({ title }: { title: string }) => {
  return <ListSubheader>{title}</ListSubheader>;
};

const Bullet = () => (
  <ListItemIcon>
    <ChevronRightIcon />
  </ListItemIcon>
);

export const KeyFactorsList = ({
  keyFactorTitle,
  factors,
  decorator,
}: {
  keyFactorTitle: string;
  factors: string[];
  decorator?: FactorDecorate;
}) => {
  return (
    <List dense subheader={<KeyFactorsHead title={keyFactorTitle} />}>
      {factors.map((f, i) => (
        <ListItem key={i}>
          <Bullet />
          <span>
            {f}
            {decorator && decorator[f]}
          </span>
        </ListItem>
      ))}
    </List>
  );
};

export const ChoiceHead = (props: IProps) => {
  const { title, decorate, prose, keyFactorTitle, factors, factorDecorate } =
    props;
  return (
    <>
      <KindHead text={title} decorate={decorate} />
      <Grid container spacing={1}>
        <Grid item md={6} xs={12}>
          <Prose text={prose} />
        </Grid>
        <Grid item md={6} xs={12}>
          <KeyFactorsList
            keyFactorTitle={keyFactorTitle}
            factors={factors}
            decorator={factorDecorate}
          />
        </Grid>
      </Grid>
    </>
  );
};
