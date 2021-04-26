import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.palette.background.paper,
    },
  })
);

export function SpellCustomList() {
  const classes = useStyles();
  const [list, setList] = React.useState<string[]>([]);
  const [refresh, setRefresh] = React.useState(0);

  const handleDelete = (value: string) => () => {
    ipc?.invoke('customRemove', value);
    setRefresh(refresh + 1);
  };

  React.useEffect(() => {
    ipc?.invoke('customList').then((list) => {
      setList(list);
    });
  }, [refresh]);

  return (
    <List className={classes.root}>
      {list.sort().map((value, i) => {
        const labelId = `custom-${i}`;

        return (
          <ListItem key={i} role={undefined} dense>
            <ListItemText id={labelId} primary={value} />
            <ListItemSecondaryAction>
              <IconButton
                onClick={handleDelete(value)}
                edge="end"
                aria-label="comments"
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        );
      })}
    </List>
  );
}

export default SpellCustomList;
