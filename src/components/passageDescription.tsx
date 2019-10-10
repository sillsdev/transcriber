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

const SectionDescription = (props: IProps) => {
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

export default SectionDescription;
