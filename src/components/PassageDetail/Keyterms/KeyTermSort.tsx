import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent, SelectProps } from '@mui/material/Select';
import { SortBy } from './useKeyTerms';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../../model';
import { keyTermsSelector } from '../../../selector';
import { styled } from '@mui/material';

const StyledSelect = styled(Select)<SelectProps>(() => ({
  '& #sort-select': {
    paddingTop: '5px',
    paddingBottom: '5px',
  },
}));

interface IProps {
  initSort?: SortBy;
  onChange: (sortBy: SortBy) => void;
}

export default function BasicSelect({ initSort, onChange }: IProps) {
  const [sort, setSort] = React.useState<SortBy>(initSort ?? SortBy.Word);
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newValue = event.target.value as SortBy;
    setSort(newValue);
    onChange(newValue);
  };

  React.useEffect(() => {
    if (initSort) setSort(initSort);
  }, [initSort]);

  return (
    <Box sx={{ minWidth: '100px', maxWidth: '160px', m: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="sort-select-label">{t.sortShow}</InputLabel>
        <StyledSelect
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
        </StyledSelect>
      </FormControl>
    </Box>
  );
}
