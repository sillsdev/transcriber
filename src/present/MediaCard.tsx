import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import logo from '../logo.svg';
import Typography from '@material-ui/core/Typography';

const styles = {
  card: {
    maxWidth: 150,
  },
  media: {
    height: 150,
  },
};

export interface Props extends WithStyles<typeof styles> {
    type: string;
    explain?: string;
    graphic?: string;
}

function MediaCard(props: Props) {
  const { classes, type, explain } = props;
  return (
    <Card className={classes.card}>
      <CardActionArea>
        <CardMedia
          className={classes.media}
          image={logo}
          title="Contemplative Reptile"
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            {type}
          </Typography>
          <Typography component="p">
            {explain}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

MediaCard.propTypes = {
  classes: PropTypes.object.isRequired,
} as any;

export default withStyles(styles)(MediaCard);