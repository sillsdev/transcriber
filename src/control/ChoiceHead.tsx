import {
  List,
  ListItem,
  ListSubheader,
  ListItemIcon,
  Typography,
  makeStyles,
  Theme,
  createStyles,
  Grid,
} from '@material-ui/core';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import React, { ReactElement } from 'react';
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    notes: {
      fontSize: 'small',
    },
  })
);

interface IProps {
  title: string;
  prose: string;
  keyFactorTitle: string;
  factors: string[];
}

const KindHead = (props: { text: string; decorate?: ReactElement }) => (
  <Typography variant="h6">
    {props.text}
    {props.decorate}
  </Typography>
);

const Prose = ({ text }: { text: string }) => {
  const classes = useStyles();
  return <Typography className={classes.notes}>{text}</Typography>;
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
}: {
  keyFactorTitle: string;
  factors: string[];
}) => {
  return (
    <List dense subheader={<KeyFactorsHead title={keyFactorTitle} />}>
      {factors.map((f, i) => (
        <ListItem key={i}>
          <Bullet />
          {f}
        </ListItem>
      ))}
    </List>
  );
};

export const ChoiceHead = (props: IProps) => {
  const { title, prose, keyFactorTitle, factors } = props;
  return (
    <>
      <KindHead text={title} />
      <Grid container spacing={1}>
        <Grid item md={6} xs={12}>
          <Prose text={prose} />
        </Grid>
        <Grid item md={6} xs={12}>
          <KeyFactorsList keyFactorTitle={keyFactorTitle} factors={factors} />
        </Grid>
      </Grid>
    </>
  );
};
