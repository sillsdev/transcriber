import { CSSProperties, useEffect, useState } from 'react';
import { useGlobal } from 'reactn';
import { ListItem, Tooltip, Box } from '@mui/material';
import { IRow } from '../../../context/PassageDetailContext';
import { DragHandle } from '.';
import { IPassageDetailArtifactsStrings, RoleNames } from '../../../model';
import { useOrganizedBy } from '../../../crud';
import { useSelector, shallowEqual } from 'react-redux';
import { resourceSelector } from '../../../selector';

interface IProps {
  value: IRow;
  header?: boolean;
}

export const TableRow = ({ value, header }: IProps) => {
  const [projRole] = useGlobal('projRole');
  const [headBold, setHeadBold] = useState<CSSProperties>({});
  const [headHide, setHeadHide] = useState<CSSProperties>({});
  const { getOrganizedBy } = useOrganizedBy();
  const t: IPassageDetailArtifactsStrings = useSelector(
    resourceSelector,
    shallowEqual
  );

  useEffect(() => {
    setHeadBold(header ? { fontWeight: 'bold' } : {});
    setHeadHide(header ? { visibility: 'hidden' } : {});
  }, [header]);

  return (
    <ListItem>
      {projRole === RoleNames.Admin && (
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
      {projRole === RoleNames.Admin && (
        <Box style={headBold} sx={{ minWidth: 100, textAlign: 'center' }}>
          {value.editAction}
        </Box>
      )}
    </ListItem>
  );
};
