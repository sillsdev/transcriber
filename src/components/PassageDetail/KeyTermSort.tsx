import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { SortBy } from '../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../model';
import { keyTermsSelector } from '../../selector';

interface IProps {
  initSort?: SortBy;
  onChange: (sortBy: SortBy) => void;
}

export default function BasicSelect({ initSort, onChange }: IProps) {
  const [sort, setSort] = React.useState<SortBy>(initSort ?? SortBy.Word);
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  const handleChange = (event: SelectChangeEvent) => {
    const newValue = event.target.value as SortBy;
    setSort(newValue);
    onChange(newValue);
  };

  React.useEffect(() => {
    if (initSort) setSort(initSort);
  }, [initSort]);

  return (
    <Box sx={{ maxWidth: 160, m: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="sort-select-label">{t.sortShow}</InputLabel>
        <Select
          labelId="sort-select-label"
          id="sort-select"
          value={sort}
          label={t.sortShow}
          onChange={handleChange}
        >
          <MenuItem value={SortBy.Word}>{t.word}</MenuItem>
          <MenuItem value={SortBy.Gloss}>{t.gloss}</MenuItem>
          <MenuItem value={SortBy.Transliteration}>
            {t.transliteration}
          </MenuItem>
          <MenuItem value={SortBy.All}>{t.all}</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
