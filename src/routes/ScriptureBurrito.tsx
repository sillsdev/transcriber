import {
  Avatar,
  Grid,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import React from 'react';
import StickyRedirect from '../components/StickyRedirect';
import { useLocation, useParams } from 'react-router-dom';
import Check from '@mui/icons-material/Check';
import { useOrgDefaults } from '../crud/useOrgDefaults';
import { BurritoHeader } from '../components/BurritoHeader';
import { PriButton } from '../control';
import { useCreateBurrito } from './useCreateBurrito';

const setup = ['Books', 'Contents', 'Wrapper', 'Version', 'Format'];

export function ScriptureBurrito() {
  const { pathname } = useLocation();
  const { teamId } = useParams();
  const [view, setView] = React.useState('');
  const [completed, setCompleted] = React.useState<number[]>([]);
  const { getOrgDefault } = useOrgDefaults();
  const createBurrito = useCreateBurrito(teamId || '');

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const index = setup.indexOf(event.currentTarget.textContent?.trim() || '');
    if (index !== -1) {
      setCompleted((prev) => [...prev, index]);
      setView(`/burrito/${teamId}/${setup[index].toLowerCase()}`);
    }
  };

  const ready = () =>
    completed.includes(0) && completed.includes(1) && completed.includes(2);

  React.useEffect(() => {
    const newCompleted: number[] = [];
    setup.forEach((item, index) => {
      const value = getOrgDefault(`burrito${item}`, teamId);
      if (value) {
        newCompleted.push(index);
      }
    });
    setCompleted(newCompleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (view !== '' && view !== pathname) {
    return <StickyRedirect to={view} />;
  }

  return (
    <BurritoHeader setView={setView} teamId={teamId}>
      <Grid container direction="column" spacing={2} alignItems="center">
        <List sx={{ pt: 3 }}>
          {setup.map((item, index) => (
            <ListItemButton key={index} onClick={handleClick}>
              <ListItemAvatar>
                <Avatar>{completed.includes(index) ? <Check /> : ' '}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={item} />
            </ListItemButton>
          ))}
        </List>
        <Grid item>
          <PriButton onClick={() => createBurrito()} disabled={!ready()}>
            Create Burrito
          </PriButton>
        </Grid>
      </Grid>
    </BurritoHeader>
  );
}
