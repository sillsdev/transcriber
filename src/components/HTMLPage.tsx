import { makeStyles, createStyles, Theme } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    page: {
      margin: theme.spacing(4),
    },
  })
);

export const HTMLPage = ({ text }: { text: string }) => {
  const classes = useStyles();
  return (
    <div
      className={classes.page}
      dangerouslySetInnerHTML={{
        __html: text,
      }}
    />
  );
};
