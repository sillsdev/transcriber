import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import usePassageDetailContext from '../../context/usePassageDetailContext';

interface IProps {
  onSelect: (id: string) => void;
}

export const DiscussionMove = ({ onSelect }: IProps) => {
  const { workflow } = usePassageDetailContext();

  const handle = (id: string) => () => {
    console.log(`choice is ${id}`);
    onSelect(id);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      <List>
        {workflow.map((w) => (
          <ListItem key={w.id} id={w.id} disablePadding>
            <ListItemButton onClick={handle(w.id)}>
              <ListItemText primary={w.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
