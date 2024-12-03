import { useEffect, useState } from 'react';
import { MarkDownEdit } from '../../control/MarkDownEdit';
import { Box } from '@mui/material';
import { ActionRow, PriButton } from '../../control';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';
import { ISharedStrings } from '../../model';

interface IProps {
  toolSettings: string;
  onChange: (toolSettings: string) => void;
}

export const DiscussStepSettings = ({ toolSettings, onChange }: IProps) => {
  const [value, setValue] = useState<string>('');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  useEffect(() => {
    if (toolSettings) {
      var json = JSON.parse(toolSettings);
      setValue(json.markDown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolSettings]);

  const handleChange = (value: string | null) => {
    setValue(value || '');
  };

  const handleSave = () => {
    onChange(JSON.stringify({ markDown: value }));
  };

  return (
    <Box>
      <MarkDownEdit inValue={value} onValue={handleChange} />
      <ActionRow>
        <PriButton onClick={handleSave}>{ts.save}</PriButton>
      </ActionRow>
    </Box>
  );
};
