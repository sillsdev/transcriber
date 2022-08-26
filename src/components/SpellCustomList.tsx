import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;

export function SpellCustomList() {
  const [list, setList] = React.useState<string[]>([]);
  const [refresh, setRefresh] = React.useState(0);

  const handleDelete = (value: string) => () => {
    ipc?.invoke('customRemove', value);
    setRefresh(refresh + 1);
  };

  React.useEffect(() => {
    ipc?.invoke('customList').then((list: string[]) => {
      setList(list);
    });
  }, [refresh]);

  return (
    <List
      sx={{ width: '100%', maxWidth: 360, backgroundColor: 'background.paper' }}
    >
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
