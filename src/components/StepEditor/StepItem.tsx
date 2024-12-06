import { IconButton, styled, Stack } from '@mui/material';
import HideIcon from '@mui/icons-material/VisibilityOff';
import ShowIcon from '@mui/icons-material/Visibility';
import { IStepRow, DragHandle, stepEditorSelector } from '.';
import StepName from './StepName';
import ToolChoice from './ToolChoice';
import { shallowEqual, useSelector } from 'react-redux';
import { IStepEditorStrings } from '../../model';
import SettingsIcon from '@mui/icons-material/Settings';

const StepSpan = styled('span')(() => ({ minWidth: 250 }));
const ToolSpan = styled('span')(() => ({ minWidth: 250 }));

interface IProps {
  value: IStepRow;
  index: number;
  isFocused: boolean;
  onNameChange: (name: string, pos: number, index: number) => void;
  onToolChange: (tool: string, index: number) => void;
  onDelete: (index: number) => void;
  onRestore: (index: number) => void;
  onSettings?: (index: number) => void;
  settingsTitle?: string;
}

export const StepItem = ({
  value,
  isFocused,
  onNameChange,
  onToolChange,
  onDelete,
  onRestore,
  onSettings,
  settingsTitle,
}: IProps) => {
  const se: IStepEditorStrings = useSelector(stepEditorSelector, shallowEqual);

  const handleNameChange = (name: string, pos: number) => {
    onNameChange(name, pos, value.rIdx);
  };
  const handleToolChange = (tool: string) => {
    onToolChange(tool, value.rIdx);
  };
  const handleDeleteOrRestore = () => {
    if (value.seq >= 0) onDelete(value.rIdx);
    else onRestore(value.rIdx);
  };
  const handleSettings = () => {
    if (onSettings) onSettings(value.rIdx);
  };

  return (
    <Stack direction="row">
      <DragHandle />
      <StepSpan>
        <StepName
          name={value.name}
          pos={value.pos}
          isFocused={isFocused}
          onChange={handleNameChange}
        />
      </StepSpan>
      <ToolSpan>
        <ToolChoice tool={value.tool} onChange={handleToolChange} />
      </ToolSpan>
      <IconButton
        onClick={handleDeleteOrRestore}
        title={value.seq >= 0 ? se.hide : se.show}
      >
        {value.seq < 0 ? <HideIcon /> : <ShowIcon />}
      </IconButton>
      {onSettings && (
        <IconButton onClick={handleSettings} title={settingsTitle ?? ''}>
          {<SettingsIcon />}
        </IconButton>
      )}
    </Stack>
  );
};
