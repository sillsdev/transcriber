import React from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import moment from 'moment-timezone';

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

const t = {
  lastEdit: 'Last edit {0}',
};

interface IProps {
  when: string | undefined;
}

export const LastEdit = (props: IProps) => {
  const { when } = props;
  const classes = useStyles();
  const [lang] = useGlobal('lang');

  const handleHistory = () => {
    console.log(`display history`);
  };

  moment.locale(lang);
  const curZone = moment.tz.guess();

  return when ? (
    <Button
      key="last-edit"
      aria-label={t.lastEdit}
      variant="text"
      color="primary"
      className={classes.button}
      onClick={handleHistory}
    >
      {t.lastEdit.replace(
        '{0}',
        moment.tz(moment.tz(when, 'utc'), curZone).calendar()
      )}
    </Button>
  ) : (
    <></>
  );
};
