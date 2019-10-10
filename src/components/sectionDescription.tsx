import React from 'react';
import { Section } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { sectionNumber } from '../utils';
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
    name: {
      whiteSpace: 'normal',
    },
  })
);

interface IProps {
  section: Section;
}

const SectionDescription = (props: IProps) => {
  const { section } = props;
  const classes = useStyles();

  const name =
    section && section.attributes && section.attributes.name
      ? section.attributes.name
      : '';

  return (
    <div id="SectionDescription" className={classes.root}>
      <Typography className={classes.number}>
        {sectionNumber(section) + '\u00A0\u00A0'}
      </Typography>
      <Typography className={classes.name}>{name}</Typography>
    </div>
  );
};

export default SectionDescription;
