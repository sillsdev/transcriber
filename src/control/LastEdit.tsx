import React from 'react';
import { useGlobal } from 'reactn';
import { IPlanSheetStrings } from '../model';
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

interface IStateProps {
  t: IPlanSheetStrings;
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
