import { Box, Stack } from '@mui/material';
import { DragHandle } from '../../../control/DragHandle';
import { ProjectD } from '../../../model';

interface IProps {
  value: ProjectD;
  header?: boolean;
}

export const TableRow = ({ value, header }: IProps) => {
  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      <span>
        <DragHandle />
        {'\u00A0'}
      </span>
      <Box sx={{ minWidth: 100, textAlign: 'center' }}>
        {value.attributes.name}
      </Box>
    </Stack>
  );
};
