import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { IState } from './model/state'
import { IMediacardStrings } from './model/localizeModel';
import localStrings from './selector/localize';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import logo from './logo.svg';
import Typography from '@material-ui/core/Typography';

export interface IProps extends IStateProps, WithStyles<typeof styles> {
    type: string;
    explain?: string;
    graphic?: string;
}

export function MediaCard(props: IProps) {
  const { classes, type, explain, graphic, t } = props;
  console.log(graphic)
  return (
    <Card className={classes.card}>
      <CardActionArea>
        <CardMedia
          className={classes.media}
          image={graphic != null? graphic: logo}
          title={t.section}
        />
        <CardContent>
          <Typography gutterBottom variant={type.length > 8? "h6": "h5"} component="h2" style={{textDecoration: 'none'}}>
            {type}
          </Typography>
          <Typography component="p" style={{textDecoration: 'none'}}>
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

const styles = {
  card: {
    maxWidth: 150,
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 16,
  },
  media: {
    height: 150,
  },
};

interface IStateProps {
  t: IMediacardStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "mediacard"})
});

export default withStyles(styles, { withTheme: true })(
      connect(mapStateToProps)(MediaCard) as any
  ) as any;
