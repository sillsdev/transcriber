import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useSelector } from 'react-redux';
import { shallowEqual } from 'react-redux';
import { IMediaTabStrings } from '../../model';
import { mediaTabSelector } from '../../selector';

interface IProps {
  versions: number[];
  onChange: (version: number) => void;
}

export default function SelectLatest({ versions, onChange }: IProps) {
  const [latest, setLatest] = React.useState(0);
  const t = useSelector(mediaTabSelector, shallowEqual) as IMediaTabStrings;

  React.useEffect(() => {
    const latest = Math.max(...versions);
    setLatest(latest);
  }, [versions]);

  const handleChange = (event: SelectChangeEvent) => {
    const newLatest = parseInt(event.target.value);
    if (newLatest === latest) return;
    setLatest(newLatest);
    onChange(newLatest);
  };

  return (
    <Box sx={{ minWidth: 120, p: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="select-latest-label">{t.latestVersion}</InputLabel>
        <Select
          labelId="select-latest-label"
          id="select-latest"
          value={versions.includes(latest) ? `${latest}` : ''}
          label={t.latestVersion}
          onChange={handleChange}
        >
          {versions.map((v) => (
            <MenuItem key={v} value={v}>{`${v}`}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
