import { CSSProperties, useEffect, useState } from 'react';
import { Tooltip, Box, Stack } from '@mui/material';
import { IRow } from '../../../context/PassageDetailContext';
import { DragHandle } from '.';
import { IPassageDetailArtifactsStrings } from '../../../model';
import { useOrganizedBy, useRole } from '../../../crud';
import { useSelector, shallowEqual } from 'react-redux';
import { resourceSelector } from '../../../selector';

interface IProps {
  value: IRow;
  header?: boolean;
}

export const TableRow = ({ value, header }: IProps) => {
  const [headBold, setHeadBold] = useState<CSSProperties>({});
  const [headHide, setHeadHide] = useState<CSSProperties>({});
  const { getOrganizedBy } = useOrganizedBy();
  const t: IPassageDetailArtifactsStrings = useSelector(
    resourceSelector,
    shallowEqual
  );
  const { userIsAdmin } = useRole();
  useEffect(() => {
    setHeadBold(header ? { fontWeight: 'bold' } : {});
    setHeadHide(header ? { visibility: 'hidden' } : {});
  }, [header]);

  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      {userIsAdmin && (
        <span style={headHide}>
          <DragHandle />
          {'\u00A0'}
        </span>
      )}
      <Box style={headBold} sx={{ minWidth: 100, textAlign: 'center' }}>
        {value.playItem}
      </Box>
      <Box style={headBold} sx={{ width: 300, whiteSpace: 'normal' }}>
        {value.artifactName}
      </Box>
      <Box style={headBold} sx={{ minWidth: 100, textAlign: 'center' }}>
        {value.version}
      </Box>
      <Tooltip
        title={
          Boolean(value.passageId) ? t.passageResource : getOrganizedBy(true)
        }
      >
        <Box style={headBold} sx={{ minWidth: 200 }}>
          {value.artifactType}
        </Box>
      </Tooltip>
      <Box style={headBold} sx={{ minWidth: 200 }}>
        {value.artifactCategory}
      </Box>
      <Box style={headBold} sx={{ minWidth: 100, textAlign: 'center' }}>
        {value.done}
      </Box>
      <Box style={headBold} sx={{ minWidth: 100, textAlign: 'center' }}>
        {value.editAction}
      </Box>
    </Stack>
  );
};
