import React from 'react';
import { useGlobal } from 'reactn';
import { ISharedStrings } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import { dateOrTime } from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      margin: theme.spacing(1),
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      justifyContent: 'flex-start',
      textTransform: 'none',
    },
  })
);

interface IStateProps {
  t: ISharedStrings;
}

interface IProps extends IStateProps {
  when: string | undefined;
}

export const LastEdit = (props: IProps) => {
  const { when, t } = props;
  const classes = useStyles();
  const [lang] = useGlobal('lang');

  const handleHistory = () => {
    console.log(`display history`);
  };

  return when ? (
    <Button
      id="editHist"
      key="last-edit"
      aria-label={t.lastEdit}
      variant="text"
      color="primary"
      className={classes.button}
      onClick={handleHistory}
    >
      {t.lastEdit.replace('{0}', dateOrTime(when, lang))}
    </Button>
  ) : (
    <></>
  );
};
