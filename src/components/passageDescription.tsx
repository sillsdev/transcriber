import React from 'react';
import { Passage } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { passageNumber } from '../utils';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'row',
    },
    number: {
      width: '2em',
    },
    ref: {
      whiteSpace: 'normal',
    },
  })
);

interface IProps {
  passage: Passage;
}

export const PassageDescription = (props: IProps) => {
  const { passage } = props;
  const classes = useStyles();

  const attr = passage.attributes;
  if (!attr) return null;
  const book = ' ' + (attr.book ? attr.book : '');
  const reference = ' ' + (attr.reference ? attr.reference : '');

  return (
    <div id="SectionDescription" className={classes.root}>
      <Typography className={classes.number}>
        {passageNumber(passage) + '\u00A0\u00A0'}
      </Typography>
      <Typography className={classes.ref}>{book + reference}</Typography>
    </div>
  );
};
export const PassageDescriptionCompare = (a: any, b: any) => {
  if (
    a.props.passage.attributes.sequencenum ===
    b.props.passage.attributes.sequencenum
  )
    return 0;
  return a.props.passage.attributes.sequencenum <
    b.props.passage.attributes.sequencenum
    ? -1
    : 1;
};
