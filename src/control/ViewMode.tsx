import { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { IViewModeStrings } from '../model';
import { viewModeSelector } from '../selector';
import { ActionToggle, SmallBar, UndButton } from './ActionToggle';

export enum ViewOption {
  AudioProject,
  Transcribe,
  Detail,
}

interface IProps {
  mode: ViewOption;
  onMode: (mode: ViewOption) => void;
}

export function ViewMode(props: IProps) {
  const { mode, onMode } = props;
  const [viewOption, setViewOption] = useState<ViewOption>(props.mode);
  const t: IViewModeStrings = useSelector(viewModeSelector, shallowEqual);

  const handleMode = (mode: ViewOption) => () => {
    setViewOption(mode);
    onMode(mode);
  };

  return (
    <ActionToggle>
      <UndButton
        id="audioProjectMode"
        active={viewOption === ViewOption.AudioProject}
        onClick={handleMode(ViewOption.AudioProject)}
      >
        {t.audioProject}
      </UndButton>
      <SmallBar />
      {mode !== ViewOption.Detail && (
        <UndButton
          id="transcribeMode"
          active={viewOption === ViewOption.Transcribe}
          onClick={handleMode(ViewOption.Transcribe)}
        >
          {t.transcribe}
        </UndButton>
      )}
      {mode === ViewOption.Detail && (
        <UndButton
          id="detailMode"
          active={viewOption === ViewOption.Detail}
          onClick={handleMode(ViewOption.Detail)}
        >
          {'Detail'}
        </UndButton>
      )}
    </ActionToggle>
  );
}

export default ViewMode;
