import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    grow: {
      flexGrow: 1,
    },
    paper: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      paddingLeft: theme.spacing(4),
    },
    group: {
      paddingBottom: theme.spacing(3),
    },
    label: {
      display: 'flex',
      // color: theme.palette.primary.dark,
    },
    noProjects: {
      marginLeft: theme.spacing(3),
      marginRight: theme.spacing(3),
      backgroundColor: theme.palette.grey[200],
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    dense: {
      marginTop: 16,
    },
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }),
    button: {
      margin: theme.spacing(1),
    },
    addButton: {
      marginRight: theme.spacing(2),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    detail: {
      paddingTop: 0,
      marginTop: 0,
    },
    avatar: {
      alignSelf: 'start',
    },
    menu: {
      width: 200,
    },
  })
);

export default useStyles;
