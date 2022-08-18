import { styled } from '@mui/material';
import { SortableHandle } from 'react-sortable-hoc';
import { LightTooltip } from './LightTooltip';
import { IMediaActionsStrings } from '../model';
import { mediaActionsSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

const HandleSpan = styled('span')(() => ({ cursor: 'move' }));

export const DragHandle = SortableHandle(() => {
  const t: IMediaActionsStrings = useSelector(
    mediaActionsSelector,
    shallowEqual
  );

  return (
    <LightTooltip title={t.drag}>
      <HandleSpan>::</HandleSpan>
    </LightTooltip>
  );
});
